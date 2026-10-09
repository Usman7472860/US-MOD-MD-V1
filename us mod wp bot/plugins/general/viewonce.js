/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

// ─── Helper: Download with Retry ─────────────────────────────────────────────
async function downloadWithRetry(mediaMsg, type, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const stream = await downloadContentFromMessage(mediaMsg, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            if (buffer.length === 0) throw new Error('Empty buffer received');
            return buffer;
        } catch (err) {
            console.warn(`[ViewOnce] Download attempt ${attempt}/${retries} failed: ${err.message}`);
            if (attempt < retries) await new Promise(r => setTimeout(r, 1000 * attempt));
            else throw err;
        }
    }
}

// ─── Helper: Extract media from a (possibly view-once wrapped) message ───────
function extractMedia(msgNode) {
    if (!msgNode) return null;

    const inner =
        msgNode.viewOnceMessage?.message ||
        msgNode.viewOnceMessageV2?.message ||
        msgNode.viewOnceMessageV2Extension?.message ||
        msgNode;

    if (inner.imageMessage) {
        return { mediaMsg: inner.imageMessage, type: 'image', caption: inner.imageMessage.caption || '' };
    }
    if (inner.videoMessage) {
        return { mediaMsg: inner.videoMessage, type: 'video', caption: inner.videoMessage.caption || '' };
    }
    if (inner.audioMessage) {
        return {
            mediaMsg: inner.audioMessage,
            type: 'audio',
            caption: '',
            mimetype: inner.audioMessage.mimetype || 'audio/ogg; codecs=opus',
            ptt: inner.audioMessage.ptt !== undefined ? inner.audioMessage.ptt : true
        };
    }
    return null;
}

// ─── Manual .vv Command ───────────────────────────────────────────────────────
async function viewonceCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    console.log('[ViewOnce] quoted keys:', quoted ? Object.keys(quoted) : 'NO QUOTED');
    if (quoted) console.log('[ViewOnce] quoted full:', JSON.stringify(quoted, null, 2));

    if (!quoted) {
        return sock.sendMessage(chatId, {
            text: '❌ Kisi view-once image, video, ya audio ko reply karo.'
        }, { quoted: message });
    }

    const info = extractMedia(quoted);

    if (!info) {
        return sock.sendMessage(chatId, {
            text: '❌ Reply kiye gaye message mein koi image, video ya audio nahi mila.'
        }, { quoted: message });
    }

    try {
        const buffer = await downloadWithRetry(info.mediaMsg, info.type);

        // Target JID determine karo
        const isGroup = chatId.endsWith('@g.us');
        let userJid;

        if (!isGroup) {
            // Private chat: command user wahi hai jiske saath chat hai
            userJid = chatId;
        } else {
            // Group: sender ka real number JID nikalo
            const sender = message.key.participant || message.key.remoteJid;
            if (sender.endsWith('@lid')) {
                // LID ko phone number JID mein resolve karo
                const results = await sock.onWhatsApp(sender);
                userJid = results?.[0]?.jid || sender;
            } else {
                userJid = sender;
            }
        }

        console.log('[ViewOnce] Sending .vv result to:', userJid);

        if (info.type === 'image') {
            await sock.sendMessage(userJid, {
                image: buffer,
                caption: `👁️ *View Once Image*${info.caption ? `\n📝 ${info.caption}` : ''}`
            });
        } else if (info.type === 'video') {
            await sock.sendMessage(userJid, {
                video: buffer,
                caption: `👁️ *View Once Video*${info.caption ? `\n📝 ${info.caption}` : ''}`
            });
        } else if (info.type === 'audio') {
            await sock.sendMessage(userJid, {
                audio: buffer,
                mimetype: info.mimetype,
                ptt: info.ptt
            });
        }

        // .vv message delete karo (5 sec baad)
        setTimeout(() => {
            sock.sendMessage(chatId, { delete: message.key }).catch(() => {});
        }, 5000);

    } catch (e) {
        console.error('[ViewOnce] .vv error:', e.message);
        await sock.sendMessage(chatId, {
            text: '❌ View once media reveal nahi ho saka. Dobara try karo.'
        }, { quoted: message });
    }
}

module.exports = viewonceCommand;
