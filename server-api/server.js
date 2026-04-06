const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '8060468556:AAFdv3dQ7kL-9BrAlx0HjFWfj4H9fIDFAeE';
const ADMIN_CHAT_ID = 737113132; // Admin Telegram chat ID

// Telegram Helper
function sendTelegramMessage(chatId, text) {
    if (!chatId) return;
    const body = JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'HTML' });
    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    };
    const req = https.request(options, () => {});
    req.on('error', (e) => console.error("Telegram API Error:", e));
    req.write(body);
    req.end();
}

const { MongoClient } = require('mongodb');
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = 'durlovely';
let client;
let db;

async function getDb() {
    if (!MONGODB_URI) return null;
    if (!db) {
        try {
            client = new MongoClient(MONGODB_URI);
            await client.connect();
            db = client.db(DATABASE_NAME);
            console.log("✅ Successfully connected to MongoDB Atlas");
        } catch (error) {
            console.error("❌ MongoDB Connection Error:", error);
            db = null;
        }
    }
    return db;
}

async function dbRequest(action, collectionName, body = {}) {
    if (!MONGODB_URI) {
        return localDbFallback(action, collectionName, body);
    }
    try {
        const database = await getDb();
        if (!database) throw new Error("Database not connected");
        
        const collection = database.collection(collectionName);
        if (action === 'find') {
            const docs = await collection.find(body.filter || {}).toArray();
            return { documents: docs };
        }
        if (action === 'findOne') {
            const doc = await collection.findOne(body.filter || {});
            return { document: doc };
        }
        if (action === 'insertOne') {
            const result = await collection.insertOne(body.document);
            return { insertedId: result.insertedId };
        }
        if (action === 'updateOne') {
            const result = await collection.updateOne(body.filter, body.update);
            return { modifiedCount: result.modifiedCount };
        }
        if (action === 'deleteOne') {
            const result = await collection.deleteOne(body.filter);
            return { deletedCount: result.deletedCount };
        }
    } catch (e) {
        console.error("DB Error:", e);
        return { documents: [], document: null };
    }
    return { documents: [] };
}

function localDbFallback(action, collection, body) {
    const DATA_FILE = path.join(__dirname, 'data.json');
    if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ orders: [], products: [], categories: [], customers: [], notifications: [] }));
    let data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    if (action === 'find') return { documents: data[collection] || [] };
    if (action === 'findOne') return { document: (data[collection] || []).find(x => x.id == body.filter?.id || x.tgId == body.filter?.tgId || x.phone == body.filter?.phone) };
    if (action === 'insertOne') {
        if (!data[collection]) data[collection] = [];
        data[collection].push(body.document);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return { insertedId: body.document.id };
    }
    if (action === 'updateOne') {
        const idx = (data[collection] || []).findIndex(x => x.id == body.filter?.id || x.phone == body.filter?.phone || x.tgId == body.filter?.tgId);
        if (idx !== -1) {
            data[collection][idx] = { ...data[collection][idx], ...body.update.$set };
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        }
        return { modifiedCount: 1 };
    }
    return { documents: [] };
}
;

async function autoMigrate() {
    if (!MONGODB_URI) return;
    try {
        const db = await getDb();
        const productsCount = await db.collection('products').countDocuments();
        if (productsCount === 0) {
            const DATA_FILE = path.join(__dirname, 'data.json');
            if (fs.existsSync(DATA_FILE)) {
                console.log("🚛 Starting Auto-Migration to Atlas...");
                const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                if (data.products?.length) await db.collection('products').insertMany(data.products);
                if (data.categories?.length) await db.collection('categories').insertMany(data.categories.map(c => ({ name: c })));
                if (data.customers?.length) await db.collection('customers').insertMany(data.customers);
                if (data.orders?.length) await db.collection('orders').insertMany(data.orders);
                if (data.notifications?.length) await db.collection('notifications').insertMany(data.notifications);
                console.log("✅ Auto-Migration Complete!");
            }
        }
    } catch (e) {
        console.error("Migration Error:", e);
    }
}

