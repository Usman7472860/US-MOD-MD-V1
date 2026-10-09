/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

/**
 * Extra API Commands (all-in-one)
 * ─────────────────────────────────────────────
 * .nanobanana <prompt>          → AI image generate/edit
 * .quran <surah>:<ayat>         → Quran ayat lookup
 * .tgsticker <t.me link>        → fetch telegram sticker pack
 * .aivoice <voice> | <text>     → AI character voice
 * .sptts <text>                 → natural TTS (speechma)
 * .obfuscate (reply to .js)     → protect own source (OWNER ONLY)
 *
 * NOTE: davidcyril docs page bot-detection ki wajah se access nahi ho saka,
 * isliye query param names (prompt/text/url) best-guess convention pe hain.
 * Agar koi command error de, exact error text bhej dena — param name fix ho jayega.
 */

const axios = require('axios');
const FormData = require('form-data');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../../lib/uploadImage');
const isOwnerOrSudo = require('../../lib/isOwner');

const API_BASE = 'https://apis.davidcyril.name.ng';

// ── shared helpers ──
async function getQuotedImageUrl(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = quoted?.imageMessage || message.message?.imageMessage;
    if (!imgMsg) return null;
    const stream = await downloadContentFromMessage(imgMsg, 'image');
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return await uploadImage(Buffer.concat(chunks));
}

async function reactStep(sock, message, emoji) {
    await sock.sendMessage(message.key.remoteJid, { react: { text: emoji, key: message.key } });
}

// ── 1) Nanobanana AI image ──
async function nanobananaCommand(sock, chatId, message, args) {
    try {
        const prompt = (args || '').trim();
        if (!prompt) {
            return await sock.sendMessage(chatId, {
                text: '🍌 *Nanobanana AI*\n\nUsage: .nanobanana <prompt>\n(Image reply karke bhi bhej sakte ho — edit mode)'
            }, { quoted: message });
        }
        await reactStep(sock, message, '🎨');

        const imageUrl = await getQuotedImageUrl(message);
        const params = { prompt };
        if (imageUrl) params.url = imageUrl;

        const response = await axios.get(`${API_BASE}/nanobanana`, {
            params, responseType: 'arraybuffer', timeout: 60000, validateStatus: () => true
        });

        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            const json = JSON.parse(Buffer.from(response.data).toString('utf8'));
            const resultUrl = json?.result || json?.url || json?.data?.url;
            if (!resultUrl) throw new Error(json?.message || 'API ne image return nahi ki.');
            await sock.sendMessage(chatId, { image: { url: resultUrl }, caption: `🍌 *Nanobanana*\n${prompt}` }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { image: Buffer.from(response.data), caption: `🍌 *Nanobanana*\n${prompt}` }, { quoted: message });
        }
        await reactStep(sock, message, '✅');
    } catch (err) {
        console.error('[Nanobanana] Error:', err.message);
        await reactStep(sock, message, '❌');
        await sock.sendMessage(chatId, { text: `❌ Nanobanana failed: ${err.message}` }, { quoted: message });
    }
}

// ── 2) Quran ayat lookup ──
async function quranCommand(sock, chatId, message, args) {
    try {
        const query = (args || '').trim();
        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '📖 *Quran*\n\nUsage: .quran <surah>:<ayat>\nExample: .quran 2:255 (Ayat-ul-Kursi)'
            }, { quoted: message });
        }
        await reactStep(sock, message, '📖');

        const [surah, ayat] = query.split(':').map(s => s.trim());
        const params = { surah };
        if (ayat) params.ayat = ayat;

        const { data } = await axios.get(`${API_BASE}/endpoints/tools/quran`, { params, timeout: 20000 });
        const result = data?.result || data?.data || data;
        if (!result) throw new Error('Ayat not found.');

        const arabic = result.arabic || result.text_arabic || result.ayah || '';
        const translation = result.translation || result.text_english || result.urdu || '';
        const surahName = result.surah_name || result.surahName || `Surah ${surah}`;

        const text = `📖 *${surahName}${ayat ? ` — Ayat ${ayat}` : ''}*\n\n` +
            (arabic ? `${arabic}\n\n` : '') + (translation ? `_${translation}_` : '');

        await sock.sendMessage(chatId, { text }, { quoted: message });
        await reactStep(sock, message, '✅');
    } catch (err) {
        console.error('[Quran] Error:', err.message);
        await reactStep(sock, message, '❌');
        await sock.sendMessage(chatId, { text: `❌ Quran lookup failed: ${err.message}\n\nFormat check karo: .quran 2:255` }, { quoted: message });
    }
}

// ── 3) Telegram sticker pack fetch ──
async function tgStickerCommand(sock, chatId, message, args) {
    try {
        const query = (args || '').trim();
        if (!query) {
            return await sock.sendMessage(chatId, {
                text: '🎟️ *Telegram Sticker*\n\nUsage: .tgsticker <t.me sticker pack link>\nExample: .tgsticker https://t.me/addstickers/PackName'
            }, { quoted: message });
        }
        await reactStep(sock, message, '⏳');

        const { data } = await axios.get(`${API_BASE}/telegram-sticker`, { params: { url: query }, timeout: 30000 });
        const stickers = data?.result || data?.data || [];
        const list = Array.isArray(stickers) ? stickers : [stickers];
        if (!list.length) throw new Error('Koi sticker nahi mila.');

        for (const s of list.slice(0, 10)) {
            const url = typeof s === 'string' ? s : (s.url || s.file);
            if (!url) continue;
            await sock.sendMessage(chatId, { sticker: { url } }, { quoted: message });
        }
        await reactStep(sock, message, '✅');
    } catch (err) {
        console.error('[TG Sticker] Error:', err.message);
        await reactStep(sock, message, '❌');
        await sock.sendMessage(chatId, { text: `❌ Telegram sticker fetch failed: ${err.message}` }, { quoted: message });
    }
}

