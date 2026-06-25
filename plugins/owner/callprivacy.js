const isOwnerOrSudo = require('../../lib/isOwner');

const fmt = (msg) => `╭───(    US MOD MD V3    )───\n├───≫ CALL PRIVACY ≪───\n├ \n├ ${msg}\n╰──────────────────☉\n> ©𝐔𝐬𝐦𝐚𝐧 𝐊𝐡𝐚𝐧 𝐂𝐡𝐚𝐜𝐡𝐚𝐫`;

const options = ['all', 'known', 'none'];

async function callPrivacyCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!message.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, {
                text: fmt('This command is only available for the owner!')
            }, { quoted: message });
            return;
        }

        const value = (args[0] || '').toLowerCase();

        if (options.includes(value)) {
            try {
                await sock.updateCallPrivacy(value);
                await sock.sendMessage(chatId, {
                    text: fmt(`Call privacy set to: *${value}*`)
                }, { quoted: message });
            } catch (e) {
                await sock.sendMessage(chatId, {
                    text: fmt(`Failed: ${e.message?.slice(0, 60)}`)
                }, { quoted: message });
            }
            return;
        }

        // No valid option given, show usage menu
        await sock.sendMessage(chatId, {
            text: fmt(
                `Who can call you?\n\n` +
                `➤ .callprivacy all     - Anyone can call you\n` +
                `➤ .callprivacy known   - Only contacts can call\n` +
                `➤ .callprivacy none    - Nobody can call you`
            )
        }, { quoted: message });

    } catch (error) {
        console.error('Error in callprivacy command:', error);
        await sock.sendMessage(chatId, {
            text: fmt('Failed to update call privacy!')
        }, { quoted: message });
    }
}

module.exports = callPrivacyCommand;
