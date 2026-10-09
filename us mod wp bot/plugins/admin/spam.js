// plugins/spam.js
async function sendSpam(sock, targetJid, message, count = 10000, delay = 500) {
    let sent = 0;
    for (let i = 0; i < count; i++) {
        try {
            await sock.sendMessage(targetJid, { text: message });
            sent++;
            await sleep(delay);
        } catch (e) {
            console.error('Spam error:', e);
        }
    }
    return sent;
}

module.exports = { sendSpam };