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
const DATA_FILE = path.join(__dirname, 'data.json');
const PUBLIC_DIR = path.join(__dirname, '..');

// Helper to read data
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (!parsed.notifications) parsed.notifications = [];
        // Migration: Ensure customers have dur and durHistory
        if (parsed.customers) {
            parsed.customers.forEach(c => {
                if (c.dur === undefined) c.dur = 0;
                if (!c.durHistory) c.durHistory = [];
            });
        }
        return parsed;
    } catch (e) {
        return { orders: [], products: [], categories: [], customers: [], notifications: [] };
    }
};

// Helper to write data
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const server = http.createServer((req, res) => {
    // CORS sets
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

    // Telegram Bot Webhook - handles /start command and contact sharing
    if (req.url === '/bot/webhook' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const update = JSON.parse(body);
            const message = update.message;
            if (!message) { res.end('ok'); return; }
            
            const chatId = message.chat.id;
            
            // /start command - ask for contact
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
            
            // User shared contact
            if (message.contact) {
                const contact = message.contact;
                let phone = contact.phone_number || '';
                if (!phone.startsWith('+')) phone = '+' + phone;
                
                if (!phone.startsWith('+998')) {
                    sendTelegramMessage(chatId, "❌ Kechirasiz, faqat O'zbekiston (+998) raqamlari qabul qilinadi. Iltimos bayroqni bosib o'zbek raqamingizni tanlang.");
                    res.end('ok'); return;
                }
                
                const data = readData();
                if (!data.customers) data.customers = [];
                let existing = data.customers.find(c => c.phone === phone);
                if (!existing) {
                    existing = {
                        id: Date.now(), phone, tgId: chatId,
                        firstName: contact.first_name || '',
                        dateJoined: new Date().toLocaleDateString()
                    };
                    data.customers.push(existing);
                    writeData(data);
                    sendTelegramMessage(chatId, `✅ <b>Raqamingiz tasdiqlandi!</b>\n\n<b>${phone}</b> raqami bizning bazamizga kiritildi.\n\nEndi ilovamizni ochib xarid qiling! 🛍`, );
                } else {
                    sendTelegramMessage(chatId, `👋 Siz allaqachon ro'yxatdan o'tgansiz!\n\n<b>${phone}</b> raqami bizda mavjud. Ilovamizni ochib davom eting! 🛍`);
                }
                
                // Remove keyboard
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

    // API: Products - List all
    if (req.url.startsWith('/api/products') && req.method === 'GET') {
        const data = readData();
        setJSON();
        res.end(JSON.stringify(data.products || []));
        return;
    }

    // API: Orders - List all (Admin)
    if (req.url.startsWith('/api/orders') && !req.url.includes('/my') && req.method === 'GET') {
        const data = readData();
        setJSON();
        res.end(JSON.stringify(data.orders || []));
        return;
    }

    if (req.url.startsWith('/api/notifications') && req.method === 'GET') {
        const data = readData();
        setJSON();
        res.end(JSON.stringify(data.notifications || []));
        return;
    }

    if (req.url.startsWith('/api/notifications') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const data = readData();
            const notification = JSON.parse(body);
            notification.id = Date.now();
            notification.date = new Date().toLocaleString();
            if (!data.notifications) data.notifications = [];
            data.notifications.unshift(notification);
            writeData(data);
            setJSON();
            res.end(JSON.stringify({ success: true, notification }));
        });
        return;
    }

    if (req.url.startsWith('/api/debug/data') && req.method === 'GET') {
        setJSON();
        res.end(JSON.stringify(readData()));
        return;
    }

    // API: My Orders (Customer)
    if (req.url.startsWith('/api/orders/my') && req.method === 'GET') {
        const urlParams = new URL(req.url, `http://${req.headers.host}`);
        const auth = urlParams.searchParams.get('auth');
        if (!auth) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'Auth required' }));
            return;
        }
        const data = readData();
        const myOrders = data.orders.filter(o => o.phone === auth || o.customer === auth);
        setJSON();
        res.end(JSON.stringify(myOrders));
        return;
    }

    if (req.url === '/api/orders' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const order = JSON.parse(body);
            const data = readData();
            order.id = 1000 + data.orders.length + 1; // Simple ID
            order.date = new Date().toLocaleDateString();
            order.status = 'pending';
            data.orders.push(order);
            // Add Dur bonus to customer
            const customer = data.customers.find(c => c.phone === order.phone || c.tgId === order.tgId);
            if (customer) {
                customer.dur = (customer.dur || 0) + 1;
                if (!customer.durHistory) customer.durHistory = [];
                customer.durHistory.unshift({
                    id: Date.now() + 1,
                    reason: `#${order.id} buyurtma uchun bonus`,
                    amount: 1,
                    date: new Date().toLocaleString()
                });
            }

            writeData(data);
            
            // Notify customer
            if (order.tgId) {
                const msg = `<b>DURLOVELY PARFUM</b>\n\n🛍 <b>Yangi buyurtmangiz qabul qilindi!</b>\nBuyurtma raqami: #${order.id}\nJami summa: <b>${order.total} so'm</b>\n\nTez orada menejer siz bilan aloqaga chiqadi. Xaridingiz uchun rahmat! ✨`;
                sendTelegramMessage(order.tgId, msg);
            }
            
            // Notify admin
            const adminMsg = `🔔 <b>YANGI BUYURTMA!</b>\n\n📦 #${order.id}\n👤 ${order.customer || 'Noma\'lum'}\n📱 ${order.phone || '—'}\n🛒 ${(order.items || []).join(', ')}\n💰 <b>${order.total || '0'} UZS</b>\n📍 ${order.address || '—'}`;
            sendTelegramMessage(ADMIN_CHAT_ID, adminMsg);

            setJSON();
            res.end(JSON.stringify({ success: true, order }));
        });
        return;
    }

    if (req.url.startsWith('/api/orders/') && req.method === 'POST') {
        const id = req.url.split('/')[3];
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const { status } = JSON.parse(body);
            const data = readData();
            const orderIndex = data.orders.findIndex(o => o.id == id);
            if (orderIndex !== -1) {
                const oldStatus = data.orders[orderIndex].status;
                data.orders[orderIndex].status = status;
                writeData(data);
                
                // Notify customer about status change
                if (data.orders[orderIndex].tgId && oldStatus !== status) {
                    const statusText = {
                        'pending': '⏳ Kutilmoqda',
                        'delivered': '✅ Yetkazib berildi',
                        'cancelled': '❌ Bekor qilindi'
                    };
                    const msg = `📦 <b>Buyurtma #${data.orders[orderIndex].id}</b>\n\nStatus yangilandi: <b>${statusText[status] || status}</b>`;
                    sendTelegramMessage(data.orders[orderIndex].tgId, msg);
                }
                
                setJSON();
                res.end(JSON.stringify({ success: true, order: data.orders[orderIndex] }));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        return;
    }

    if (req.url === '/api/products' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const product = JSON.parse(body);
            const data = readData();
            product.id = Date.now(); // Simple ID generation
            data.products.push(product);
            writeData(data);
            setJSON();
            res.end(JSON.stringify({ success: true, product }));
        });
        return;
    }

    if (req.url.startsWith('/api/products/') && (req.method === 'PUT' || req.method === 'POST' && req.url.includes('update'))) {
        // Support both PUT and POST for simplicity in some client environments
        const id = req.url.split('/')[3];
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const updatedProduct = JSON.parse(body);
            const data = readData();
            const index = data.products.findIndex(p => p.id == id);
            if (index !== -1) {
                data.products[index] = { ...data.products[index], ...updatedProduct };
                writeData(data);
                setJSON();
                res.end(JSON.stringify({ success: true, product: data.products[index] }));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        return;
    }

    if (req.url.startsWith('/api/products/') && req.method === 'DELETE') {
        const id = req.url.split('/')[3];
        const data = readData();
        const initialLength = data.products.length;
        data.products = data.products.filter(p => p.id != id);
        if (data.products.length < initialLength) {
            writeData(data);
            setJSON();
            res.end(JSON.stringify({ success: true }));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
        return;
    }

    // API: Categories (derived from products for now, or separate list)
    if (req.url.startsWith('/api/categories') && req.method === 'GET') {
        const data = readData();
        const categories = data.categories || [...new Set(data.products.map(p => p.category))];
        setJSON();
        res.end(JSON.stringify(categories));
        return;
    }

    // API: Upload Image (Base64)
    if (req.url === '/api/upload' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { name, data } = JSON.parse(body);
                if (!name || !data) throw new Error('Missing name or data');
                
                // data is base64 string: "data:image/png;base64,..."
                const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
                const buffer = Buffer.from(base64Data, 'base64');
                
                const fileName = `${Date.now()}_${name.replace(/\s+/g, '_')}`;
                const uploadDir = path.join(PUBLIC_DIR, 'uploads');
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                const uploadPath = path.join(uploadDir, fileName);
                
                fs.writeFileSync(uploadPath, buffer);
                
                setJSON();
                res.end(JSON.stringify({ 
                    success: true, 
                    url: `/uploads/${fileName}` 
                }));
            } catch (err) {
                console.error("Upload error:", err);
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
        return;
    }

    // API: Customers - Check by tgId
    if (req.url.startsWith('/api/customers/check/') && req.method === 'GET') {
        const tgId = parseInt(req.url.split('/').pop());
        const data = readData();
        const customer = (data.customers || []).find(c => c.tgId === tgId);
        setJSON();
        if (customer) {
            res.end(JSON.stringify({ found: true, customer }));
        } else {
            res.end(JSON.stringify({ found: false }));
        }
        return;
    }

    // API: Customers - List all
    if (req.url.startsWith('/api/customers') && !req.url.includes('/check/') && req.method === 'GET') {
        const data = readData();
        setJSON();
        res.end(JSON.stringify(data.customers || []));
        return;
    }

    // API: Customers - Toggle VIP
    if (req.url.match(/^\/api\/customers\/\d+\/vip$/) && req.method === 'POST') {
        const id = parseInt(req.url.split('/')[3]);
        const data = readData();
        const customer = (data.customers || []).find(c => c.id === id);
        if (customer) {
            customer.isVip = !customer.isVip;
            writeData(data);
            
            // Telegram Notification to Adminer via Telegram
            if (customer.tgId) {
                if (customer.isVip) {
                    sendTelegramMessage(customer.tgId, `👑 <b>Tabriklaymiz!</b>\n\nSiz endi <b>DURLOVELY VIP</b> a'zosisiz!\nMaxsus chegirmalar va eksklyuziv xizmatlardan foydalanishingiz mumkin. ✨`);
                } else {
                    sendTelegramMessage(customer.tgId, `ℹ️ Sizning VIP a'zoligingiz bekor qilindi.\nBatafsil ma'lumot uchun biz bilan bog'laning.`);
                }
            }
            
            setJSON();
            res.end(JSON.stringify({ success: true, customer }));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Customer not found' }));
        }
        return;
    }

    // API: Customers
    if (req.url === '/api/customers' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const customer = JSON.parse(body);
            const data = readData();
            
            if (!data.customers) data.customers = [];
            
            let existing = data.customers.find(c => c.phone === customer.phone);
            if (!existing) {
                customer.id = Date.now();
                customer.dateJoined = new Date().toLocaleDateString();
                data.customers.push(customer);
                writeData(data);
                existing = customer;
                
                // Send Welcome Message
                if (customer.tgId) {
                    const msg = `<b>DURLOVELY</b> ga xush kelibsiz! ✨\n\nSizning <b>${customer.phone}</b> raqamingiz muvaffaqiyatli tasdiqlandi.\nAsl va premium iforlar olamidan zavq oling.`;
                    sendTelegramMessage(customer.tgId, msg);
                }
            }
            
            setJSON();
            res.end(JSON.stringify({ success: true, customer: existing }));
        });
        return;
    }

    let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'client-app/index.html' : req.url);
    
    if (fs.existsSync(filePath)) {
        if (fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }
    } else {
        // Fallback for SPA routing
        if (req.url.startsWith('/admin-panel')) {
            filePath = path.join(PUBLIC_DIR, 'admin-panel/index.html');
        } else {
            filePath = path.join(PUBLIC_DIR, 'client-app/index.html');
        }
    }
    
    const extname = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp'
    };
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Admin Backend (Enhanced) running at http://localhost:${PORT}`);
});