const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Pinggy-No-Screen', 'true');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const setJSON = () => res.setHeader('Content-Type', 'application/json');

    // API: Image Upload
    if (req.url === '/api/upload' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const { name, data } = JSON.parse(body);
                // Extract base64 data (remove "data:image/png;base64,")
                const base64Data = data.replace(/^data:image\/\w+;base64,/, "");
                const ext = name.split('.').pop();
                const fileName = `upload_${Date.now()}.${ext}`;
                const uploadDir = path.join(__dirname, '..', 'shared-assets', 'assets', 'images');
                
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                
                fs.writeFileSync(path.join(uploadDir, fileName), base64Data, 'base64');
                
                setJSON();
                res.end(JSON.stringify({ 
                    success: true, 
                    url: `../shared-assets/assets/images/${fileName}` 
                }));
            } catch (err) {
                console.error("Upload error:", err);
                setJSON();
                res.writeHead(500);
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // API: Products
    if (req.url.startsWith('/api/products') && req.method === 'GET') {
        const result = await dbRequest('find', 'products');
        setJSON();
        res.end(JSON.stringify(result.documents || []));
        return;
    }

    if (req.url === '/api/products' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const product = JSON.parse(body);
            product.id = Date.now();
            await dbRequest('insertOne', 'products', { document: product });
            setJSON();
            res.end(JSON.stringify({ success: true, product }));
        });
        return;
    }

    if (req.url.startsWith('/api/products/') && (req.method === 'PUT' || req.method === 'POST' && req.url.includes('update'))) {
        const id = parseInt(req.url.split('/')[3]);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const update = JSON.parse(body);
            await dbRequest('updateOne', 'products', { filter: { id: id }, update: { $set: update } });
            setJSON();
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    if (req.url.startsWith('/api/products/') && req.method === 'DELETE') {
        const id = parseInt(req.url.split('/')[3]);
        await dbRequest('deleteOne', 'products', { filter: { id: id } });
        setJSON();
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // Telegram Bot Webhook
    if (req.url === '/bot/webhook' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const update = JSON.parse(body);
            const message = update.message;
            if (!message) { res.end('ok'); return; }
            const chatId = message.chat.id;

            if (message.text === '/start') {
                const welcomeBody = JSON.stringify({
                    chat_id: chatId,
                    text: `<b>DURLOVELY PARFUM</b> ga xush kelibsiz! ✨\n\n🌹 Premium va original iforlar olamiga kirish uchun raqamingizni ulashing:`,
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [[{ text: '📱 Raqamni ulashish', request_contact: true }]],
                        resize_keyboard: true,
                        one_time_keyboard: true
                    }
                });
                const opts = {
                    hostname: 'api.telegram.org', port: 443, method: 'POST',
                    path: `/bot${BOT_TOKEN}/sendMessage`,
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(welcomeBody) }
                };
                const tgReq = https.request(opts);
                tgReq.write(welcomeBody); tgReq.end();
            }

            if (message.contact) {
                const contact = message.contact;
                let phone = contact.phone_number || '';
                if (!phone.startsWith('+')) phone = '+' + phone;
                
                const search = await dbRequest('findOne', 'customers', { filter: { phone: phone } });
                if (!search.document) {
                    const customer = {
                        id: Date.now(), phone, tgId: chatId,
                        firstName: contact.first_name || '',
                        dateJoined: new Date().toLocaleDateString(),
                        dur: 0, durHistory: [], isVip: false
                    };
                    await dbRequest('insertOne', 'customers', { document: customer });
                    sendTelegramMessage(chatId, `✅ <b>Raqamingiz tasdiqlandi!</b>\n\n<b>${phone}</b> raqami bizning bazamizga kiritildi. ✨`);
                } else {
                    await dbRequest('updateOne', 'customers', { filter: { phone: phone }, update: { $set: { tgId: chatId } } });
                    sendTelegramMessage(chatId, `👋 Hush kelibsiz! <b>${phone}</b> raqami tasdiqlangan.`);
                }
                
                const removeBody = JSON.stringify({ chat_id: chatId, text: '🛒 Ilovani oching va xarid qiling!', reply_markup: { remove_keyboard: true } });
                const opts2 = {
                    hostname: 'api.telegram.org', port: 443, method: 'POST',
                    path: `/bot${BOT_TOKEN}/sendMessage`,
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(removeBody) }
                };
                const tgReq2 = https.request(opts2);
                tgReq2.write(removeBody); tgReq2.end();
            }
            res.end('ok');
        });
        return;
    }

    // API: Orders
    if (req.url.startsWith('/api/orders/my') && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const auth = urlParams.searchParams.get('auth');
        const result = await dbRequest('find', 'orders', { filter: { $or: [{ phone: auth }, { customer: auth }] } });
        setJSON();
        res.end(JSON.stringify(result.documents || []));
        return;
    }

    if (req.url.startsWith('/api/orders') && req.method === 'GET') {
        const result = await dbRequest('find', 'orders');
        setJSON();
        res.end(JSON.stringify(result.documents || []));
        return;
    }

    if (req.url === '/api/orders' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const order = JSON.parse(body);
            order.id = Date.now();
            order.status = 'pending';
            order.date = new Date().toLocaleString();
            await dbRequest('insertOne', 'orders', { document: order });
            
            const search = await dbRequest('findOne', 'customers', { filter: { $or: [{ phone: order.phone }, { tgId: order.tgId }] } });
            if (search.document) {
                const customer = search.document;
                const newDur = (customer.dur || 0) + 1;
                const history = customer.durHistory || [];
                history.unshift({ reason: `#${order.id} buyurtma uchun bonus`, amount: 1, date: new Date().toLocaleString() });
                await dbRequest('updateOne', 'customers', { filter: { id: customer.id }, update: { $set: { dur: newDur, durHistory: history } } });
            }

            if (order.tgId) sendTelegramMessage(order.tgId, `🛍 <b>Buyurtma #${order.id} qabul qilindi!</b>\n\nTez orada aloqaga chiqamiz.`);
            sendTelegramMessage(ADMIN_CHAT_ID, `🔔 <b>YANGI BUYURTMA!</b>\n\n#${order.id}\n${order.total} UZS\n${order.address}`);

            setJSON();
            res.end(JSON.stringify({ success: true, order }));
        });
        return;
    }

    if (req.url.startsWith('/api/orders/') && req.method === 'POST') {
        const id = parseInt(req.url.split('/')[3]);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const { status } = JSON.parse(body);
            await dbRequest('updateOne', 'orders', { filter: { id: id }, update: { $set: { status: status } } });
            setJSON();
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    // API: Customers
    if (req.url.startsWith('/api/customers/check/phone/') && req.method === 'GET') {
        const phone = req.url.split('/').pop().replace(/[^\d]/g, '');
        const result = await dbRequest('findOne', 'customers', { filter: { phone: { $regex: phone } } });
        const customer = result.document;
        setJSON();
        if (customer && customer.isBlocked) {
            res.end(JSON.stringify({ found: true, blocked: true }));
            return;
        }
        res.end(JSON.stringify({ found: !!customer, customer }));
        return;
    }

    if (req.url.startsWith('/api/customers/check/') && req.method === 'GET') {
        const tgId = parseInt(req.url.split('/').pop());
        const result = await dbRequest('findOne', 'customers', { filter: { tgId: tgId } });
        const customer = result.document;
        setJSON();
        if (customer && customer.isBlocked) {
            res.end(JSON.stringify({ found: true, blocked: true }));
            return;
        }
        res.end(JSON.stringify({ found: !!customer, customer }));
        return;
    }

    if (req.url.startsWith('/api/customers/') && (req.method === 'PUT' || req.method === 'POST' && req.url.includes('update'))) {
        const id = parseInt(req.url.split('/')[3]);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const update = JSON.parse(body);
            await dbRequest('updateOne', 'customers', { filter: { id: id }, update: { $set: update } });
            setJSON();
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    if (req.url.startsWith('/api/customers/') && req.method === 'DELETE') {
        const id = parseInt(req.url.split('/')[3]);
        await dbRequest('deleteOne', 'customers', { filter: { id: id } });
        setJSON();
        res.end(JSON.stringify({ success: true }));
        return;
    }

    if (req.url.startsWith('/api/customers') && req.method === 'GET') {
        const result = await dbRequest('find', 'customers');
        setJSON();
        res.end(JSON.stringify(result.documents || []));
        return;
    }

    if (req.url === '/api/customers' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const customer = JSON.parse(body);
            // Search strictly by phone so each unique number gets a distinct account
            const search = await dbRequest('findOne', 'customers', { filter: { phone: customer.phone } });
            
            setJSON();
            if (search.document && search.document.isBlocked) {
                res.end(JSON.stringify({ success: false, blocked: true }));
                return;
            }

            if (!search.document) {
                customer.id = Date.now();
                customer.dateJoined = new Date().toLocaleDateString();
                customer.dur = 0;
                customer.durHistory = [];
                customer.isVip = false;
                customer.isBlocked = false;
                await dbRequest('insertOne', 'customers', { document: customer });
            } else if (customer.tgId) {
                await dbRequest('updateOne', 'customers', { filter: { id: search.document.id }, update: { $set: { tgId: customer.tgId } } });
            }
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    // API: Notifications
    if (req.url.startsWith('/api/notifications') && req.method === 'GET') {
        const result = await dbRequest('find', 'notifications');
        setJSON();
        res.end(JSON.stringify(result.documents || []));
        return;
    }

    if (req.url === '/api/notifications' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const notif = JSON.parse(body);
            notif.id = Date.now();
            notif.date = new Date().toLocaleString();
            await dbRequest('insertOne', 'notifications', { document: notif });
            setJSON();
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    // API: Categories
    if (req.url.startsWith('/api/categories') && req.method === 'GET') {
        const result = await dbRequest('find', 'categories');
        setJSON();
        const categoriesArray = (result.documents || []).map(c => c.name || c);
        res.end(JSON.stringify(categoriesArray.length ? categoriesArray : ['Erkaklar', 'Ayollar', 'Uniseks']));
        return;
    }

    // Static Files Handling
    const PUBLIC_DIR = path.join(__dirname, '..');
    const mimeTypes = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
        '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon'
    };

    let requestedPath = req.url.split('?')[0];
    let possiblePaths = [
        path.join(PUBLIC_DIR, requestedPath),
        path.join(PUBLIC_DIR, 'client-app', requestedPath),
        path.join(PUBLIC_DIR, 'admin-panel', requestedPath)
    ];

    let finalPath = null;
    for (let p of possiblePaths) {
        if (fs.existsSync(p)) {
            if (fs.statSync(p).isDirectory()) {
                let indexP = path.join(p, 'index.html');
                if (fs.existsSync(indexP)) { finalPath = indexP; break; }
            } else {
                finalPath = p; break;
            }
        }
    }

    // SPA Fallback
    if (!finalPath) {
        if (requestedPath.startsWith('/admin')) {
            finalPath = path.join(PUBLIC_DIR, 'admin-panel/index.html');
        } else {
            finalPath = path.join(PUBLIC_DIR, 'client-app/index.html');
        }
    }

    const ext = path.extname(finalPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(finalPath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

autoMigrate().then(() => {
    server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
});
