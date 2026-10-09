/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

const settings = require('../../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const botName = settings.botName || 'US MOD MD';
    const prefix = settings.prefix || '.';

    const section = (title, items) => {
        const top = `┌───⊰ *${botName}* ⊱───\n├──≫ *${title}* ≪──\n│`;
        const body = items.map(i => `├ ${prefix}${i}`).join('\n');
        const bottom = `└──────────────⊙`;
        return `${top}\n${body}\n${bottom}`;
    };

    const helpMessage = `
┌───⊰ *${botName}* ⊱───
│ Version: *${settings.version || '1.0'}*
│ Owner: ${settings.botOwner || 'M Usman'}
└──────────────⊙

${section('GENERALMENU', [
    'help or .menu', 'ping', 'alive', 'tts <text>', 'owner', 'joke',
    'quote', 'fact', 'weather <city>', 'news', 'attp <text>',
    'lyrics <song_title>', '8ball <question>', 'groupinfo',
    'staff or .admins', 'vv', 'trt <text> <lang>', 'ss <link>',
    'jid', 'url', 'simdata <number>'
])}

${section('ADMINMENU', [
    'ban @user', 'promote @user', 'demote @user', 'mute <minutes>',
    'unmute', 'delete or del', 'kick @user', 'warnings @user',
    'warn @user', 'antilink', 'antibadword', 'clear', 'tag <message>',
    'tagall', 'tagnotadmin', 'hidetag <message>', 'chatbot',
    'resetlink', 'antitag <on/off>', 'welcome <on/off>',
    'goodbye <on/off>', 'setgdesc <description>', 'setgname <new name>',
    'setgpp (reply to image)', 'points or .mypoints', 'toppoints',
    'activityreport <daily/weekly/monthly>'
])}


${section('OWNERMENU', [
    'mode <public/private>', 'clearsession', 'antidelete', 'cleartmp',
    'update', 'settings', 'setpp <reply to image>', 'autoreact <on/off>',
    'autostatus <on/off>', 'autostatus react <on/off>',
    'autotyping <on/off>', 'autoread <on/off>', 'anticall <on/off>',
    'anticall allow <number>', 'anticall allowed',
    'pmblocker <on/off/status>', 'pmblocker setmsg <text>',
    'setmention <reply to msg>', 'mention <on/off>',
    'callprivacy <all/known/none>'
])}

${section('IMAGEMENU', [
    'blur <image>', 'simage <reply to sticker>',
    'sticker <reply to image>', 'removebg', 'remini',
    'crop <reply to image>', 'tgsticker <Link>', 'meme',
    'take <packname>', 'emojimix <emj1>+<emj2>', 'igs <insta link>',
    'igsc <insta link>'
])}

${section('AIMENU', [
    'gpt <question>', 'gemini <question>', 'imagine <prompt>',
    'flux <prompt>', 'sora <prompt>'
])}

${section('DOWNLOADMENU', [
    'play <song_name>', 'song <song_name>', 'spotify <query>',
    'instagram <link>', 'facebook <link>', 'tiktok <link>',
    'video <song name>', 'ytmp4 <Link>'
])}

${section('ISLAMICMENU', [
    'namaz', 'hadith', 'hadith', 'bukhari',
    'muslim', 'tirmizi',
    'abudawud', 'nasai',
    'ibnmajah', 'ahmad',
    'muwatta', 'darimi',
    'riyadh', 'hadithbooks'
])}

${section('MISCMENU', [
    'heart', 'horny', 'circle', 'lgbt', 'lolice', 'its-so-stupid',
    'namecard', 'oogway', 'tweet', 'ytcomment', 'comrade', 'gay',
    'glass', 'jail', 'passed', 'triggered'
])}

${section('GITHUBMENU', [
    'git', 'github', 'sc', 'script', 'repo'
])}

┌───⊰ *${botName}* ⊱───
│  Developed by: USMAN KHAN CHACHAR
│  Join our channel for updates
└──────────────⊙`;

    try {
        const imagePath = path.join(__dirname, '../../assets/bot_image.jpg');
        
        if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: helpMessage,
                contextInfo: {


                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363428492698734@newsletter',
                        newsletterName: 'US MOD BOT',
                        serverMessageId: -1
                    }
                }
            },{ quoted: message });
        } else {
            console.error('Bot image not found at:', imagePath);
            await sock.sendMessage(chatId, { 
                text: helpMessage,
                contextInfo: {


                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363428492698734@newsletter',
                        newsletterName: 'US MOD BOT',
                        serverMessageId: -1
                    } 
                }
            });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage });
    }
}

module.exports = helpCommand;