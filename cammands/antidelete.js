const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');

// PER-SESSION (per logged-in number) storage: har WhatsApp number ka apna
// antidelete on/off aur apna message store hota hai, taake multi-session
// bot mein ek number ka antidelete on karne se baaki numbers per asar na ho.

// messageStore ko session ke hisaab se rakhte hain: { sessionId: Map(messageId -> data) }
const sessionMessageStores = new Map();

const DATA_DIR = path.join(__dirname, '../data');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

// sock.user.id format hota hai "923xxxxxxxxx:12@s.whatsapp.net" — sirf number nikalo
function getSessionId(sock) {
    try {
        const raw = sock?.user?.id || 'default';
        return raw.split(':')[0].split('@')[0].replace(/[^0-9]/g, '') || 'default';
    } catch {
        return 'default';
    }
}

function getMessageStore(sock) {
    const sessionId = getSessionId(sock);
    if (!sessionMessageStores.has(sessionId)) {
        sessionMessageStores.set(sessionId, new Map());
    }
    return sessionMessageStores.get(sessionId);
}

function getConfigPath(sessionId) {
    return path.join(DATA_DIR, `antidelete_${sessionId}.json`);
}

// Ensure tmp dir exists
if (!fs.existsSync(TEMP_MEDIA_DIR)) {
    fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });
}

// Cleanup tmp if > 200MB
const cleanTempFolderIfLarge = () => {
    try {
        const files = fs.readdirSync(TEMP_MEDIA_DIR);
        let totalSize = 0;
        for (const file of files) {
            const fp = path.join(TEMP_MEDIA_DIR, file);
            if (fs.statSync(fp).isFile()) totalSize += fs.statSync(fp).size;
        }
        if (totalSize / (1024 * 1024) > 200) {
            for (const file of files) {
                try { fs.unlinkSync(path.join(TEMP_MEDIA_DIR, file)); } catch {}
            }
        }
    } catch {}
};
setInterval(cleanTempFolderIfLarge, 60 * 1000);

function loadAntideleteConfig(sock) {
    const sessionId = getSessionId(sock);
    const CONFIG_PATH = getConfigPath(sessionId);
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false };
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8').trim();
        return raw ? JSON.parse(raw) : { enabled: false };
    } catch { return { enabled: false }; }
}

function saveAntideleteConfig(sock, config) {
    const sessionId = getSessionId(sock);
    const CONFIG_PATH = getConfigPath(sessionId);
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch {}
}

const isOwnerOrSudo = require('../lib/isOwner');


// ── Safe media downloader — catches empty media key errors ──
async function safeDownload(msgObj, type) {
    try {
        const stream = await downloadContentFromMessage(msgObj, type);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buf = Buffer.concat(chunks);
        if (!buf || buf.length === 0) return null;
        return buf;
    } catch (err) {
        // Silently ignore "Cannot derive from empty media key" and similar
        return null;
    }
}

// Command Handler
async function handleAntideleteCommand(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        return sock.sendMessage(chatId, { text: '*Only the bot owner can use this command.*' }, { quoted: message });
    }

    const config = loadAntideleteConfig(sock);

    if (!match) {
        return sock.sendMessage(chatId, {
            text: `*ANTIDELETE SETUP*\n\nCurrent Status: ${config.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n*.antidelete on* - Enable\n*.antidelete off* - Disable`
        }, { quoted: message });
    }

    if (match === 'on') config.enabled = true;
    else if (match === 'off') config.enabled = false;
    else return sock.sendMessage(chatId, { text: '*Invalid command. Use .antidelete to see usage.*' }, { quoted: message });

    saveAntideleteConfig(sock, config);
    return sock.sendMessage(chatId, { text: `*Antidelete ${match === 'on' ? 'enabled ✅' : 'disabled ❌'}*` }, { quoted: message });
}

