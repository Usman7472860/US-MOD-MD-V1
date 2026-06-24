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

// ── Default config shape ──
// mode: 'off' | 'global' | 'group'  (group = only active inside groups, dm skipped)
// exclude: array of bare numbers (no @s.whatsapp.net) ignored from tracking/reporting
function defaultConfig() {
    return { enabled: false, mode: 'global', exclude: [] };
}

function loadAntideleteConfig(sock) {
    const sessionId = getSessionId(sock);
    const CONFIG_PATH = getConfigPath(sessionId);
    try {
        if (!fs.existsSync(CONFIG_PATH)) return defaultConfig();
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8').trim();
        if (!raw) return defaultConfig();
        const parsed = JSON.parse(raw);
        // backward-compat: migrate old { enabled } only configs
        return { ...defaultConfig(), ...parsed };
    } catch { return defaultConfig(); }
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

// ── Helpers ──
function bareNumber(jid) {
    return (jid || '').split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
}

function isExcluded(config, jid) {
    const num = bareNumber(jid);
    return Array.isArray(config.exclude) && config.exclude.includes(num);
}

function formatTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Karachi', hour12: true,
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}

const MEDIA_LABELS = {
    image: '🖼️ Image',
    video: '🎬 Video',
    audio: '🎵 Audio',
    sticker: '🌟 Sticker'
};

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

// ── Command Handler ──
// Supported:
//   .antidelete                  -> show status menu
//   .antidelete on               -> enable (global, applies everywhere)
//   .antidelete on global        -> enable everywhere
//   .antidelete on group         -> enable only inside groups (DMs ignored)
//   .antidelete off              -> disable completely
//   .antidelete exclude <number> -> stop tracking a number
//   .antidelete include <number> -> resume tracking a number
//   .antidelete excluded         -> list excluded numbers
async function handleAntideleteCommand(sock, chatId, message, match) {
    const senderId = message.key.participant || message.key.remoteJid;
    const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

    if (!message.key.fromMe && !isOwner) {
        return sock.sendMessage(chatId, { text: '*✦ Only the bot owner can use this command.*' }, { quoted: message });
    }

    const config = loadAntideleteConfig(sock);
    const args = (match || '').trim().split(/\s+/).filter(Boolean);
    const sub = (args[0] || '').toLowerCase();

    if (!sub) {
        const statusLine = config.enabled
            ? (config.mode === 'group' ? '✅ Enabled · Groups only' : '✅ Enabled · Everywhere')
            : '❌ Disabled';

        const excludedList = config.exclude.length
            ? config.exclude.map(n => `   • ${n}`).join('\n')
            : '   • None';

        const text =
`╭─❑ *ANTIDELETE · PREMIUM* ❑─╮

*Status:* ${statusLine}

*Excluded Numbers:*
${excludedList}

╰────────────────────╯
*Commands*
▸ .antidelete on            — enable everywhere
▸ .antidelete on group      — enable for groups only
▸ .antidelete off           — disable
▸ .antidelete exclude <num> — ignore a number
▸ .antidelete include <num> — un-ignore a number
▸ .antidelete excluded      — list ignored numbers`;

        return sock.sendMessage(chatId, { text }, { quoted: message });
    }

    if (sub === 'on') {
        const scope = (args[1] || 'global').toLowerCase();
        if (scope !== 'global' && scope !== 'group') {
            return sock.sendMessage(chatId, { text: '*Invalid scope. Use:* .antidelete on global *or* .antidelete on group' }, { quoted: message });
        }
        config.enabled = true;
        config.mode = scope;
        saveAntideleteConfig(sock, config);
        return sock.sendMessage(chatId, {
            text: `*✅ Antidelete enabled* — ${scope === 'group' ? 'groups only' : 'everywhere'}`
        }, { quoted: message });
    }

    if (sub === 'off') {
        config.enabled = false;
        saveAntideleteConfig(sock, config);
        return sock.sendMessage(chatId, { text: '*❌ Antidelete disabled*' }, { quoted: message });
    }

    if (sub === 'exclude') {
        const num = bareNumber(args[1]);
        if (!num) return sock.sendMessage(chatId, { text: '*Usage:* .antidelete exclude <number>' }, { quoted: message });
        if (!config.exclude.includes(num)) config.exclude.push(num);
        saveAntideleteConfig(sock, config);
        return sock.sendMessage(chatId, { text: `*🚫 Excluded:* ${num}\nMessages from this number will no longer be tracked.` }, { quoted: message });
    }

    if (sub === 'include') {
        const num = bareNumber(args[1]);
        if (!num) return sock.sendMessage(chatId, { text: '*Usage:* .antidelete include <number>' }, { quoted: message });
        config.exclude = config.exclude.filter(n => n !== num);
        saveAntideleteConfig(sock, config);
        return sock.sendMessage(chatId, { text: `*✅ Re-included:* ${num}` }, { quoted: message });
    }

    if (sub === 'excluded') {
        const list = config.exclude.length ? config.exclude.map(n => `• ${n}`).join('\n') : 'No numbers excluded.';
        return sock.sendMessage(chatId, { text: `*🚫 Excluded Numbers*\n\n${list}` }, { quoted: message });
    }

    return sock.sendMessage(chatId, { text: '*Invalid command. Use .antidelete to see usage.*' }, { quoted: message });
}

