/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

/**
 * US MOD MD - Multi Session Manager
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const NodeCache = require('node-cache');
const pino = require('pino');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
    delay,
} = require('@whiskeysockets/baileys');

const settings = require('./settings');
const { handleMessages } = require('./usman');
const { handleMessageDelete } = require('./Usman/antidelete');
const { handleStatus } = require('./Usman/autostatus');
const store = require('./sido/store');

const SESSIONS_DIR = path.join(__dirname, 'sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

// Active sessions map: phoneNumber -> { sock, status, name }
const activeSessions = new Map();

function getSessionPath(phoneNumber) {
    return path.join(SESSIONS_DIR, `session_${phoneNumber}`);
}

function getAllSessions() {
    const result = [];
    for (const [phone, data] of activeSessions.entries()) {
        result.push({
            phone,
            status: data.status,
            name: data.name || phone,
            connectedAt: data.connectedAt || null,
        });
    }
    return result;
}

function getSessionFolders() {
    if (!fs.existsSync(SESSIONS_DIR)) return [];
    return fs.readdirSync(SESSIONS_DIR)
        .filter(f => f.startsWith('session_') && fs.statSync(path.join(SESSIONS_DIR, f)).isDirectory())
        .map(f => f.replace('session_', ''));
}

async function startSession(phoneNumber) {
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    if (activeSessions.has(phoneNumber)) {
        const existing = activeSessions.get(phoneNumber);
        if (existing.status === 'connected') {
            return { success: false, message: 'Already connected' };
        }
    }

    activeSessions.set(phoneNumber, { status: 'connecting', name: phoneNumber });

    try {
        const { version } = await fetchLatestBaileysVersion();
        const sessionPath = getSessionPath(phoneNumber);
        const { state: authState, saveCreds } = await useMultiFileAuthState(sessionPath);
        const msgRetryCounterCache = new NodeCache();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            browser: ['Ubuntu', 'Chrome', '20.0.04'],
            auth: {
                creds: authState.creds,
                keys: makeCacheableSignalKeyStore(
                    authState.keys,
                    pino({ level: 'fatal' }).child({ level: 'fatal' })
                ),
            },
            markOnlineOnConnect: true,
            generateHighQualityLinkPreview: true,
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

        activeSessions.get(phoneNumber).sock = sock;

        sock.ev.on('creds.update', saveCreds);
        store.bind(sock.ev);

        sock.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (connection === 'open') {
                const name = sock.user?.name || phoneNumber;
                activeSessions.set(phoneNumber, {
                    sock,
                    status: 'connected',
                    name,
                    connectedAt: new Date().toISOString(),
                });
                console.log(chalk.green(`✅ Session connected: ${name} (${phoneNumber})`));
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401;

                if (loggedOut) {
                    console.log(chalk.red(`❌ Session logged out: ${phoneNumber}`));
                    activeSessions.set(phoneNumber, { status: 'logged_out', name: phoneNumber });
                    try {
                        fs.rmSync(getSessionPath(phoneNumber), { recursive: true, force: true });
                    } catch {}
                    return;
                }

                console.log(chalk.yellow(`🔄 Session reconnecting: ${phoneNumber}`));
                activeSessions.set(phoneNumber, { status: 'reconnecting', name: phoneNumber });
                await delay(5000);
                startSession(phoneNumber);
            }
        });

        sock.ev.on('messages.upsert', async (chatUpdate) => {
            try {
                const msg = chatUpdate.messages[0];
                if (!msg?.message) return;
                const chatId = msg.key.remoteJid;

                if (chatId === 'status@broadcast') {
                    await handleStatus(sock, msg);
                    return;
                }

                if (chatUpdate.type === 'notify') {
                    // ── Group Priority Logic ──────────────────────────────
                    // Agar yeh group message hai, to check karo:
                    // Kya owner ka session connected hai?
                    // Agar haan → sirf owner session respond kare, baaki skip
                    // Agar nahi → jo bhi pehla connected session hai woh respond kare
                    // ── Per-Group Owner Priority Logic ───────────────────
                    // Rule:
                    //  1. Agar group mein OWNER bhi connected hai AUR is group ka member bhi hai
                    //     → sirf owner ka bot respond kare, baaki sab skip
                    //  2. Agar is group mein owner member nahi (ya owner offline) hai
                    //     → pehla available connected user bot respond kare
                    //  3. Private chat → koi restriction nahi
                    if (chatId.endsWith('@g.us')) {
                        const ownerPhone = (settings.ownerNumber || '').replace(/[^0-9]/g, '');
                        const ownerSession = activeSessions.get(ownerPhone);
                        const ownerConnected = ownerSession?.status === 'connected';

                        if (ownerConnected) {
                            // Owner online hai — check karo ke kya owner IS specific group ka member hai
                            let ownerInThisGroup = false;
                            try {
                                const metadata = await sock.groupMetadata(chatId);
                                const participants = metadata.participants || [];
                                ownerInThisGroup = participants.some(p => {
                                    const pId = (p.id || '').split(':')[0].split('@')[0];
                                    return pId === ownerPhone;
                                });
                            } catch (e) {
                                // Agar metadata na mile, safe side: owner ko priority do
                                ownerInThisGroup = true;
                            }

                            if (ownerInThisGroup) {
                                // Owner is group mein hai → sirf owner bot kaam kare
                                if (phoneNumber !== ownerPhone) return;
                            } else {
                                // Owner is group mein nahi → pehla connected user respond kare
                                let firstConnected = null;
                                for (const [phone, data] of activeSessions.entries()) {
                                    if (data.status === 'connected') { firstConnected = phone; break; }
                                }
                                if (firstConnected && phoneNumber !== firstConnected) return;
                            }
                        } else {
                            // Owner offline → pehla connected session respond kare
                            let firstConnected = null;
                            for (const [phone, data] of activeSessions.entries()) {
                                if (data.status === 'connected') { firstConnected = phone; break; }
                            }
                            if (firstConnected && phoneNumber !== firstConnected) return;
                        }
                    }
                    // ─────────────────────────────────────────────────────

                    await handleMessages(sock, chatUpdate);
                }
            } catch (err) {
                console.error(`[${phoneNumber}] messages.upsert error:`, err);
            }
        });

        sock.ev.on('messages.update', async (updates) => {
            try {
                if (!settings.antiDelete) return;
                const deletedKeys = [];
                for (const update of updates) {
                    if (update.update?.message === null || update.update?.status === 6) {
                        deletedKeys.push(update.key);
                    }
                }
                if (deletedKeys.length > 0) await handleMessageDelete(sock, deletedKeys);
            } catch (err) {
                console.error(`[${phoneNumber}] messages.update error:`, err);
            }
        });

        return { success: true, sock, phoneNumber };

    } catch (err) {
        console.error(`startSession error (${phoneNumber}):`, err);
        activeSessions.set(phoneNumber, { status: 'error', name: phoneNumber });
        return { success: false, message: err.message };
    }
}

async function requestPairingCode(phoneNumber) {
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    // Start session first
    const result = await startSession(phoneNumber);
    if (!result.success && result.message === 'Already connected') {
        return { success: false, message: 'Yeh number already connected hai' };
    }

    const sessionData = activeSessions.get(phoneNumber);
    if (!sessionData?.sock) {
        return { success: false, message: 'Session start nahi hua' };
    }

    const sock = sessionData.sock;

    // Wait for socket to be ready
    await delay(3000);

    try {
        if (sock.authState.creds.registered) {
            return { success: false, message: 'Yeh number already registered hai' };
        }

        let code = await sock.requestPairingCode(phoneNumber);
        code = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(chalk.bgGreen(`[Pairing] ${phoneNumber}: ${code}`));
        return { success: true, code };
    } catch (err) {
        console.error(`Pairing code error (${phoneNumber}):`, err.message);
        return { success: false, message: err.message };
    }
}

async function disconnectSession(phoneNumber) {
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    const sessionData = activeSessions.get(phoneNumber);
    if (sessionData?.sock) {
        try { await sessionData.sock.logout(); } catch {}
    }
    activeSessions.delete(phoneNumber);
    try {
        fs.rmSync(getSessionPath(phoneNumber), { recursive: true, force: true });
    } catch {}
    return { success: true };
}

// Auto-load existing sessions on startup
async function loadExistingSessions() {
    const phones = getSessionFolders();
    console.log(chalk.cyan(`📂 Found ${phones.length} existing session(s), loading...`));
    for (const phone of phones) {
        await startSession(phone);
        await delay(2000); // Stagger connections
    }
}

module.exports = {
    startSession,
    requestPairingCode,
    disconnectSession,
    getAllSessions,
    activeSessions,
    loadExistingSessions,
};
