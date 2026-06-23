/**
 * US MOD MD - Bot (Bot-Hosting) + Pairing API
 */

const { Boom } = require('@hapi/boom');
const fs = require('fs');
const http = require('http');
const path = require('path');
const chalk = require('chalk');
const { rmSync } = require('fs');

const settings = require('./settings');
require('./config.js');
const {
    handleMessages,
    handleGroupParticipantUpdate,
    handleStatus,
    handleIncomingCall,
    restorePendingTempBans,
} = require('./main');
const store = require('./sido/store');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    delay,
} = require('@whiskeysockets/baileys');
const NodeCache = require('node-cache');
const pino = require('pino');

// Init store
store.readFromFile();
setInterval(() => store.writeToFile(), settings.storeWriteInterval || 60_000); // 60s instead of 10s

// ── Auto-restart on uncaught errors ──────────────────────────
process.on('uncaughtException', (err) => {
    console.error('💥 uncaughtException:', err.message);
    console.log('🔄 Restarting in 5s...');
    setTimeout(() => process.exit(1), 5000);
});
process.on('unhandledRejection', (reason) => {
    console.error('💥 unhandledRejection:', reason);
    console.log('🔄 Restarting in 5s...');
    setTimeout(() => process.exit(1), 5000);
});

// ── RAM + Disk monitor ────────────────────────────────────────
const { execSync } = require('child_process');

function getDiskUsagePercent() {
    try {
        const out = execSync("df . | tail -1 | awk '{print $5}'").toString().trim();
        return parseInt(out.replace('%', '')) || 0;
    } catch { return 0; }
}

function cleanOldFiles(dir, maxAgeMs) {
    try {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        let deleted = 0;
        for (const file of files) {
            const filePath = path.join(dir, file);
            try {
                const stats = fs.statSync(filePath);
                if (stats.isFile() && Date.now() - stats.mtimeMs > maxAgeMs) {
                    fs.unlinkSync(filePath);
                    deleted++;
                }
            } catch {}
        }
        if (deleted > 0) console.log(`🗑️ Cleaned ${deleted} file(s) from ${dir}`);
    } catch {}
}

// ── RAM monitor: run every 15 seconds ────────────────────────
setInterval(() => {
    const ram = process.memoryUsage().rss / 1024 / 1024;
    const heap = process.memoryUsage().heapUsed / 1024 / 1024;

    // ⚠️ 450MB — trigger GC + clear caches before it gets critical
    if (ram > 450) {
        console.log(`⚠️ RAM ${ram.toFixed(0)}MB — clearing caches...`);
        if (global.gc) global.gc();
        if (global.mediaCache) global.mediaCache = {};
        if (global.msgCache) global.msgCache = {};
        if (global.downloadCache) global.downloadCache = {};
        // Clean temp files immediately
        cleanOldFiles(path.join(__dirname, 'temp'), 5 * 60 * 1000);    // 5 min old
        cleanOldFiles(path.join(__dirname, 'tmp'), 5 * 60 * 1000);
        cleanOldFiles(path.join(__dirname, 'downloads'), 5 * 60 * 1000);
    }

    // 🚨 490MB — bot band hone wala hai, restart karo
    if (ram > 490) {
        console.log(`🚨 RAM ${ram.toFixed(0)}MB CRITICAL (limit 512MB) — restarting now!`);
        process.exit(1);
    }
}, 15_000); // check every 15 seconds

// ── Disk check: run every 5 minutes ─────────────────────────
setInterval(() => {
    const diskUsed = getDiskUsagePercent();
    if (diskUsed >= 85) {
        console.log(`⚠️ Disk ${diskUsed}% full — cleaning temp files...`);
        cleanOldFiles(path.join(__dirname, 'temp'), 30 * 60 * 1000);
        cleanOldFiles(path.join(__dirname, 'logs'), 60 * 60 * 1000);
        cleanOldFiles(path.join(__dirname, 'baileys_store'), 2 * 60 * 60 * 1000);
    }
    if (diskUsed >= 95) {
        console.log(`🚨 Disk ${diskUsed}% CRITICAL — force restarting!`);
        process.exit(1);
    }
}, 5 * 60 * 1000); // disk check every 5 minutes

// ── Pending pairing requests: phone -> { resolve, reject } ──
const pendingPairings = new Map();

// ── Sessions map: phone -> sock ──
const activeSessions = new Map();

