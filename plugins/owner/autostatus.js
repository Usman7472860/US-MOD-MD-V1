/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../../lib/isOwner');

const channelInfo = {
    contextInfo: {
        
        
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363428492698734@newsletter',
            newsletterName: 'US MOD BOT',
            serverMessageId: -1
        }
    }
};

// Levanter style - random reaction emojis list
const reactionEmojis = [
    '❤️', '🔥', '😍', '🥰', '😘', '💯', '👏', '🎉',
    '😂', '🤩', '💪', '👍', '🙌', '✨', '💫', '🌟',
    '😎', '🥳', '💥', '❤️‍🔥', '🫶', '💖', '💝', '🤍'
];

// Path to store auto status configuration
const configPath = path.join(__dirname, '../../data/autoStatus.json');

// Initialize config file if it doesn't exist
if (!fs.existsSync(configPath)) {
    fs.writeFileSync(configPath, JSON.stringify({ 
        enabled: false, 
        reactOn: false 
    }));
}

async function autoStatusCommand(sock, chatId, msg, args) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!msg.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { 
                text: '❌ This command can only be used by the owner!',
                ...channelInfo
            });
            return;
        }

        // Read current config
        let config = JSON.parse(fs.readFileSync(configPath));

        // If no arguments, show current status
        if (!args || args.length === 0) {
            const status = config.enabled ? '✅ Enabled' : '❌ Disabled';
            const reactStatus = config.reactOn ? '✅ Enabled' : '❌ Disabled';
            await sock.sendMessage(chatId, { 
                text: `╔══════════════════╗\n║  📊 *AUTO STATUS SETTINGS*  ║\n╚══════════════════╝\n\n👁️ *Auto Status View:* ${status}\n💫 *Auto Status React:* ${reactStatus}\n\n📌 *Commands:*\n➤ *.autostatus on* - Enable status view\n➤ *.autostatus off* - Disable status view\n➤ *.autostatus react on* - Enable reactions\n➤ *.autostatus react off* - Disable reactions`,
                ...channelInfo
            });
            return;
        }

        // Handle on/off commands
        const command = args[0].toLowerCase();
        
        if (command === 'on') {
            config.enabled = true;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sock.sendMessage(chatId, { 
                text: '👁️ *Auto Status View Enabled!*\n\nBot will now automatically view all contact statuses.',
                ...channelInfo
            });
        } else if (command === 'off') {
            config.enabled = false;
            fs.writeFileSync(configPath, JSON.stringify(config));
            await sock.sendMessage(chatId, { 
                text: '❌ *Auto Status View Disabled!*\n\nBot will no longer automatically view statuses.',
                ...channelInfo
            });
        } else if (command === 'react') {
            if (!args[1]) {
                await sock.sendMessage(chatId, { 
                    text: '❌ Please specify on/off!\nUse: *.autostatus react on/off*',
                    ...channelInfo
                });
                return;
            }
            
            const reactCommand = args[1].toLowerCase();
            if (reactCommand === 'on') {
                config.reactOn = true;
                fs.writeFileSync(configPath, JSON.stringify(config));
                await sock.sendMessage(chatId, { 
                    text: '💫 *Auto Status React Enabled!*\n\nBot will now react to status updates with random emojis.',
                    ...channelInfo
                });
            } else if (reactCommand === 'off') {
                config.reactOn = false;
                fs.writeFileSync(configPath, JSON.stringify(config));
                await sock.sendMessage(chatId, { 
                    text: '❌ *Auto Status React Disabled!*\n\nBot will no longer react to status updates.',
                    ...channelInfo
                });
            } else {
                await sock.sendMessage(chatId, { 
                    text: '❌ Invalid! Use: *.autostatus react on/off*',
                    ...channelInfo
                });
            }
        } else {
            await sock.sendMessage(chatId, { 
                text: '❌ Invalid command!\n\n*.autostatus on/off* - Enable/disable view\n*.autostatus react on/off* - Enable/disable reactions',
                ...channelInfo
            });
        }

    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Error occurred while managing auto status!\n' + error.message,
            ...channelInfo
        });
    }
}

// Function to check if auto status is enabled
function isAutoStatusEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.enabled;
    } catch (error) {
        console.error('Error checking auto status config:', error);
        return false;
    }
}

// Function to check if status reactions are enabled
function isStatusReactionEnabled() {
    try {
        const config = JSON.parse(fs.readFileSync(configPath));
        return config.reactOn;
    } catch (error) {
        console.error('Error checking status reaction config:', error);
        return false;
    }
}

// Levanter style - get random emoji from list
function getRandomReactionEmoji() {
    return reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];
}

// Function to react to status using proper method (Levanter style)
async function reactToStatus(sock, statusKey) {
    try {
        if (!isStatusReactionEnabled()) {
            return;
        }

        const randomEmoji = getRandomReactionEmoji();

        await sock.relayMessage(
            'status@broadcast',
            {
                reactionMessage: {
                    key: {
                        remoteJid: 'status@broadcast',
                        id: statusKey.id,
                        participant: statusKey.participant || statusKey.remoteJid,
                        fromMe: false
                    },
                    text: randomEmoji
                }
            },
            {
                messageId: statusKey.id,
                statusJidList: [statusKey.remoteJid, statusKey.participant || statusKey.remoteJid]
            }
        );

    } catch (error) {
        console.error('❌ Error reacting to status:', error.message);
    }
}

// Function to handle status updates (Levanter style)
async function handleStatusUpdate(sock, status) {
    try {
        if (!isAutoStatusEnabled()) {
            return;
        }

        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle status from messages.upsert
        if (status.messages && status.messages.length > 0) {
            const msg = status.messages[0];
            if (msg.key && msg.key.remoteJid === 'status@broadcast') {
                try {
                    await sock.readMessages([msg.key]);
                    
                    // React to status if enabled (random emoji - levanter style)
                    await reactToStatus(sock, msg.key);
                    
                } catch (err) {
                    if (err.message?.includes('rate-overlimit')) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await sock.readMessages([msg.key]);
                    } else {
                        throw err;
                    }
                }
                return;
            }
        }

        // Handle direct status updates
        if (status.key && status.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.key]);
                await reactToStatus(sock, status.key);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

        // Handle status in reactions
        if (status.reaction && status.reaction.key.remoteJid === 'status@broadcast') {
            try {
                await sock.readMessages([status.reaction.key]);
                await reactToStatus(sock, status.reaction.key);
            } catch (err) {
                if (err.message?.includes('rate-overlimit')) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    await sock.readMessages([status.reaction.key]);
                } else {
                    throw err;
                }
            }
            return;
        }

    } catch (error) {
        console.error('❌ Error in auto status view:', error.message);
    }
}

module.exports = {
    autoStatusCommand,
    handleStatusUpdate
};
