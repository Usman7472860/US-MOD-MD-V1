/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

const { sleep } = require('../../lib/myfunc');

const channelInfo = {
    contextInfo: {
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363428492698734@newsletter',
            newsletterName: 'US MOD BOT',
            serverMessageId: -1
        }
    }
};

// NOTE: We deliberately do NOT call sock.requestPairingCode() on the bot's
// own already-connected socket here. Calling requestPairingCode() on a
// socket that is already registered/connected causes Baileys to close
// that connection — which logs the bot itself out. Instead we spin up a
// brand-new, isolated session (same logic the web dashboard /pair API
// uses) for the *target* number, so the bot's own connection is untouched.
let pairingSessionApi = null;
function getPairingSessionApi() {
    if (pairingSessionApi) return pairingSessionApi;
    try {
        // index.js exports { startPairingSession, activeSessions }
        pairingSessionApi = require('../../index.js');
    } catch (e) {
        pairingSessionApi = null;
    }
    return pairingSessionApi;
}

async function pairCommand(sock, chatId, message, q) {
    try {
        if (!q) {
            return await sock.sendMessage(chatId, {
                text: `Please provide a valid WhatsApp number\nExample: *.pair 923001234567*`,
                ...channelInfo
            }, { quoted: message });
        }

        const number = q.replace(/[^0-9]/g, '');

        if (!number || number.length < 7 || number.length > 20) {
            return await sock.sendMessage(chatId, {
                text: `❌ Invalid number format!\nExample: *.pair 923001234567*`,
                ...channelInfo
            }, { quoted: message });
        }

        const whatsappID = number + '@s.whatsapp.net';
        const result = await sock.onWhatsApp(whatsappID);

        if (!result || !result[0]?.exists) {
            return await sock.sendMessage(chatId, {
                text: `❌ That number is not registered on WhatsApp.`,
                ...channelInfo
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, {
            text: `⏳ Generating pairing code, please wait...`,
            ...channelInfo
        }, { quoted: message });

        await sleep(2000);

        try {
            const api = getPairingSessionApi();
            if (!api || typeof api.startPairingSession !== 'function') {
                throw new Error('Pairing session module not available (index.js export missing)');
            }

            const code = await api.startPairingSession(number);

            if (code === 'already-connected') {
                return await sock.sendMessage(chatId, {
                    text: `ℹ️ Yeh number already connected hai.`,
                    ...channelInfo
                }, { quoted: message });
            }

            const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

            await sock.sendMessage(chatId, {
                text: `✅ *Your Pairing Code:*\n\n` +
                      `┌──────────────────\n` +
                      `│  *${formatted}*\n` +
                      `└──────────────────\n\n` +
                      `📲 *Steps:*\n` +
                      `1. Open WhatsApp\n` +
                      `2. Go to *Settings → Linked Devices*\n` +
                      `3. Tap *"Link a Device"*\n` +
                      `4. Choose *"Link with phone number instead"*\n` +
                      `5. Enter the code above\n\n` +
                      `⚠️ Code expires in *60 seconds!*`,
                ...channelInfo
            }, { quoted: message });

        } catch (err) {
            console.error('Pairing code error:', err);
            await sock.sendMessage(chatId, {
                text: `❌ Failed to generate pairing code.\nReason: ${err.message || 'Unknown error'}`,
                ...channelInfo
            }, { quoted: message });
        }

    } catch (error) {
        console.error('pairCommand error:', error);
        await sock.sendMessage(chatId, {
            text: `❌ An error occurred. Please try again later.`,
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = pairCommand;