// ── Should this chat/message be tracked under current config? ──
function shouldTrack(config, message) {
    if (!config.enabled) return false;
    const isGroup = message.key.remoteJid?.endsWith('@g.us');
    if (config.mode === 'group' && !isGroup) return false;

    const sender = message.key.participant || message.key.remoteJid;
    if (isExcluded(config, sender)) return false;

    return true;
}

// ── Store incoming messages (for delete + edit detection) ──
async function storeMessage(sock, message) {
    try {
        const config = loadAntideleteConfig(sock);
        if (!shouldTrack(config, message)) return;
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

// ── Handle message deletion ──
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
        if (isExcluded(config, deletedBy)) return;

        const original = messageStore.get(messageId);
        if (!original) return;

        const sender = original.sender;
        const senderName = sender.split('@')[0];
        const groupName = original.group ? (await sock.groupMetadata(original.group).catch(() => ({ subject: 'Unknown' }))).subject : '';
        const time = formatTime();
        const typeLabel = original.mediaType ? MEDIA_LABELS[original.mediaType] : '📝 Text';

        let text =
`╭─❑ *ANTIDELETE · DELETED* ❑─╮

*🗑️ Deleted By:* @${deletedBy.split('@')[0]}
*👤 Original Sender:* @${senderName}
*📱 Number:* ${sender}
*📦 Type:* ${typeLabel}
*🕒 Time:* ${time}`;

        if (groupName) text += `\n*👥 Group:* ${groupName}`;
        if (original.content) text += `\n\n*💬 Message Content:*\n${original.content}`;
        text += `\n╰────────────────────╯`;

        await sock.sendMessage(ownerNumber, { text, mentions: [deletedBy, sender] });

        if (original.mediaType && original.mediaPath && fs.existsSync(original.mediaPath)) {
            const mediaOptions = {
                caption: `*${MEDIA_LABELS[original.mediaType]} — Deleted*\nFrom: @${senderName}`,
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

// ── Handle message edits ──
// Baileys emits edits as a message whose `message.editedMessage` (protocol
// EDIT type) wraps the new content and references the original key. Hook
// this from your messages.upsert listener alongside storeMessage/revocation.
async function handleMessageEdit(sock, editMessage) {
    try {
        const config = loadAntideleteConfig(sock);
        if (!config.enabled) return;

        // protocolMessage type 14 = MESSAGE_EDIT in Baileys
        const protocol = editMessage.message?.protocolMessage;
        if (!protocol || !protocol.editedMessage) return;

        const messageId = protocol.key?.id;
        if (!messageId) return;

        const editor = editMessage.key.participant || editMessage.key.remoteJid;
        const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        if (!editor || editor.includes(sock.user.id) || editor === ownerNumber) return;
        if (isExcluded(config, editor)) return;

        const messageStore = getMessageStore(sock);
        const original = messageStore.get(messageId);
        if (!original) return;

        const newInner = protocol.editedMessage;
        const newContent = newInner.conversation || newInner.extendedTextMessage?.text || '';
        if (!newContent) return;

        const senderName = original.sender.split('@')[0];
        const groupName = original.group ? (await sock.groupMetadata(original.group).catch(() => ({ subject: 'Unknown' }))).subject : '';
        const time = formatTime();

        let text =
`╭─❑ *ANTIDELETE · EDITED* ❑─╮

*✏️ Edited By:* @${senderName}
*📱 Number:* ${original.sender}
*🕒 Time:* ${time}`;

        if (groupName) text += `\n*👥 Group:* ${groupName}`;
        text += `\n\n*Before:*\n${original.content || '_(empty)_'}\n\n*After:*\n${newContent}`;
        text += `\n╰────────────────────╯`;

        await sock.sendMessage(ownerNumber, { text, mentions: [editor] });

        // keep the store updated so a later delete reports the latest content
        original.content = newContent;
        messageStore.set(messageId, original);

    } catch (err) {
        console.error('handleMessageEdit error:', err.message);
    }
}

module.exports = {
    handleAntideleteCommand,
    handleMessageRevocation,
    handleMessageEdit,
    storeMessage
};
