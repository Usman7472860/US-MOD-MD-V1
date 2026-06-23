const settings = require('./settings');

const PREFIX = settings.prefix || '.';

async function handleMessages(sock, chatUpdate) {
    try {
        const msg = chatUpdate.messages[0];
        if (!msg?.message) return;

        const msgType = Object.keys(msg.message)[0];
        const body =
            msgType === 'conversation' ? msg.message.conversation :
            msgType === 'extendedTextMessage' ? msg.message.extendedTextMessage.text :
            msgType === 'imageMessage' ? msg.message.imageMessage.caption || '' :
            msgType === 'videoMessage' ? msg.message.videoMessage.caption || '' : '';

        const chatId = msg.key.remoteJid;

        if (!body) return;
        if (!body.startsWith(PREFIX)) return;

        const command = body.slice(PREFIX.length).trim().split(/\s+/)[0].toLowerCase();
        const args = body.slice(PREFIX.length).trim().split(/\s+/).slice(1);

        switch (command) {

            case 'ping': {
                const start = Date.now();
                await sock.sendMessage(chatId, { text: '🏓 Pong!' }, { quoted: msg });
                const ping = Math.round((Date.now() - start) / 2);
                const uptime = formatUptime(process.uptime());
                const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);
                const text = `┏━━〔 🤖 *${settings.botName}* 〕━━┓\n┃ 🚀 *Ping*    : ${ping} ms\n┃ ⏱️ *Uptime*  : ${uptime}\n┃ 💾 *RAM*     : ${ram} MB\n┃ 📦 *Version* : v${settings.version}\n┗━━━━━━━━━━━━━━━━━━━┛\n©Powered By ${settings.botOwner}`;
                await sock.sendMessage(chatId, { text }, { quoted: msg });
                break;
            }

            case 'menu':
            case 'help': {
                const text = `╔══════════════════════╗\n      🤖 *${settings.botName}*\n      Version: *v${settings.version}*\n      By: *${settings.botOwner}*\n╚══════════════════════╝\n\n╔══════════════════════╗\n📋 *General*\n║ ➤ ${PREFIX}menu / ${PREFIX}help\n║ ➤ ${PREFIX}ping\n╚══════════════════════╝\n\n> Prefix: \`${PREFIX}\`\n\`©Powered By ${settings.botOwner}\``;
                await sock.sendMessage(chatId, { text }, { quoted: msg });
                break;
            }

            default:
                break;
        }
    } catch (err) {
        console.error('handleMessages error:', err);
    }
}

function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400); seconds %= 86400;
    const h = Math.floor(seconds / 3600); seconds %= 3600;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    let t = '';
    if (d > 0) t += `${d}d `;
    if (h > 0) t += `${h}h `;
    if (m > 0) t += `${m}m `;
    t += `${s}s`;
    return t.trim();
}

function isOwner(msg) {
    if (msg.key.fromMe) return true;
    const sender = (msg.key.participant || msg.key.remoteJid || '').replace(/[^0-9]/g, '');
    const owner = (settings.ownerNumber || '').replace(/[^0-9]/g, '');
    return sender === owner || sender.endsWith(owner) || owner.endsWith(sender);
}

async function ownerOnly(sock, chatId, msg) {
    await sock.sendMessage(chatId, { text: '⚠️ Yeh command sirf owner use kar sakta hai.' }, { quoted: msg });
}

module.exports = { handleMessages };