// ── 4) AI Voice (character/celebrity) ──
async function voiceAiCommand(sock, chatId, message, args) {
    try {
        const raw = (args || '').trim();
        if (!raw || !raw.includes('|')) {
            return await sock.sendMessage(chatId, {
                text: '🎙️ *AI Voice*\n\nUsage: .aivoice <voice> | <text>\nExample: .aivoice obama | hello world'
            }, { quoted: message });
        }
        const [voice, ...rest] = raw.split('|');
        const text = rest.join('|').trim();
        await reactStep(sock, message, '🎙️');

        const response = await axios.get(`${API_BASE}/voiceai`, {
            params: { voice: voice.trim(), text }, responseType: 'arraybuffer', timeout: 40000, validateStatus: () => true
        });

        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            const json = JSON.parse(Buffer.from(response.data).toString('utf8'));
            const audioUrl = json?.result || json?.url;
            if (!audioUrl) throw new Error(json?.message || 'API ne audio return nahi ki.');
            await sock.sendMessage(chatId, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { audio: Buffer.from(response.data), mimetype: 'audio/mpeg', ptt: true }, { quoted: message });
        }
        await reactStep(sock, message, '✅');
    } catch (err) {
        console.error('[VoiceAI] Error:', err.message);
        await reactStep(sock, message, '❌');
        await sock.sendMessage(chatId, { text: `❌ AI Voice failed: ${err.message}` }, { quoted: message });
    }
}

// ── 5) Speechma natural TTS ──
async function speechmaCommand(sock, chatId, message, args) {
    try {
        const text = (args || '').trim();
        if (!text) {
            return await sock.sendMessage(chatId, {
                text: '🗣️ *Speechma TTS*\n\nUsage: .sptts <text>\nExample: .sptts assalam o alaikum'
            }, { quoted: message });
        }
        await reactStep(sock, message, '🗣️');

        const response = await axios.get(`${API_BASE}/tools/speechma`, {
            params: { text }, responseType: 'arraybuffer', timeout: 40000, validateStatus: () => true
        });

        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            const json = JSON.parse(Buffer.from(response.data).toString('utf8'));
            const audioUrl = json?.result || json?.url;
            if (!audioUrl) throw new Error(json?.message || 'API ne audio return nahi ki.');
            await sock.sendMessage(chatId, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: true }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { audio: Buffer.from(response.data), mimetype: 'audio/mpeg', ptt: true }, { quoted: message });
        }
        await reactStep(sock, message, '✅');
    } catch (err) {
        console.error('[Speechma] Error:', err.message);
        await reactStep(sock, message, '❌');
        await sock.sendMessage(chatId, { text: `❌ Speechma TTS failed: ${err.message}` }, { quoted: message });
    }
}

// ── 6) Obfuscate (OWNER ONLY, protects your own files) ──
async function obfuscateCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        if (!message.key.fromMe && !isOwner) {
            return await sock.sendMessage(chatId, { text: '❌ Ye command sirf owner ke liye hai.' }, { quoted: message });
        }

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const docMsg = quoted?.documentMessage;
        if (!docMsg || !(docMsg.fileName || '').endsWith('.js')) {
            return await sock.sendMessage(chatId, {
                text: '🔒 *Obfuscate*\n\nApni .js file ko reply karke .obfuscate bhejo.\n(Sirf apni khud ki likhi files protect karne ke liye.)'
            }, { quoted: message });
        }
        await reactStep(sock, message, '🔒');

        const stream = await downloadContentFromMessage(docMsg, 'document');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const form = new FormData();
        form.append('file', buffer, { filename: docMsg.fileName });

        const { data } = await axios.post(`${API_BASE}/obfuscate/v2`, form, {
            headers: form.getHeaders(), timeout: 30000
        });

        const resultUrl = data?.result || data?.url;
        const resultCode = data?.code || data?.obfuscated;

        if (resultUrl) {
            await sock.sendMessage(chatId, { document: { url: resultUrl }, fileName: `protected-${docMsg.fileName}`, mimetype: 'application/javascript' }, { quoted: message });
        } else if (resultCode) {
            await sock.sendMessage(chatId, { document: Buffer.from(resultCode, 'utf8'), fileName: `protected-${docMsg.fileName}`, mimetype: 'application/javascript' }, { quoted: message });
        } else {
            throw new Error(data?.message || 'API ne obfuscated file return nahi ki.');
        }
        await reactStep(sock, message, '✅');
    } catch (err) {
        console.error('[Obfuscate] Error:', err.message);
        await reactStep(sock, message, '❌');
        await sock.sendMessage(chatId, { text: `❌ Obfuscate failed: ${err.message}` }, { quoted: message });
    }
}

module.exports = {
    nanobananaCommand,
    quranCommand,
    tgStickerCommand,
    voiceAiCommand,
    speechmaCommand,
    obfuscateCommand
};