// ─────────────────────────────────────────
// Pairing API Server (for Vercel frontend)
// ─────────────────────────────────────────
const API_PORT = process.env.PORT || process.env.SERVER_PORT || 3000;
const API_SECRET = settings.apiSecret || 'usman-md-secret';

function jsonRes(res, code, data) {
    res.writeHead(code, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,x-api-secret',
    });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise(resolve => {
        let b = '';
        req.on('data', c => b += c);
        req.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } });
    });
}

http.createServer(async (req, res) => {
    // CORS preflight
    if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type,x-api-secret', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }); return res.end(); }

    const url = req.url.split('?')[0];

    // Serve static files from web/
    if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
        const htmlPath = path.join(__dirname, 'web', 'index.html');
        if (fs.existsSync(htmlPath)) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(fs.readFileSync(htmlPath, 'utf8'));
        }
        res.writeHead(404); return res.end('Panel not found');
    }

    if (req.method === 'GET' && url === '/owner.jpg') {
        const candidates = [
            path.join(__dirname, 'web', 'owner.jpg'),
            path.join(__dirname, 'Usmods', 'bot_image.jpg'),
            path.join(__dirname, 'assets', 'bot_image.jpg'),
        ];
        const imgPath = candidates.find(p => fs.existsSync(p));
        if (imgPath) {
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            return res.end(fs.readFileSync(imgPath));
        }
        res.writeHead(404); return res.end('Not found');
    }

    // Auth check for API routes
    const secret = req.headers['x-api-secret'];
    if (secret !== API_SECRET) return jsonRes(res, 401, { success: false, message: 'Unauthorized' });

    // POST /pair — request pairing code for a number
    if (req.method === 'POST' && (url === '/pair' || url === '/api/pair')) {
        const body = await parseBody(req);
        const phone = (body.phone || '').replace(/[^0-9]/g, '');
        if (!phone || phone.length < 10) return jsonRes(res, 400, { success: false, message: 'Valid phone number dalo' });

        try {
            console.log(chalk.cyan(`Connecting: ${phone}`));
            const code = await startPairingSession(phone);
            return jsonRes(res, 200, { success: true, code });
        } catch (e) {
            return jsonRes(res, 500, { success: false, message: e.message });
        }
    }

    // GET /sessions — list active sessions
    if (req.method === 'GET' && (url === '/sessions' || url === '/api/sessions')) {
        const sessions = [];
        for (const [phone, data] of activeSessions.entries()) {
            sessions.push({ phone, status: data.status, name: data.name || phone });
        }
        return jsonRes(res, 200, { success: true, sessions });
    }

    // POST /disconnect
    if (req.method === 'POST' && (url === '/disconnect' || url === '/api/disconnect')) {
        const body = await parseBody(req);
        const phone = (body.phone || '').replace(/[^0-9]/g, '');
        if (!phone) return jsonRes(res, 400, { success: false, message: 'Phone required' });
        const s = activeSessions.get(phone);
        if (s?.sock) { try { await s.sock.logout(); } catch {} }
        activeSessions.delete(phone);
        try { fs.rmSync(`./sessions/session_${phone}`, { recursive: true, force: true }); } catch {}
        return jsonRes(res, 200, { success: true });
    }

    jsonRes(res, 404, { success: false, message: 'Not found' });

}).listen(API_PORT, '0.0.0.0', () => {
    console.log(chalk.cyan(`🔌 Pairing API running on port ${API_PORT}`));
});

// ─────────────────────────────────────────
// Start a WhatsApp session for a phone
// ─────────────────────────────────────────
const SESSIONS_DIR = './sessions';
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

