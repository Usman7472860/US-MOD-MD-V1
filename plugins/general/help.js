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
│  🤖 Version: *${settings.version || '3.0.0'}*
│  👤 Owner: ${settings.botOwner || 'Mr Unique Hacker'}
│  📺 YT: ${global.ytch}
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
    'unmute', 'delete or .del', 'kick @user', 'warnings @user',
    'warn @user', 'antilink', 'antibadword', 'clear', 'tag <message>',
    'tagall', 'tagnotadmin', 'hidetag <message>', 'chatbot',
    'resetlink', 'antitag <on/off>', 'welcome <on/off>',
    'goodbye <on/off>', 'setgdesc <description>', 'setgname <new name>',
    'setgpp (reply to image)'
])}

${section('OWNERMENU', [
    'mode <public/private>', 'clearsession', 'antidelete', 'cleartmp',
    'update', 'settings', 'setpp <reply to image>', 'autoreact <on/off>',
    'autostatus <on/off>', 'autostatus react <on/off>',
    'autotyping <on/off>', 'autoread <on/off>', 'anticall <on/off>',
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

${section('PIESMENU', [
    'pies <country>', 'china', 'indonesia', 'japan', 'korea', 'hijab'
])}

${section('GAMEMENU', [
    'tictactoe @user', 'hangman', 'guess <letter>', 'trivia',
    'answer <answer>', 'truth', 'dare'
])}

${section('AIMENU', [
    'gpt <question>', 'gemini <question>', 'imagine <prompt>',
    'flux <prompt>', 'sora <prompt>'
])}

${section('FUNMENU', [
    'compliment @user', 'insult @user', 'flirt', 'shayari',
    'goodnight', 'roseday', 'character @user', 'wasted @user',
    'ship @user', 'simp @user', 'stupid @user [text]'
])}

${section('TEXTMAKERMENU', [
    'metallic <text>', 'ice <text>', 'snow <text>', 'impressive <text>',
    'matrix <text>', 'light <text>', 'neon <text>', 'devil <text>',
    'purple <text>', 'thunder <text>', 'leaves <text>', '1917 <text>',
    'arena <text>', 'hacker <text>', 'sand <text>', 'blackpink <text>',
    'glitch <text>', 'fire <text>'
])}

${section('DOWNLOADMENU', [
    'play <song_name>', 'song <song_name>', 'spotify <query>',
    'instagram <link>', 'facebook <link>', 'tiktok <link>',
    'video <song name>', 'ytmp4 <Link>'
])}

${section('ISLAMICMENU', [
    'namaz', 'hadith', 'hadith bukhari 2812', 'bukhari / .bukhari 2812',
    'muslim / .muslim 100', 'tirmizi / .tirmizi 50',
    'abudawud / .abudawud 200', 'nasai / .nasai 300',
    'ibnmajah / .ibnmajah 100', 'ahmad / .ahmad 500',
    'muwatta / .muwatta 10', 'darimi / .darimi 20',
    'riyadh / .riyadh 50', 'hadithbooks'
])}

${section('MISCMENU', [
    'heart', 'horny', 'circle', 'lgbt', 'lolice', 'its-so-stupid',
    'namecard', 'oogway', 'tweet', 'ytcomment', 'comrade', 'gay',
    'glass', 'jail', 'passed', 'triggered'
])}

${section('ANIMEMENU', [
    'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'facepalm'
])}

${section('GITHUBMENU', [
    'git', 'github', 'sc', 'script', 'repo'
])}

┌───⊰ *${botName}* ⊱───
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
                        newsletterJid: '120363161513685998@newsletter',
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
                        newsletterJid: '120363161513685998@newsletter',
                        newsletterName: 'US MOD BOT by Mr Unique Hacker',
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