// Store incoming messages
async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig(sock);
        if (!config.enabled) return;
        if (!message.key?.id) return;

        const messageStore = getMessageStore(sock);
        const messageId = message.key.id;
        let content = '';
        let mediaType = '';
        let mediaPath = '';

        const sender = message.key.participant || message.key.remoteJid;
        const msg = message.message;
        if (!msg) return;

        // Unwrap wrappers
        const inner =
            msg.viewOnceMessageV2?.message ||
            msg.viewOnceMessage?.message ||
            msg.ephemeralMessage?.message ||
            msg;

        if (inner.conversation) {
            content = inner.conversation;
        } else if (inner.extendedTextMessage?.text) {
            content = inner.extendedTextMessage.text;
        } else if (inner.imageMessage) {
            const buf = await safeDownload(inner.imageMessage, 'image');
            if (buf) {
                mediaType = 'image';
                content = inner.imageMessage.caption || '';
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.jpg`);
                await writeFile(mediaPath, buf);
            }
        } else if (inner.videoMessage) {
            const buf = await safeDownload(inner.videoMessage, 'video');
            if (buf) {
                mediaType = 'video';
                content = inner.videoMessage.caption || '';
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.mp4`);
                await writeFile(mediaPath, buf);
            }
        } else if (inner.audioMessage) {
            const buf = await safeDownload(inner.audioMessage, 'audio');
            if (buf) {
                mediaType = 'audio';
                const mime = inner.audioMessage.mimetype || '';
                const ext = mime.includes('ogg') ? 'ogg' : 'mp3';
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.${ext}`);
                await writeFile(mediaPath, buf);
            }
        } else if (inner.stickerMessage) {
            const buf = await safeDownload(inner.stickerMessage, 'sticker');
            if (buf) {
                mediaType = 'sticker';
                mediaPath = path.join(TEMP_MEDIA_DIR, `${messageId}.webp`);
                await writeFile(mediaPath, buf);
            }
        }

        messageStore.set(messageId, {
            content,
            mediaType,
            mediaPath,
            sender,
            group: message.key.remoteJid?.endsWith('@g.us') ? message.key.remoteJid : null,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        // Never crash the bot from storeMessage
        console.error('storeMessage error:', err.message);
    }
}

// Handle message deletion
async function handleMessageRevocation(sock, revocationMessage) {
    try {
        const config = loadAntideleteConfig(sock);
        if (!config.enabled) return;

        const messageId = revocationMessage.message?.protocolMessage?.key?.id;
        if (!messageId) return;

        const messageStore = getMessageStore(sock);

        const deletedBy = revocationMessage.participant || revocationMessage.key?.participant || revocationMessage.key?.remoteJid;
        const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        if (!deletedBy || deletedBy.includes(sock.user.id) || deletedBy === ownerNumber) return;

        const original = messageStore.get(messageId);
        if (!original) return;

        const sender = original.sender;
        const senderName = sender.split('@')[0];
        const groupName = original.group ? (await sock.groupMetadata(original.group).catch(() => ({ subject: 'Unknown' }))).subject : '';

        const time = new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Karachi', hour12: true,
            hour: '2-digit', minute: '2-digit', second: '2-digit',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });

        let text = `*🔰 ANTIDELETE REPORT 🔰*\n\n` +
            `*🗑️ Deleted By:* @${deletedBy.split('@')[0]}\n` +
            `*👤 Sender:* @${senderName}\n` +
            `*📱 Number:* ${sender}\n` +
            `*🕒 Time:* ${time}\n`;

        if (groupName) text += `*👥 Group:* ${groupName}\n`;
        if (original.content) text += `\n*💬 Deleted Message:*\n${original.content}`;

        await sock.sendMessage(ownerNumber, { text, mentions: [deletedBy, sender] });

        if (original.mediaType && original.mediaPath && fs.existsSync(original.mediaPath)) {
            const mediaOptions = {
                caption: `*Deleted ${original.mediaType}*\nFrom: @${senderName}`,
                mentions: [sender]
            };
            try {
                if (original.mediaType === 'image') {
                    await sock.sendMessage(ownerNumber, { image: { url: original.mediaPath }, ...mediaOptions });
                } else if (original.mediaType === 'video') {
                    await sock.sendMessage(ownerNumber, { video: { url: original.mediaPath }, ...mediaOptions });
                } else if (original.mediaType === 'audio') {
                    await sock.sendMessage(ownerNumber, { audio: { url: original.mediaPath }, mimetype: 'audio/mpeg', ptt: false });
                } else if (original.mediaType === 'sticker') {
                    await sock.sendMessage(ownerNumber, { sticker: { url: original.mediaPath } });
                }
            } catch {}
            try { fs.unlinkSync(original.mediaPath); } catch {}
        }

        messageStore.delete(messageId);

    } catch (err) {
        console.error('handleMessageRevocation error:', err.message);
    }
}

module.exports = { handleAntideleteCommand, handleMessageRevocation, storeMessage };
