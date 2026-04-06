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

const PORT = process.env.PORT || 3000;
const DATA_API_URL = process.env.MONGODB_API_URL;
const DATA_API_KEY = process.env.MONGODB_API_KEY;
const DATA_SOURCE = process.env.MONGODB_DATA_SOURCE || 'Cluster0';
const DATABASE = 'durlovely';

async function dbRequest(action, collection, body = {}) {
    if (!DATA_API_URL || !DATA_API_KEY) {
        return localDbFallback(action, collection, body);
    }
    return new Promise((resolve, reject) => {
        const url = `${DATA_API_URL}/action/${action}`;
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': DATA_API_KEY,
            }
        };
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch(e) { resolve({ documents: [] }); }
            });
        });
        req.on('error', reject);
        req.write(JSON.stringify({ dataSource: DATA_SOURCE, database: DATABASE, collection: collection, ...body }));
        req.end();
    });
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
        setJSON();
        res.end(JSON.stringify({ found: !!result.document, customer: result.document }));
        return;
    }

    if (req.url.startsWith('/api/customers/check/') && req.method === 'GET') {
        const tgId = parseInt(req.url.split('/').pop());
        const result = await dbRequest('findOne', 'customers', { filter: { tgId: tgId } });
        setJSON();
        res.end(JSON.stringify({ found: !!result.document, customer: result.document }));
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
            const search = await dbRequest('findOne', 'customers', { filter: { phone: customer.phone } });
            if (!search.document) {
                customer.id = Date.now();
                customer.dateJoined = new Date().toLocaleDateString();
                customer.dur = 0;
                customer.durHistory = [];
                customer.isVip = false;
                await dbRequest('insertOne', 'customers', { document: customer });
            } else if (customer.tgId) {
                await dbRequest('updateOne', 'customers', { filter: { phone: customer.phone }, update: { $set: { tgId: customer.tgId } } });
            }
            setJSON();
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

    // Static Files
    const PUBLIC_DIR = path.join(__dirname, '..');
    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'client-app/index.html' : req.url);
    if (!fs.existsSync(filePath)) {
        filePath = path.join(PUBLIC_DIR, req.url.startsWith('/admin') ? 'admin-panel/index.html' : 'client-app/index.html');
    }
    const ext = path.extname(filePath);
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
    fs.readFile(filePath, (err, content) => {
        if (err) { res.writeHead(404); res.end('Not Found'); }
        else { res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' }); res.end(content); }
    });
});

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
