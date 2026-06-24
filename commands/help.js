const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const botName  = settings.botName  || 'US MOD MD V1';
    const version  = settings.version  || 'V1';
    const botOwner = settings.botOwner || 'M Usman Chachar';
    const menuText = `
┏━━━━━━━━━━━━━━━━━━━━━━┓
┃   🤖 *${botName}*
┃  ⚡ Version: *${version}*
┃  👑 Dev: *${botOwner}*
┗━━━━━━━━━━━━━━━━━━━━━━┛

╭━━━━〔 🌐 *GENERAL* 〕━━━━╮
┃ ➤ .help
┃ ➤ .menu
┃ ➤ .ping
┃ ➤ .alive
┃ ➤ .owner
┃ ➤ .tts <text>
┃ ➤ .attp <text>
┃ ➤ .jid
┃ ➤ .url
┃ ➤ .vv
┃ ➤ .weather <city>
┃ ➤ .news
┃ ➤ .joke
┃ ➤ .quote
┃ ➤ .fact
┃ ➤ .8ball <question>
┃ ➤ .trt <text> <lang>
┃ ➤ .ss <link>
┃ ➤ .lyrics <song>
┃ ➤ .groupinfo
┃ ➤ .staff
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 👮 *ADMIN* 〕━━━━╮
┃ ➤ .ban @user
┃ ➤ .kick @user
┃ ➤ .promote @user
┃ ➤ .demote @user
┃ ➤ .mute <minutes>
┃ ➤ .unmute
┃ ➤ .warn @user
┃ ➤ .warnings @user
┃ ➤ .del
┃ ➤ .antilink
┃ ➤ .antibadword
┃ ➤ .clear
┃ ➤ .tag <message>
┃ ➤ .tagall
┃ ➤ .tagnotadmin
┃ ➤ .hidetag <message>
┃ ➤ .chatbot
┃ ➤ .resetlink
┃ ➤ .antitag <on/off>
┃ ➤ .welcome <on/off>
┃ ➤ .goodbye <on/off>
┃ ➤ .setgdesc <desc>
┃ ➤ .setgname <name>
┃ ➤ .setgpp
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🔒 *OWNER* 〕━━━━╮
┃ ➤ .mode <public/private>
┃ ➤ .clearsession
┃ ➤ .cleartmp
┃ ➤ .antidelete
┃ ➤ .update
┃ ➤ .settings
┃ ➤ .setpp
┃ ➤ .autoreact <on/off>
┃ ➤ .autostatus <on/off>
┃ ➤ .autotyping <on/off>
┃ ➤ .autoread <on/off>
┃ ➤ .anticall <on/off>
┃ ➤ .pmblocker <on/off>
┃ ➤ .pmblocker setmsg <text>
┃ ➤ .mention <on/off>
┃ ➤ .setmention
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🎨 *IMAGE & STICKER* 〕━━━━╮
┃ ➤ .sticker
┃ ➤ .s
┃ ➤ .simage
┃ ➤ .blur
┃ ➤ .removebg
┃ ➤ .remini
┃ ➤ .crop
┃ ➤ .take <packname>
┃ ➤ .emojimix <e1>+<e2>
┃ ➤ .tgsticker <link>
┃ ➤ .meme
┃ ➤ .igs <link>
┃ ➤ .igsc <link>
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🤖 *AI* 〕━━━━╮
┃ ➤ .gpt <question>
┃ ➤ .gemini <question>
┃ ➤ .imagine <prompt>
┃ ➤ .flux <prompt>
┃ ➤ .sora <prompt>
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 📥 *DOWNLOADER* 〕━━━━╮
┃ ➤ .play <song name>
┃ ➤ .song <song name>
┃ ➤ .video <song name>
┃ ➤ .ytmp4 <link>
┃ ➤ .spotify <query>
┃ ➤ .tiktok <link>
┃ ➤ .instagram <link>
┃ ➤ .facebook <link>
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🔤 *TEXT MAKER* 〕━━━━╮
┃ ➤ .metallic <text>
┃ ➤ .ice <text>
┃ ➤ .snow <text>
┃ ➤ .impressive <text>
┃ ➤ .matrix <text>
┃ ➤ .light <text>
┃ ➤ .neon <text>
┃ ➤ .devil <text>
┃ ➤ .purple <text>
┃ ➤ .thunder <text>
┃ ➤ .leaves <text>
┃ ➤ .1917 <text>
┃ ➤ .arena <text>
┃ ➤ .hacker <text>
┃ ➤ .sand <text>
┃ ➤ .blackpink <text>
┃ ➤ .glitch <text>
┃ ➤ .fire <text>
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🎯 *FUN* 〕━━━━╮
┃ ➤ .compliment @user
┃ ➤ .insult @user
┃ ➤ .flirt
┃ ➤ .shayari
┃ ➤ .goodnight
┃ ➤ .roseday
┃ ➤ .character @user
┃ ➤ .wasted @user
┃ ➤ .ship @user
┃ ➤ .simp @user
┃ ➤ .stupid @user
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🎮 *GAMES* 〕━━━━╮
┃ ➤ .tictactoe @user
┃ ➤ .hangman
┃ ➤ .guess <letter>
┃ ➤ .trivia
┃ ➤ .answer <answer>
┃ ➤ .truth
┃ ➤ .dare
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 📖 *ISLAMIC* 〕━━━━╮
┃ ➤ .namaz
┃ ➤ .hadith
┃ ➤ .bukhari <number>
┃ ➤ .muslim <number>
┃ ➤ .tirmizi <number>
┃ ➤ .abudawud <number>
┃ ➤ .nasai <number>
┃ ➤ .ibnmajah <number>
┃ ➤ .ahmad <number>
┃ ➤ .muwatta <number>
┃ ➤ .darimi <number>
┃ ➤ .riyadh <number>
┃ ➤ .hadithbooks
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🖼️ *ANIME* 〕━━━━╮
┃ ➤ .nom
┃ ➤ .poke
┃ ➤ .cry
┃ ➤ .kiss
┃ ➤ .pat
┃ ➤ .hug
┃ ➤ .wink
┃ ➤ .facepalm
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🧩 *MISC* 〕━━━━╮
┃ ➤ .heart
┃ ➤ .horny
┃ ➤ .circle
┃ ➤ .lgbt
┃ ➤ .lolice
┃ ➤ .its-so-stupid
┃ ➤ .namecard
┃ ➤ .oogway
┃ ➤ .tweet
┃ ➤ .ytcomment
┃ ➤ .comrade
┃ ➤ .gay
┃ ➤ .glass
┃ ➤ .jail
┃ ➤ .passed
┃ ➤ .triggered
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 🖼️ *PIES* 〕━━━━╮
┃ ➤ .pies <country>
┃ ➤ .china
┃ ➤ .indonesia
┃ ➤ .japan
┃ ➤ .korea
┃ ➤ .hijab
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━〔 💻 *GITHUB* 〕━━━━╮
┃ ➤ .git
┃ ➤ .github
┃ ➤ .sc
┃ ➤ .script
┃ ➤ .repo
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

┏━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚡ *Powered by ${botName}*
┗━━━━━━━━━━━━━━━━━━━━━━┛`;

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: menuText,
                contextInfo: {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363428492698734@newsletter',
                        newsletterName: 'US MOD MD V1',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: menuText,
                contextInfo: {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363428492698734@newsletter',
                        newsletterName: 'US MOD MD V1',
                        serverMessageId: -1
                    }
                }
            }, { quoted: message });
        }
    } catch (err) {
        console.error('[help] error:', err.message);
        await sock.sendMessage(chatId, { text: menuText });
    }
}

module.exports = helpCommand;
