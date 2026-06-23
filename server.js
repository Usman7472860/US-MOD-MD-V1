/**
 * US MOD MD - Pairing Website Server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { requestPairingCode, disconnectSession, getAllSessions, loadExistingSessions } = require('./session_manager');
const store = require('./sido/store');
const settings = require('./settings');

const PORT = process.env.PORT || process.env.APP_PORT || 3000;

// Payment data paths
const PAYMENTS_FILE = path.join(__dirname, 'data/payments.json');
const PAID_FILE     = path.join(__dirname, 'data/paid_users.json');

// ─── Plans (same as commands/payment.js) ────────────────────────────────────
const PLANS = {
    weekly:   { label: 'Weekly',  days: 7,   price: 50  },
    monthly:  { label: 'Monthly', days: 30,  price: 100 },
    '3month': { label: '3 Month', days: 90,  price: 250 },
    '6month': { label: '6 Month', days: 180, price: 400 },
    yearly:   { label: 'Yearly',  days: 365, price: 700 },
};
// ─────────────────────────────────────────────────────────────────────────────

// Easypaisa account (owner ka — yahan apna number daalo)
const EASYPAISA_NUMBER = process.env.EASYPAISA_NUMBER || '03xxxxxxxxx';
const EASYPAISA_NAME   = process.env.EASYPAISA_NAME   || 'Usman Khan Chachar';

// Store init
store.readFromFile();
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 10_000);

// Memory check
setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024;
    if (used > 500) {
        console.log('⚠️ RAM high, restarting...');
        process.exit(1);
    }
}, 30_000);

// ─── Helpers ────────────────────────────────────────────────────────────────
function jsonResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise((resolve) => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    });
}

function readJSON(file, def) {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return def; }
}
function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function isPaidUser(phone) {
    const paid = readJSON(PAID_FILE, {});
    const entry = paid[phone];
    if (!entry) return false;
    if (entry.expiry === 'lifetime') return true;
    return new Date(entry.expiry) > new Date();
}

// Notify owner on WhatsApp (requires bot to be running)
async function notifyOwnerPayment(paymentData) {
    try {
        // Bot's global sock — agar available ho
        if (global.botSock) {
            const ownerJid = `${settings.owner}@s.whatsapp.net`;
            const plan = PLANS[paymentData.plan] || { label: paymentData.plan, price: '?' };
            await global.botSock.sendMessage(ownerJid, {
                text: `💰 *Naya Payment Request!*\n\n` +
                      `📱 *Number:* ${paymentData.phone}\n` +
                      `📦 *Plan:* ${plan.label} (Rs. ${plan.price})\n` +
                      `🆔 *TXN ID:* ${paymentData.txnId}\n` +
                      `📛 *Name:* ${paymentData.name || 'N/A'}\n` +
                      `⏰ *Time:* ${new Date().toLocaleString('en-PK')}\n\n` +
                      `✅ Approve: \`.approve ${paymentData.phone} ${paymentData.plan}\`\n` +
                      `❌ Reject: \`.reject ${paymentData.phone}\`\n\n` +
                      `> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐔𝐬𝐦𝐚𝐧 𝐊𝐡𝐚𝐧 𝐂𝐡𝐚𝐜𝐡𝐚𝐫`
            });
        }
    } catch (e) {
        console.log('Owner notify failed:', e.message);
    }
}
// ─────────────────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
    const url = req.url.split('?')[0];
    const method = req.method;

    // CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type,x-api-secret' });
        return res.end();
    }

    // Serve HTML page
    if (method === 'GET' && url === '/') {
        const html = fs.readFileSync(path.join(__dirname, 'web', 'index.html'), 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
    }

    // ── GET /api/plans ─────────────────────────────────────────────────────
    if (method === 'GET' && url === '/api/plans') {
        return jsonResponse(res, 200, { 
            success: true, 
            plans: PLANS,
            easypaisa: { number: EASYPAISA_NUMBER, name: EASYPAISA_NAME }
        });
    }

    // ── POST /api/payment ──────────────────────────────────────────────────
    if (method === 'POST' && url === '/api/payment') {
        const body = await parseBody(req);
        const phone  = (body.phone  || '').replace(/[^0-9]/g, '');
        const txnId  = (body.txnId  || '').trim();
        const plan   = (body.plan   || '').toLowerCase().trim();
        const name   = (body.name   || '').trim().substring(0, 50);

        if (!phone || phone.length < 10)
            return jsonResponse(res, 400, { success: false, message: 'Valid WhatsApp number dalo (country code ke saath)' });
        if (!txnId || txnId.length < 4)
            return jsonResponse(res, 400, { success: false, message: 'Valid Easypaisa TXN ID dalo' });
        if (!PLANS[plan])
            return jsonResponse(res, 400, { success: false, message: 'Invalid plan selected' });

        // Already paid?
        if (isPaidUser(phone))
            return jsonResponse(res, 400, { success: false, message: 'Ye number already premium hai!' });

        // Duplicate TXN check
        const payments = readJSON(PAYMENTS_FILE, []);
        if (payments.find(p => p.txnId === txnId))
            return jsonResponse(res, 400, { success: false, message: 'Ye TXN ID pehle se submit ho chuka hai.' });

        // Save payment request
        const payment = { phone, txnId, plan, name, status: 'pending', submittedAt: new Date().toISOString() };
        payments.push(payment);
        writeJSON(PAYMENTS_FILE, payments);

        // Notify owner on WhatsApp
        await notifyOwnerPayment(payment);

        return jsonResponse(res, 200, { 
            success: true, 
            message: 'Payment request submit ho gaya! Owner verify karke 1-2 ghante mein activate kar dega.' 
        });
    }

    // ── GET /api/checkpaid?phone=923xx ─────────────────────────────────────
    if (method === 'GET' && url.startsWith('/api/checkpaid')) {
        const qs = new URLSearchParams(req.url.split('?')[1] || '');
        const phone = (qs.get('phone') || '').replace(/[^0-9]/g, '');
        if (!phone) return jsonResponse(res, 400, { success: false, message: 'Phone required' });
        const paid = readJSON(PAID_FILE, {});
        const entry = paid[phone];
        const active = isPaidUser(phone);
        return jsonResponse(res, 200, { 
            success: true, 
            isPaid: active,
            plan: active && entry ? entry.plan : null,
            expiry: active && entry ? entry.expiry : null
        });
    }

    // ── Existing APIs ───────────────────────────────────────────────────────
    if (method === 'POST' && url === '/api/pair') {
        const body = await parseBody(req);
        const phone = (body.phone || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 10)
            return jsonResponse(res, 400, { success: false, message: 'Valid phone number dalo (with country code)' });
        const result = await requestPairingCode(phone);
        return jsonResponse(res, result.success ? 200 : 400, result);
    }

    if (method === 'GET' && url === '/api/sessions') {
        return jsonResponse(res, 200, { success: true, sessions: getAllSessions() });
    }

    if (method === 'POST' && url === '/api/disconnect') {
        const body = await parseBody(req);
        const phone = (body.phone || '').replace(/[^0-9]/g, '');
        if (!phone) return jsonResponse(res, 400, { success: false, message: 'Phone number required' });
        const result = await disconnectSession(phone);
        return jsonResponse(res, 200, result);
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, '0.0.0.0', async () => {
    console.log(`🌐 US MOD MD Panel running on port: ${PORT}`);
    console.log(`🔗 Open: http://localhost:${PORT}`);
    await loadExistingSessions();
});

process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));
