// Last Update: 2026-04-16 19:02 (Force Re-deploy Full Sync)
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = '8060468556:AAFdv3dQ7kL-9BrAlx0HjFWfj4H9fIDFAeE';
const ADMIN_CHAT_ID = 737113132; // Admin Telegram chat ID

function normalizePhone(num) {
    if (!num) return '';
    return String(num).replace(/\D/g, ''); // Digits only
}

// Telegram Helper
function sendTelegramMessage(chatId, text) {
    if (!chatId) return;
    console.log(`[BOT] Sending to ${chatId}: ${text.replace(/<[^>]*>/g, '').substring(0, 50)}...`);
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

// Logic to award points ONLY after successful payment or delivery
async function awardDurPoints(orderId) {
    const orderSearch = await dbRequest('findOne', 'orders', { filter: { id: parseInt(orderId) } });
    if (!orderSearch.document) return;
    
    const order = orderSearch.document;
    if (order.pointsAwarded) return; // Prevent double awarding

    const customerSearch = await dbRequest('findOne', 'customers', { filter: { $or: [{ phone: order.phone }, { tgId: order.tgId }] } });
    if (customerSearch.document) {
        const customer = customerSearch.document;
        const amountClean = parseInt(String(order.total).replace(/[^\d]/g, '')) || 0;
        const bonusDur = Math.max(1, Math.floor(amountClean / 100000));
        
        const newDur = (customer.dur || 0) + bonusDur;
        const history = customer.durHistory || [];
        history.unshift({ reason: `#${order.id} buyurtma uchun bonus`, amount: bonusDur, date: new Date().toLocaleString() });
        
        // Update Customer Points
        await dbRequest('updateOne', 'customers', { filter: { id: customer.id }, update: { $set: { dur: newDur, durHistory: history } } });
        
        // Mark order as points awarded
        await dbRequest('updateOne', 'orders', { filter: { id: order.id }, update: { $set: { pointsAwarded: true } } });
        console.log(`[DUR-AWARD] Awarded ${bonusDur} to ${customer.phone} for Order #${order.id}`);
    }
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
    console.log(`[LOCAL-DB] Action: ${action}, Collection: ${collection}. Documents: ${data[collection]?.length || 0}`);
    if (action === 'find') return { documents: data[collection] || [] };
    if (action === 'findOne') {
        if (!data[collection]) data[collection] = [];
        return { document: (data[collection] || []).find(x => x.id == body.filter?.id || x.tgId == body.filter?.tgId || x.phone == body.filter?.phone) };
    }
    if (action === 'insertOne') {
        if (!data[collection]) data[collection] = [];
        data[collection].push(body.document);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return { insertedId: body.document.id };
    }
    if (action === 'updateOne') {
        if (!data[collection]) data[collection] = [];
        const idx = data[collection].findIndex(x => x.id == body.filter?.id || x.phone == body.filter?.phone || x.tgId == body.filter?.tgId);
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
    console.log(`[REQ] ${req.method} ${req.url}`);

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const setJSON = () => res.setHeader('Content-Type', 'application/json');

    // Anti-Sleep Keep-Alive Endpoint
    if (req.url.startsWith('/api/ping') && req.method === 'GET') {
        setJSON();
        res.end(JSON.stringify({ 
            status: 'AESTHETICALLY_ACTIVE', 
            time: new Date().toISOString(),
            cwd: process.cwd(),
            dirname: __dirname
        }));
        return;
    }

    // API: Image Upload
    if (req.url.startsWith('/api/upload') && req.method === 'POST') {
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
        
        // Performance Fix: Strip excessively large fields (e.g. accidental base64) to prevent 5.5MB payloads
        const sanitizedDocs = (result.documents || []).map(doc => {
            const cleanDoc = { ...doc };
            for (let key in cleanDoc) {
                if (typeof cleanDoc[key] === 'string' && cleanDoc[key].length > 10000) {
                    console.log(`⚠️ Truncating huge field "${key}" in product ${doc.id}`);
                    cleanDoc[key] = cleanDoc[key].substring(0, 100) + "... [truncated]";
                }
            }
            return cleanDoc;
        });

        setJSON();
        res.end(JSON.stringify(sanitizedDocs));
        return;
    }

    if (req.url.startsWith('/api/products') && req.method === 'POST') {
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
                
                if (!phone.startsWith('+998')) {
                    sendTelegramMessage(chatId, `❌ <b>Xatolik!</b>\n\nKechirasiz, loyiha hozircha faqat O'zbekiston hududida faoliyat olib boradi. Faqat <b>+998</b> raqamlari qabul qilinadi.`);
                    res.end('ok');
                    return;
                }
                
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

    if (req.url.startsWith('/api/admin/customer-orders/') && req.method === 'GET') {
        const rawId = decodeURIComponent(req.url.split('/').pop());
        const cleanId = normalizePhone(rawId);
        
        const result = await dbRequest('find', 'orders');
        const allOrders = result.documents || [];
        
        // Filter by normalized phone or exact id or tgId
        const orders = allOrders.filter(o => 
            normalizePhone(o.phone) === cleanId || 
            String(o.tgId) === rawId ||
            String(o.id) === rawId
        );
        
        setJSON();
        res.end(JSON.stringify(orders));
        return;
    }

    if (req.url.startsWith('/api/orders') && req.method === 'GET') {
        const result = await dbRequest('find', 'orders');
        setJSON();
        res.end(JSON.stringify(result.documents || []));
        return;
    }

    if (req.url.startsWith('/api/orders') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const orderData = JSON.parse(body);
            const order = { 
                id: Date.now(), 
                customer: orderData.customer || orderData.name || 'Mijoz',
                items: orderData.items || [],
                total: orderData.total || '0',
                ...orderData, 
                status: 'pending', 
                paymentStatus: 'pending',
                date: new Date().toLocaleString() 
            };
            await dbRequest('insertOne', 'orders', { document: order });
            
            // Notify Admin (Pending Status)
            sendTelegramMessage(ADMIN_CHAT_ID, `🛠 <b>[ADMIN PANEL] YANGI BUYURTMA #${order.id}</b>\n\n💰 ${order.total} UZS\n📍 ${order.address}\n\n<i>To'lov kutilmoqda... (v2.0)</i>`);

            setJSON();
            res.end(JSON.stringify({ success: true, order }));
        });
        return;
    }

    // New Endpoint: Confirm Pay Later / Manual Confirmation
    if (req.url.includes('/confirm-later') && req.method === 'POST') {
        const id = parseInt(req.url.split('/')[3]);
        const search = await dbRequest('findOne', 'orders', { filter: { id: id } });
        if (search.document) {
            const order = search.document;
            await dbRequest('updateOne', 'orders', { filter: { id: id }, update: { $set: { paymentMethod: 'Naqd / Keyinroq' } } });
            if (order.tgId) {
                sendTelegramMessage(order.tgId, `🛍 <b>Buyurtma #${order.id} qabul qilindi!</b>\n\nTo'lov turi: Naqd / Keyinroq.\nTez orada aloqaga chiqamiz. ✨`);
            }
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ success: false }));
        }
        return;
    }

    if (req.url.startsWith('/api/orders/') && req.method === 'POST') {
        const id = parseInt(req.url.split('/')[3]);
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const { status } = JSON.parse(body);
            await dbRequest('updateOne', 'orders', { filter: { id: id }, update: { $set: { status: status } } });
            
            // If delivered manually, award points if not already awarded
            if (status === 'delivered') {
                await awardDurPoints(id);
            }

            setJSON();
            res.end(JSON.stringify({ success: true }));
        });
        return;
    }

    // API: Payments (Click & Payme)
    if (req.url.startsWith('/api/payment/create-invoice') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const { orderId, method, amount } = JSON.parse(body);
            
            // Update order with payment method
            await dbRequest('updateOne', 'orders', { filter: { id: orderId }, update: { $set: { paymentMethod: method.toUpperCase() } } });
            
            setJSON();
            
            if (method === 'click') {
                const CLICK_SERVICE_ID = '33124'; // Placeholder
                const CLICK_MERCHANT_ID = '25412'; // Placeholder
                const webUrl = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amount}&transaction_param=${orderId}`;
                const appUrl = `click://pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amount}&transaction_param=${orderId}`;
                res.end(JSON.stringify({ success: true, url: webUrl, appUrl }));
            } else if (method === 'payme') {
                const PAYME_MERCHANT_ID = '65bf65c28e67a54c9c8e8c8a'; // Placeholder
                const payload = `m=${PAYME_MERCHANT_ID};ac.order_id=${orderId};a=${amount * 100}`;
                const params = Buffer.from(payload).toString('base64');
                const webUrl = `https://checkout.paycom.uz/${params}`;
                const appUrl = `payme://${params}`; // Deep link for Payme app
                res.end(JSON.stringify({ success: true, url: webUrl, appUrl }));
            }
        });
        return;
    }

    // Click Callbacks (Prepare & Complete)
    if (req.url.startsWith('/api/payment/click/') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const params = new URLSearchParams(body);
            const click_trans_id = params.get('click_trans_id');
            const merchant_trans_id = params.get('merchant_trans_id'); // our orderId
            const amount = params.get('amount');
            const action = req.url.includes('prepare') ? 0 : 1;
            const error = params.get('error');

            if (error == 0) {
                if (merchant_trans_id && click_trans_id) {
                    await dbRequest('updateOne', 'orders', { 
                        filter: { id: parseInt(merchant_trans_id) }, 
                        update: { $set: { paymentStatus: 'paid', paid_at: new Date().toLocaleString() } } 
                    });

                    // Award points immediately upon payment
                    await awardDurPoints(merchant_trans_id);
                    
                    // Notify User after payment
                    const search = await dbRequest('findOne', 'orders', { filter: { id: parseInt(merchant_trans_id) } });
                    if (search.document && search.document.tgId) {
                        sendTelegramMessage(search.document.tgId, `✅ <b>To'lov tasdiqlandi!</b>\n\nBuyurtma #${merchant_trans_id} muvaffaqiyatli to'landi. Tez orada yetkazib beramiz! ✨`);
                    }
                    sendTelegramMessage(ADMIN_CHAT_ID, `💰 <b>BUYURTMA #${merchant_trans_id} TO'LANDI!</b>\nClick trans ID: ${click_trans_id}`);
                }
                setJSON();
                res.end(JSON.stringify({ click_trans_id, merchant_trans_id, error: 0, error_note: 'Success' }));
            } else {
                res.end(JSON.stringify({ error: -1, error_note: 'Failure' }));
            }
        });
        return;
    }

    // API: Customers
    if (req.url.startsWith('/api/customers/claim-reward') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const { phone, cost, prize } = JSON.parse(body);
            const search = await dbRequest('findOne', 'customers', { filter: { phone: phone } });
            if (!search.document) {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, message: 'User not found' }));
                return;
            }
            const customer = search.document;
            const currentDur = customer.dur || 0;
            if (currentDur < cost) {
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, message: 'Insufficient Dur' }));
                return;
            }
            const newDur = currentDur - cost;
            const history = customer.durHistory || [];
            history.unshift({ reason: `Dur Box ochildi (${prize})`, amount: -cost, date: new Date().toLocaleString() });
            await dbRequest('updateOne', 'customers', { filter: { id: customer.id }, update: { $set: { dur: newDur, durHistory: history } } });
            setJSON();
            res.end(JSON.stringify({ success: true, newDur }));
        });
        return;
    }

    if (req.url.startsWith('/api/customers/check/phone/') && req.method === 'GET') {
        const phoneRaw = req.url.split('/').pop();
        const phone = normalizePhone(decodeURIComponent(phoneRaw));
        const result = await dbRequest('find', 'customers');
        const allCusts = result.documents || [];
        
        // Find best match (prefer the one with dur > 0)
        let customer = allCusts.find(c => normalizePhone(c.phone) === phone && (c.dur || 0) > 0);
        if (!customer) customer = allCusts.find(c => normalizePhone(c.phone) === phone);
        
        setJSON();
        if (customer && customer.isBlocked) {
            res.end(JSON.stringify({ found: true, blocked: true }));
            return;
        }
        res.end(JSON.stringify({ found: !!customer, customer }));
        return;
    }

    if (req.url.startsWith('/api/customers/check/') && req.method === 'GET') {
        const parts = req.url.split('?')[0].split('/'); // Ignore query params
        const identifier = parts.pop();
        const type = parts.pop(); // 'check' or 'phone'

        let filter = {};
        if (type === 'phone') {
            filter = { phone: decodeURIComponent(identifier) };
        } else {
            filter = { tgId: parseInt(identifier) };
        }

        const result = await dbRequest('findOne', 'customers', { filter });
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
            const updateData = JSON.parse(body);
            const { _notification, ...update } = updateData;
            
            await dbRequest('updateOne', 'customers', { filter: { id: id }, update: { $set: update } });
            
            // Handle specialized point adjustment notification
            if (_notification) {
                const custSearch = await dbRequest('findOne', 'customers', { filter: { id: id } });
                if (custSearch.document && custSearch.document.tgId) {
                    const c = custSearch.document;
                    const sign = _notification.amount > 0 ? '+' : '';
                    const emoji = _notification.amount > 0 ? '💎' : '📉';
                    const msg = `${emoji} <b>Dur Balansingiz o'zgardi!</b>\n\n` + 
                                `Miqdori: <b>${sign}${_notification.amount} DUR</b>\n` +
                                `Sababi: <i>${_notification.reason}</i>\n\n` +
                                `Joriy balansingiz: <b>${update.dur || c.dur} DUR</b> ✨`;
                    sendTelegramMessage(c.tgId, msg);
                }
            }

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

    if (req.url.startsWith('/api/customers') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const newCust = JSON.parse(body);
            const phone = normalizePhone(newCust.phone);
            
            const result = await dbRequest('find', 'customers');
            const allCusts = result.documents || [];
            
            const duplicates = allCusts.filter(c => normalizePhone(c.phone) === phone || (c.tgId && c.tgId == newCust.tgId));
            
            let mainAccount = duplicates.find(d => (d.dur || 0) > 0) || duplicates[0];
            
            if (mainAccount) {
                // If duplicates exist, merge them into mainAccount
                if (duplicates.length > 1) {
                    let totalDur = 0;
                    let combinedHistory = [];
                    for (let d of duplicates) {
                        totalDur += (d.dur || 0);
                        if (d.durHistory) combinedHistory = [...combinedHistory, ...d.durHistory];
                        if (d.id !== mainAccount.id) {
                            await dbRequest('deleteOne', 'customers', { filter: { id: d.id } });
                        }
                    }
                    // Sort history by date descending
                    combinedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    mainAccount.dur = totalDur;
                    mainAccount.durHistory = combinedHistory.slice(0, 50); // Keep last 50
                    await dbRequest('updateOne', 'customers', { filter: { id: mainAccount.id }, update: { $set: { dur: totalDur, durHistory: mainAccount.durHistory } } });
                    console.log(`[MERGE] Combined ${duplicates.length} accounts for ${phone}. Result: ${totalDur} Dur`);
                }
                
                if (mainAccount.isBlocked) {
                    res.end(JSON.stringify({ success: false, blocked: true }));
                    return;
                }
                res.end(JSON.stringify({ success: true, customer: mainAccount }));
            } else {
                // Create new
                newCust.id = Date.now();
                newCust.dateJoined = new Date().toLocaleDateString();
                newCust.dur = 0;
                newCust.durHistory = [];
                newCust.isVip = false;
                newCust.isBlocked = false;
                await dbRequest('insertOne', 'customers', { document: newCust });
                res.end(JSON.stringify({ success: true, customer: newCust }));
            }
            setJSON();
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

    if (req.url.startsWith('/api/notifications') && req.method === 'POST') {
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

    // API: Slides
    if (req.url.startsWith('/api/slides') && req.method === 'GET') {
        const result = await dbRequest('find', 'slides');
        setJSON();
        res.end(JSON.stringify(result.documents || []));
        return;
    }

    if (req.url.startsWith('/api/slides') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const slide = JSON.parse(body);
            slide.id = Date.now();
            await dbRequest('insertOne', 'slides', { document: slide });
            setJSON();
            res.end(JSON.stringify({ success: true, id: slide.id }));
        });
        return;
    }

    if (req.url.startsWith('/api/slides/') && req.method === 'DELETE') {
        const id = parseInt(req.url.split('/').pop());
        await dbRequest('deleteOne', 'slides', { filter: { id } });
        setJSON();
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // API: Categories
    if (req.url.startsWith('/api/categories') && req.method === 'GET') {
        // Enforce the canonical categories requested by the user
        const canonicalCategories = ['Erkaklar', 'Ayollar', 'Uniseks'];
        res.end(JSON.stringify(canonicalCategories));
        return;
    }

    // Static Files Handling: Prevent API routes from falling through to static server
    if (req.url.startsWith('/api/')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'API route not found' }));
        return;
    }

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
        const isAsset = (requestedPath.includes('.') && !requestedPath.endsWith('.html')) || requestedPath.startsWith('/shared-assets');
        if (isAsset) {
            res.writeHead(404);
            res.end('Aktiv topilmadi'); // Asset Not Found
            return;
        }
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
    server.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        
        // Anti-Sleep Keep-Alive: Self-ping every 14 minutes
        const RENDER_URL = 'https://durlovely-parfum-api.onrender.com/api/ping';
        setInterval(() => {
            https.get(RENDER_URL, (res) => {
                console.log(`📡 Keep-alive ping sent: ${res.statusCode}`);
            }).on('error', (e) => console.error("Keep-alive Ping Error:", e));
        }, 14 * 60 * 1000);
    });
});