async function startPairingSession(phone) {
    const existing = activeSessions.get(phone);
    if (existing?.status === 'connected') throw new Error('Yeh number already connected hai');

    return new Promise(async (resolve, reject) => {
        try {
            const sessionPath = `${SESSIONS_DIR}/session_${phone}`;
            const { version } = await fetchLatestBaileysVersion();
            const { state: authState, saveCreds } = await useMultiFileAuthState(sessionPath);
            const msgRetryCounterCache = new NodeCache();

            const sock = makeWASocket({
                version,
                logger: pino({ level: 'silent' }),
                printQRInTerminal: false,
                browser: ['Ubuntu', 'Chrome', '20.0.04'],
                auth: {
                    creds: authState.creds,
                    keys: makeCacheableSignalKeyStore(authState.keys, pino({ level: 'fatal' })),
                },
                markOnlineOnConnect: true,
                syncFullHistory: false,
                getMessage: async (key) => {
                    const jid = jidNormalizedUser(key.remoteJid);
                    const msg = await store.loadMessage(jid, key.id);
                    return msg?.message || '';
                },
                msgRetryCounterCache,
                defaultQueryTimeoutMs: 60000,
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 10000,
            });

            activeSessions.set(phone, { sock, status: 'connecting', name: phone });
            sock.ev.on('creds.update', saveCreds);
            store.bind(sock.ev);

            setTimeout(async () => {
                try {
                    if (sock.authState.creds.registered) {
                        // Already registered — no pairing needed, connecting silently
                        resolve('already-connected');
                        return;
                    }
                    let code = await sock.requestPairingCode(phone);
                    code = code?.match(/.{1,4}/g)?.join('-') || code;
                    console.log(chalk.bgGreen(`[Pair] ${phone}: ${code}`));
                    resolve(code);
                } catch (e) {
                    reject(e);
                }
            }, 3000);

            registerSocketEvents(sock, phone);

        } catch (e) {
            reject(e);
        }
    });
}

function registerSocketEvents(sock, phone) {
    sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
        if (connection === 'open') {
            const name = sock.user?.name || phone;
            activeSessions.set(phone, { sock, status: 'connected', name });
            console.log(chalk.green(`✅ Connected: ${name} (${phone})`));
            try { restorePendingTempBans(sock); } catch {}
        }
        if (connection === 'close') {
            const code = lastDisconnect?.error?.output?.statusCode;
            const loggedOut = code === DisconnectReason.loggedOut || code === 401;
            if (loggedOut) {
                console.log(chalk.red(`❌ Logged out: ${phone}`));
                activeSessions.delete(phone);
                try { fs.rmSync(`./sessions/session_${phone}`, { recursive: true, force: true }); } catch {}
                return;
            }
            console.log(chalk.yellow(`🔄 Reconnecting: ${phone}`));
            activeSessions.set(phone, { status: 'reconnecting', name: phone });
            await delay(5000);
            startPairingSession(phone).catch(() => {});
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const mek = chatUpdate.messages[0];
            if (!mek?.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key?.remoteJid === 'status@broadcast') {
                await handleStatus(sock, chatUpdate);
                return;
            }
            if (chatUpdate.type === 'notify') await handleMessages(sock, chatUpdate, true);
        } catch (e) { console.error(`[${phone}] msg error:`, e); }
    });

    sock.ev.on('group-participants.update', async (update) => {
        try { await handleGroupParticipantUpdate(sock, update); } catch (e) { console.error(`[${phone}] group update error:`, e); }
    });

    sock.ev.on('call', async (callEvent) => {
        try { await handleIncomingCall(sock, callEvent); } catch (e) { console.error(`[${phone}] call error:`, e); }
    });

    sock.ev.on('contacts.update', update => {
        for (let contact of update) {
            const id = contact.id;
            if (store && store.contacts) store.contacts[id] = { id, name: contact.notify };
        }
    });
}

// ─────────────────────────────────────────
// Auto-load existing sessions on startup
// ─────────────────────────────────────────
async function loadExistingSessions() {
    if (!fs.existsSync(SESSIONS_DIR)) return;
    const folders = fs.readdirSync(SESSIONS_DIR)
        .filter(f => f.startsWith('session_') && fs.statSync(`${SESSIONS_DIR}/${f}`).isDirectory())
        .map(f => f.replace('session_', ''));

    console.log(chalk.cyan(`📂 Loading ${folders.length} existing session(s)...`));
    for (const phone of folders) {
        // RAM check — agar 180MB se zyada hai toh wait karo
        let ramMB = process.memoryUsage().rss / 1024 / 1024;
        let waited = 0;
        while (ramMB > 450 && waited < 30000) {
            console.log(chalk.yellow(`Waiting... RAM ${ramMB.toFixed(0)}MB high, next session hold...`));
            await delay(5000);
            waited += 5000;
            ramMB = process.memoryUsage().rss / 1024 / 1024;
        }
        try {
            console.log(chalk.cyan(`Connecting: ${phone} (RAM: ${ramMB.toFixed(0)}MB)`));
            await startPairingSession(phone);
        } catch (e) {
            // silent — connection.update will log the result
        }
        await delay(3000);
    }
}

loadExistingSessions();

// (auto-restart handlers are registered above at startup)
