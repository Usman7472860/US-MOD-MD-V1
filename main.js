/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

// Ensure plugins/data exists — several plugins (autotyping, autoread,
// antitag, mention, etc.) store their JSON config here and will crash
// with ENOENT if this folder is missing (e.g. after a fresh git clone,
// since empty folders aren't tracked by git/zip).
const pluginsDataDir = path.join(__dirname, 'plugins', 'data');
if (!fs.existsSync(pluginsDataDir)) fs.mkdirSync(pluginsDataDir, { recursive: true });

// Auto-cleaner every 30 minutes (aggressive)
function cleanDir(dir, maxAgeMs) {
    if (!fs.existsSync(dir)) return;
    fs.readdir(dir, (err, files) => {
        if (err) return;
        let count = 0;
        for (const file of files) {
            const filePath = path.join(dir, file);
            fs.stat(filePath, (err, stats) => {
                if (!err && stats.isFile() && Date.now() - stats.mtimeMs > maxAgeMs) {
                    fs.unlink(filePath, () => { });
                    count++;
                }
            });
        }
        if (count > 0) console.log(`🧹 Cleaned ${count} file(s) from ${dir}`);
    });
}

setInterval(() => {
    // Temp files older than 30 min
    cleanDir(customTemp, 30 * 60 * 1000);
    // Also clean common media/cache dirs
    cleanDir(path.join(process.cwd(), 'downloads'), 30 * 60 * 1000);
    cleanDir(path.join(process.cwd(), 'cache'), 60 * 60 * 1000);
    cleanDir(path.join(process.cwd(), 'logs'), 2 * 60 * 60 * 1000);
    console.log('🧹 Auto-clean cycle done');
}, 30 * 60 * 1000);

const settings = require('./settings');
require('./config.js');
const { isBanned } = require('./lib/isBanned');
const yts = require('yt-search');
const { fetchBuffer } = require('./lib/myfunc');
const fetch = require('node-fetch');

const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const { isSudo } = require('./lib/index');
const isOwnerOrSudo = require('./lib/isOwner');
const { autotypingCommand, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand } = require('./plugins/owner/autotyping');
const { autoreadCommand, isAutoreadEnabled, handleAutoread } = require('./plugins/owner/autoread');

// Command imports
const tagAllCommand = require('./plugins/admin/tagall');
const helpCommand = require('./plugins/general/help');
const banCommand = require('./plugins/admin/ban');
const { promoteCommand } = require('./plugins/admin/promote');
const { demoteCommand } = require('./plugins/admin/demote');
const muteCommand = require('./plugins/admin/mute');
const unmuteCommand = require('./plugins/admin/unmute');
const stickerCommand = require('./plugins/image/sticker');
const isAdmin = require('./lib/isAdmin');
const warnCommand = require('./plugins/admin/warn');
const warningsCommand = require('./plugins/admin/warnings');
const ttsCommand = require('./plugins/general/tts');
const ownerCommand = require('./plugins/general/owner');
const deleteCommand = require('./plugins/admin/delete');
const { handleAntilinkCommand, handleLinkDetection } = require('./plugins/admin/antilink');
const { Antilink } = require('./lib/antilink');
const { handleMentionDetection, mentionToggleCommand, setMentionCommand, handleStatusMention } = require('./plugins/owner/mention');
const memeCommand = require('./plugins/image/meme');
const tagCommand = require('./plugins/admin/tag');
const tagNotAdminCommand = require('./plugins/admin/tagnotadmin');
const hideTagCommand = require('./plugins/admin/hidetag');
const jokeCommand = require('./plugins/general/joke');
const quoteCommand = require('./plugins/general/quote');
const factCommand = require('./plugins/general/fact');
const weatherCommand = require('./plugins/general/weather');
const newsCommand = require('./plugins/general/news');
const kickCommand = require('./plugins/admin/kick');
const simageCommand = require('./plugins/image/simage');
const attpCommand = require('./plugins/general/attp');
const { eightBallCommand } = require('./plugins/general/eightball');
const { lyricsCommand } = require('./plugins/general/lyrics');
const { clearCommand } = require('./plugins/admin/clear');
const pingCommand = require('./plugins/general/ping');
const aliveCommand = require('./plugins/general/alive');
const blurCommand = require('./plugins/image/img-blur');
const { welcomeCommand, handleJoinEvent } = require('./plugins/admin/welcome');
const { goodbyeCommand, handleLeaveEvent } = require('./plugins/admin/goodbye');
const githubCommand = require('./plugins/github/github');
const { handleAntiBadwordCommand, handleBadwordDetection } = require('./lib/antibadword');
const antibadwordCommand = require('./plugins/admin/antibadword');
const { handleChatbotCommand, handleChatbotResponse } = require('./plugins/admin/chatbot');
const takeCommand = require('./plugins/image/take');
const groupInfoCommand = require('./plugins/general/groupinfo');
const resetlinkCommand = require('./plugins/admin/resetlink');
const staffCommand = require('./plugins/general/staff');
const unbanCommand = require('./plugins/admin/unban');
const { tempbanCommand, untempbanCommand, restorePendingTempBans } = require('./plugins/admin/tempban');
const { sendSpam } = require('./plugins/admin/spam');
const emojimixCommand = require('./plugins/image/emojimix');
const { handlePromotionEvent } = require('./plugins/admin/promote');
const { handleDemotionEvent } = require('./plugins/admin/demote');
const viewOnceCommand = require('./plugins/general/viewonce');
const clearSessionCommand = require('./plugins/owner/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./plugins/owner/autostatus');
const stickerTelegramCommand = require('./plugins/image/stickertelegram');
const clearTmpCommand = require('./plugins/owner/cleartmp');
const callPrivacyCommand = require('./plugins/owner/callprivacy');
const setProfilePicture = require('./plugins/owner/setpp');
const { setGroupDescription, setGroupName, setGroupPhoto } = require('./plugins/admin/groupmanage');
const instagramCommand = require('./plugins/image/instagram');
const aiCommand = require('./plugins/ai/ai');
const urlCommand = require('./plugins/general/url');
const { handleTranslateCommand } = require('./plugins/general/translate');
const { handleSsCommand } = require('./plugins/general/ss');
const { addCommandReaction, handleAreactCommand } = require('./lib/reactions');
const imagineCommand = require('./plugins/ai/imagine');
const sudoCommand = require('./plugins/owner/sudo');
const { approvePayment, rejectPayment, checkPaid, pendingPayments, isPaidUser } = require('./plugins/owner/payment');
const { miscCommand, handleHeart } = require('./plugins/misc/misc');
const stickercropCommand = require('./plugins/image/stickercrop');
const updateCommand = require('./plugins/owner/update');
const removebgCommand = require('./plugins/image/removebg');
const { reminiCommand } = require('./plugins/image/remini');
const { igsCommand } = require('./plugins/image/igs');
const {
    nanobananaCommand, quranCommand, tgStickerCommand,
    voiceAiCommand, speechmaCommand, obfuscateCommand
} = require('./plugins/extra/apicommands');
const { anticallCommand, readState: readAnticallState, handleIncomingCall } = require('./plugins/owner/anticall');
const { handleAntideleteCommand, handleMessageRevocation, storeMessage } = require('./plugins/owner/antidelete');
const tiktokCommand = require('./plugins/download/tiktok');
const { ytmp3Command, ytmp4Command } = require('./plugins/download/youtube');
const { pmblockerCommand, readState: readPmBlockerState } = require('./plugins/owner/pmblocker');
const settingsCommand = require('./plugins/owner/settings');
const soraCommand = require('./plugins/ai/sora');
const { namazCommand } = require('./plugins/islamic/namaz');
const { hadithCommand, bookCommand, getBooksListMessage, HADITH_BOOKS, findBookKey } = require('./plugins/islamic/hadith');
const pairCommand = require('./plugins/owner/pair');
const truecallerCommand = require('./plugins/owner/truecaller');
const facebookCommand = require('./plugins/download/facebook');

// Global settings
global.packname = settings.packname;
global.author = settings.author;
global.channelLink = "https://whatsapp.com/channel/";
global.ytch = "M USMAN CHACHAR";
global.usmanSessions = {};

// Add this near the top of main.js with other global configurations
const channelInfo = {
    contextInfo: {


        forwardedNewsletterMessageInfo: {
            newsletterJid: '@newsletter',
            newsletterName: 'M USMAN CHACHAR MD',
            serverMessageId: -1
        }
    }
};

// ─── OWNER PERSONAL MSG NOTIFIER ────────────────────────────────────────────
// Sends a private DM to owner whenever someone uses a command or sends a msg
async function notifyOwner(sock, senderJid, chatId, text, isGroup) {
    try {
        const ownerNumber = settings.owner; // e.g. "923001234567" from settings.js
        if (!ownerNumber) return;

        const ownerJid = ownerNumber.includes('@s.whatsapp.net')
            ? ownerNumber
            : `${ownerNumber.replace(/[^0-9]/g, '')}@s.whatsapp.net`;

        // Don't notify owner about their own messages
        if (senderJid === ownerJid || senderJid === `${ownerNumber.replace(/[^0-9]/g, '')}@s.whatsapp.net`) return;

        const senderNum = senderJid.replace('@s.whatsapp.net', '').replace('@lid', '');
        const location = isGroup ? `📢 *Group:* ${chatId.replace('@g.us', '')}` : `💬 *Private Chat*`;

        const notifMsg =
            `🔔 *New Message Alert!*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `👤 *From:* @${senderNum}\n` +
            `${location}\n` +
            `💬 *Message:* ${text || '(media/no text)'}\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Usman Bot Notification_`;

        await sock.sendMessage(ownerJid, {
            text: notifMsg,
            mentions: [senderJid]
        });
    } catch (e) {
        // Silently fail — never crash main flow
    }
}
// ============ SLEEP HELPER ============
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// ─────────────────────────────────────────────────// --------------------- Attack Functions ---------------------
//────────────────────────────


// ══════════════════════════════════════════════════════════════
// 🔍 UNKNOWN COMMAND HANDLER - Suggest similar commands
// ══════════════════════════════════════════════════════════════
const ALL_BOT_COMMANDS = [
".bug", ".bug1", ".bugrtl", ".bug2", ".bugzw",
".bug3", ".bugmix", ".bug4",
 // Tier 2
".bugvariant", ".bug5", ".bugjoiner", ".bug6",
".bugarabic", ".bug7", ".buglong", ".bug8",
 // Tier 3
".bugnested", ".bug9", ".bugchain", ".bug10", ".bugmulti", ".bug11", ".bugemoji",".bug12",
 // Attack modes
".attacknormal", ".attackintense","attackextreme", ".nuke",
// Custom
".bugultimate", ".heavybug",
// Help
".bughelp", ".bugs",
// most dangerous 
".kill", ".death", ".destroy", ".annihilate", "nuke", ".nuclear", ".crash", ".freeze", ".flood", ".spam",".1917",".8ball",".abudawud",".admins",".ahmad",".alive",".animu",".animuquote",
    ".answer",".antibadword",".anticall",".antidelete",".antilink",".anularlink",
    ".approve",".areact",".arena",".attp",".autoreact",".autoreaction",".autoread",
    ".autostatus",".autotyping",".ban",".blackpink",".blur",".bot",".bukhari",
    ".character",".chatbot",".checkpaid",".chiku",".china",".circle",".clear",
    ".clearsession",".clearsesi",".cleartmp",".claude",".compliment",".comrade",
    ".crop",".cry",".dalle",".dare",".darimi",".dawud",".del",".delete",".demote",
    ".devil",".emix",".emojimix",".enhance",".face-palm",".facepalm",".facebook",
    ".fact",".fb",".fbdl",".fire",".flirt",".flux",".gay",".gemini",".git",
    ".github",".glass",".glitch",".gpt",".groupinfo",".guess",".hadith",
    ".hadithbooks",".hadithlist",".haiku",".hangman",".hacker",".hbooks",".heart",
    ".help",".hidetag",".horny",".hug",".ig",".igsc",".igs",".imagine",".india",
    ".indonesia",".infogp",".infogrupo",".insta",".instagram",".insult",".iss",
    ".its-so-stupid",".itssostupid",".ibnmajah",".jail",".japan",".jid",".joke",
    ".kick",".kiss",".korea",".leaves",".lgbt",".light",".list",".listadmin",
    ".loli",".lolice",".lyrics",".majah",".malaysia",".matrix",".meme",".mention",
    ".menu",".metallic",".move",".mp3",".music",".muslim",".musnad",".mute",
    ".muwatta",".namaz",".namecard",".nasai",".neon",".news",".nobg",".nom",
    ".oogway",".oogway2",".owner",".pair",".passed",".pat",".pendingpay",".pies",
    ".ping",".play",".pmblocker",".poke",".prayer",".promote",".purple",".quote",
    ".reject",".remini",".removebg",".repo",".resetlink",".revoke",".riyadh",
    ".rmbg",".roseday",".s",".sand",".sc",".screenshot",".setgdesc",".setgname",
    ".setgpp",".setmention",".setpp",".shayari",".shayri",".ship",".sim",
    ".simdata",".simage",".simp",".simpcard",".snow",".song",".sora",".ss",
    ".ssweb",".staff",".steal",".sticker",".stickertelegram",".stupid",
    ".sudo",".surrender",".tag",".tagall",".tagnotadmin",".take",".tc",
    ".telesticker",".tg",".tgsticker",".thailand",".thunder",".tictactoe",
    ".tirmidhi",".tirmizi",".tiktok",".tonikawa",".tourl",
    ".translate",".triggered",".trivia",".trt",".truth",".tt",".tts",".tweet",
    ".untempban",".unban",".unmute",".update",".upscale",".url",".vv",".video",
    ".warn",".warnings",".waste",".weather",".welcome",".wink",".yt",".ytcomment",
    ".ytmp3",".ytmp4",".1917",".8ball",".usman"
];

// Simple similarity: count matching characters at start + common letters
function getCommandSuggestions(input) {
    const typed = input.toLowerCase().trim();
    if (!typed.startsWith('.')) return [];

    const typedCmd = typed.split(/\s+/)[0]; // just the command word

    const scored = ALL_BOT_COMMANDS.map(cmd => {
        let score = 0;
        const minLen = Math.min(typedCmd.length, cmd.length);

        // Bonus for matching prefix characters
        for (let i = 0; i < minLen; i++) {
            if (typedCmd[i] === cmd[i]) score += 2;
            else break;
        }

        // Bonus for common letters (regardless of position)
        const typedChars = new Set(typedCmd.slice(1)); // skip dot
        const cmdChars = new Set(cmd.slice(1));
        for (const c of typedChars) {
            if (cmdChars.has(c)) score += 1;
        }

        // Penalty for big length difference
        score -= Math.abs(typedCmd.length - cmd.length) * 0.5;

        return { cmd, score };
    });

    // Return top 5 with score > 1
    return scored
        .filter(x => x.score > 1)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(x => x.cmd);
}

//  MESSAGE HANDLER

async function handleMessages(sock, messageUpdate, printLog) {
    let chatId = null;
    let message = null;
    try {
        const { messages, type } = messageUpdate;
        if (type !== 'notify') return;

        message = messages[0];


        if (!message?.message) return;

        // Handle autoread functionality
        await handleAutoread(sock, message);

        // Store message for antidelete feature
        if (message.message) {
            storeMessage(sock, message);
        }

        // Handle message revocation (antidelete)
        if (message.message?.protocolMessage?.type === 0) {
            await handleMessageRevocation(sock, message);
            return;
        }

        // (auto-reveal removed)

        chatId = message.key.remoteJid;
        const senderId = message.key.participant || message.key.remoteJid;
        const isGroup = chatId.endsWith('@g.us');
        const senderIsSudo = await isSudo(senderId);
        const senderIsOwnerOrSudo = await isOwnerOrSudo(senderId, sock, chatId);

        // Handle button responses
        if (message.message?.buttonsResponseMessage) {
            const buttonId = message.message.buttonsResponseMessage.selectedButtonId;
            const chatId = message.key.remoteJid;

            if (buttonId === 'channel') {
                await sock.sendMessage(chatId, {
                    text: '📢 *Join our Channel:*\nhttps://whatsapp.com/channel/'
                }, { quoted: message });
                return;
            } else if (buttonId === 'owner') {
                const ownerCommand = require('./plugins/general/owner');
                await ownerCommand(sock, chatId);
                return;
            } else if (buttonId === 'support') {
                await sock.sendMessage(chatId, {
                    text: `🔗 *Support*\n\nhttps://chat.whatsapp.com/?mode=wwt`
                }, { quoted: message });
                return;
            }
        }

        const userMessage = (
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            message.message?.buttonsResponseMessage?.selectedButtonId?.trim() ||
            ''
        ).toLowerCase().replace(/\.\s+/g, '.').trim();

        // Preserve raw message for commands like .tag that need original casing
        const rawText = (message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '').replace(/^\.\s+/, '.'); // fixes ". simdata 0300..." (space after the dot, e.g. from keyboard autocorrect) shifting every argument by one word

        // Beautiful message log
        {
            const senderName = message.pushName || senderId.split('@')[0];
            const lid = senderId.split('@')[0];
            const time = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true });
            const msgText = rawText || '[media/sticker]';
            const chat = isGroup ? 'Group' : 'Private';
            console.log(`\n┌─────────────────────────────`);
            console.log(`│ 👤 Name  : ${senderName}`);
            console.log(`│ 🆔 LID   : ${lid}`);
            console.log(`│ 🕐 Time  : ${time}`);
            console.log(`│ 💬 Msg   : ${msgText.substring(0, 60)}`);
            console.log(`│ 📍 Chat  : ${chat}`);
            console.log(`└─────────────────────────────`);
        }
        // Read bot mode once; don't early-return so moderation can still run in private mode
        let isPublic = true;
        try {
            const raw = fs.readFileSync('./data/messageCount.json', 'utf8').trim();
            if (raw) {
                const data = JSON.parse(raw);
                if (typeof data.isPublic === 'boolean') isPublic = data.isPublic;
            }
        } catch (error) {
            console.error('Error checking access mode:', error);
            // default isPublic=true on error
        }
        const isOwnerOrSudoCheck = message.key.fromMe || senderIsOwnerOrSudo;
        // Check if user is banned (skip ban check for unban command)
        if (isBanned(senderId) && !userMessage.startsWith('.unban')) {
            // Only respond occasionally to avoid spam
            if (Math.random() < 0.1) {
                await sock.sendMessage(chatId, {
                    text: '❌ You are banned from using the bot. Contact an admin to get unbanned.',
                    ...channelInfo
                });
            }
            return;
        }

          // Basic message response in private chat
          if (!isGroup && (userMessage === 'hi' || userMessage === 'hello' || userMessage === 'bot' || userMessage === 'hlo' || userMessage === 'hey' || userMessage === 'bro')) {
              await sock.sendMessage(chatId, {
                  text: 'Hi, How can I help you?\nYou can use .menu for more info and commands.',
                  ...channelInfo
              });
              return;
          } 

        // Check for bad words and antilink FIRST, before ANY other processing
        // Always run moderation in groups, regardless of mode
        if (isGroup) {
            if (userMessage) {
                await handleBadwordDetection(sock, chatId, message, userMessage, senderId);
            }
            // Antilink checks message text internally, so run it even if userMessage is empty
            await Antilink(message, sock);
        }

        // PM blocker: block non-owner DMs when enabled (do not ban)
        if (!isGroup && !message.key.fromMe && !senderIsSudo) {
            try {
                const pmState = readPmBlockerState();
                if (pmState.enabled) {
                    // Inform user, delay, then block without banning globally
                    await sock.sendMessage(chatId, { text: pmState.message || 'Private messages are blocked. Please contact the owner in groups only.' });
                    await new Promise(r => setTimeout(r, 1500));
                    try { await sock.updateBlockStatus(chatId, 'block'); } catch (e) { }
                    return;
                }
            } catch (e) { }
        }

        // Then check for command prefix
        if (!userMessage.startsWith('.')) {
            // Show typing indicator if autotyping is enabled
            await handleAutotypingForMessage(sock, chatId, userMessage);

            // ─── OK / DONE / COMING AUTO REPLY ─────────────────────────────
            const okPhrases = [
                // OK / Okay variants
               // 'oksknsnk;
            ];
            const okReplies = [
                'ok',
            ];
            const msgLowerOk = userMessage.toLowerCase().trim();
            const isOkDoneComing = okPhrases.some(phrase =>
                msgLowerOk === phrase ||
                msgLowerOk === phrase + '.' ||
                msgLowerOk === phrase + '!' ||
                msgLowerOk === phrase + '?' ||
                msgLowerOk.startsWith(phrase + ' ') ||
                msgLowerOk.startsWith(phrase + ',')
            );
            if (isOkDoneComing) {
                const reply = okReplies[Math.floor(Math.random() * okReplies.length)];
                await sock.sendMessage(chatId, { text: reply }, { quoted: message });
                return;
            }
            // ────────────────────────────────────────────────────────────────

            // ────────────────────────────────────────────────────────────────

            if (isGroup) {
                // Always run moderation features regardless of mode
                await handleMentionDetection(sock, chatId, message);

                // Only run chatbot in public mode or for owner/sudo
                if (isPublic || isOwnerOrSudoCheck) {
                    await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                }
            }
            return;
        }
        // In private mode, only owner/sudo can run commands
        if (!isPublic && !isOwnerOrSudoCheck) {
            return;
        }

        // List of admin commands
        const adminCommands = ['.mute', '.unmute', '.ban', '.unban', '.tempban', '.untempban', '.promote', '.demote', '.kick', '.tagall', '.tagnotadmin', '.hidetag', '.antilink', '.setgdesc', '.setgname', '.setgpp'];
        const isAdminCommand = adminCommands.some(cmd => userMessage.startsWith(cmd));

        // List of owner commands
        const ownerCommands = ['.mode', '.autostatus', '.antidelete', '.cleartmp', '.setpp', '.clearsession', '.areact', '.autoreact', '.autotyping', '.autoread', '.pmblocker', '.callprivacy'];
        const isOwnerCommand = ownerCommands.some(cmd => userMessage.startsWith(cmd));

        let isSenderAdmin = false;
        let isBotAdmin = false;

        // Check admin status only for admin commands in groups
        if (isGroup && isAdminCommand) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { text: 'Please make the bot an admin to use admin commands.', ...channelInfo }, { quoted: message });
                return;
            }

            if (
                userMessage.startsWith('.mute') ||
                userMessage === '.unmute' ||
                userMessage.startsWith('.ban') ||
                userMessage.startsWith('.unban') ||
                userMessage.startsWith('.promote') ||
                userMessage.startsWith('.demote')
            ) {
                if (!isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, {
                        text: 'Sorry, only group admins can use this command.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
            }
        }

        // Check owner status for owner commands
        if (isOwnerCommand) {
            if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                await sock.sendMessage(chatId, { text: '❌ This command is only available for the owner or sudo!' }, { quoted: message });
                return;
            }
        }
// ─── USMAN SESSION CHECK (User ne number type kiya hai) ───
if (global.usmanSessions[senderId]) {
    const sessionData = global.usmanSessions[senderId];
    if (!isNaN(userMessage) && userMessage > 0 && userMessage <= sessionData.length) {
        const index = parseInt(userMessage) - 1;
        const selectedVideo = sessionData[index];

        await sock.sendMessage(chatId, {
            text: `⏳ Downloading *${selectedVideo.title}*... Please wait.`,
            ...channelInfo
        }, { quoted: message });

        try {
            const downloadResult = await usmandownload(selectedVideo.link);
            if (downloadResult.status) {
                await sock.sendMessage(chatId, {
                    video: { url: downloadResult.files.high },
                    caption: `✅ *${downloadResult.title}*\n⏱️ Duration: ${downloadResult.duration || 'N/A'}\n\n🔗 *Powered by Usman MD*`,
                    ...channelInfo
                }, { quoted: message });
            } else {
                await sock.sendMessage(chatId, {
                    text: '❌ Failed to download video. The link might be broken.',
                    ...channelInfo
                }, { quoted: message });
            }
        } catch (error) {
            console.error('Usman Download Error:', error);
            await sock.sendMessage(chatId, {
                text: '⚠️ An error occurred while downloading.',
                ...channelInfo
            }, { quoted: message });
        }

        delete global.usmanSessions[senderId];
        return; // Yeh command wali processing ko rok dega
    } else {
        delete global.usmanSessions[senderId];
    }
}
        // Command handlers - Execute commands immediately without waiting for typing indicator
        // We'll show typing indicator after command execution if needed
        let commandExecuted = false;

        // ─── MOBILE APP: per-command on/off gate ───
        // Lets the Commands screen in the Android app toggle individual
        // commands off without touching any of the switch cases below.
        // No-ops (and does nothing) when mobile-bridge.js isn't present,
        // e.g. when this same codebase runs on Railway/other hosting.
        try {
            const mobileBridge = require('./mobile-bridge');
            const baseCommand = userMessage.split(/\s+/)[0];
            if (mobileBridge.isCommandDisabled(baseCommand)) return;
        } catch (e) { /* mobile-bridge not present — command runs normally */ }

        switch (true) {
            case userMessage === '.simage': {
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                if (quotedMessage?.stickerMessage) {
                    await simageCommand(sock, quotedMessage, chatId);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please reply to a sticker with the .simage command to convert it.', ...channelInfo }, { quoted: message });
                }
                commandExecuted = true;
                break;
            }
            case userMessage.startsWith('.kick'):
                const mentionedJidListKick = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await kickCommand(sock, chatId, senderId, mentionedJidListKick, message);
                break;
                case userMessage.startsWith('.usman'): {
    const query = rawText.slice('.usman'.length).trim();

    if (!query) {
        await sock.sendMessage(chatId, {
            text: `📌 *Usman Video Search*
━━━━━━━━━━━━━━━━━━
🔍 *Usage:* .usman <query>
📌 *Example:* .usman genshin impact
📌 *Example:* .usman funny cats

🔄 *After search, type the number (1-10) to download.*`,
            ...channelInfo
        }, { quoted: message });
        break;
    }

    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

    const searchResult = await usmansearch(query);

    if (!searchResult.status || !searchResult.result || searchResult.result.length === 0) {
        await sock.sendMessage(chatId, {
            text: `❌ *No Results Found*
━━━━━━━━━━━━━━━━━━
😕 Could not find anything for: *${query}*

💡 Try a different keyword.`,
            ...channelInfo
        }, { quoted: message });
        break;
    }

    const results = searchResult.result.slice(0, 10);

    let responseText = `🔍 *Search Results for:* "${query}"
━━━━━━━━━━━━━━━━━━\n`;
    results.forEach((video, index) => {
        responseText += `*${index + 1}.* ${video.title || 'Untitled'}\n`;
        responseText += `   📁 ${video.info || 'No description'}\n\n`;
    });
    responseText += `━━━━━━━━━━━━━━━━━━
📌 *Reply with a number (1-${results.length}) to download the video.*`;

    await sock.sendMessage(chatId, {
        text: responseText,
        ...channelInfo
    }, { quoted: message });

    global.usmanSessions[senderId] = results;
    commandExecuted = true;
    break;
}
            case userMessage.startsWith('.mute'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const muteArg = parts[1];
                    const muteDuration = muteArg !== undefined ? parseInt(muteArg, 10) : undefined;
                    if (muteArg !== undefined && (isNaN(muteDuration) || muteDuration <= 0)) {
                        await sock.sendMessage(chatId, { text: 'Please provide a valid number of minutes or use .mute with no number to mute immediately.', ...channelInfo }, { quoted: message });
                    } else {
                        await muteCommand(sock, chatId, senderId, message, muteDuration);
                    }
                }
                break;
            case userMessage === '.unmute':
                await unmuteCommand(sock, chatId, senderId);
                break;
            case userMessage.startsWith('.ban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .ban in private chat.' }, { quoted: message });
                        break;
                    }
                }
                await banCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.unban'):
                if (!isGroup) {
                    if (!message.key.fromMe && !senderIsSudo) {
                        await sock.sendMessage(chatId, { text: 'Only owner/sudo can use .unban in private chat.' }, { quoted: message });
                        break;
                    }
                }
                await unbanCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tempban'):
                await tempbanCommand(sock, chatId, message, senderId, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.untempban'):
                await untempbanCommand(sock, chatId, message, senderId, isSenderAdmin, isBotAdmin);
                commandExecuted = true;
                break;
               
            case userMessage === '.help' || userMessage === '.menu' || userMessage === '.bot' || userMessage === '.list':
                await helpCommand(sock, chatId, message, global.channelLink);
                commandExecuted = true;
                break;
            case userMessage === '.sticker' || userMessage === '.s':
                await stickerCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.warnings'):
                const mentionedJidListWarnings = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warningsCommand(sock, chatId, mentionedJidListWarnings);
                break;
            case userMessage.startsWith('.warn'):
                const mentionedJidListWarn = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await warnCommand(sock, chatId, senderId, mentionedJidListWarn, message);
                break;
            case userMessage.startsWith('.tts'):
                const text = userMessage.slice(4).trim();
                await ttsCommand(sock, chatId, text, message);
                break;
            case userMessage.startsWith('.delete') || userMessage.startsWith('.del'):
                await deleteCommand(sock, chatId, message, senderId);
                break;
            case userMessage.startsWith('.attp'):
                await attpCommand(sock, chatId, message);
                break;

            case userMessage === '.settings':
                await settingsCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mode'):
                // Check if sender is the owner
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only bot owner can use this command!', ...channelInfo }, { quoted: message });
                    return;
                }
                // Read current data first (file may be empty/missing on fresh installs)
                let data;
                try {
                    const rawModeFile = fs.readFileSync('./data/messageCount.json', 'utf8').trim();
                    data = rawModeFile ? JSON.parse(rawModeFile) : {};
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    data = {};
                }
                if (typeof data.isPublic !== 'boolean') data.isPublic = true;

                const action = userMessage.split(' ')[1]?.toLowerCase();
                // If no argument provided, show current status
                if (!action) {
                    const currentMode = data.isPublic ? 'public' : 'private';
                    await sock.sendMessage(chatId, {
                        text: `Current bot mode: *${currentMode}*\n\nUsage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only`,
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                if (action !== 'public' && action !== 'private') {
                    await sock.sendMessage(chatId, {
                        text: 'Usage: .mode public/private\n\nExample:\n.mode public - Allow everyone to use bot\n.mode private - Restrict to owner only',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                try {
                    // Update access mode
                    data.isPublic = action === 'public';

                    // Save updated data
                    fs.writeFileSync('./data/messageCount.json', JSON.stringify(data, null, 2));

                    await sock.sendMessage(chatId, { text: `Bot is now in *${action}* mode`, ...channelInfo });
                } catch (error) {
                    console.error('Error updating access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to update bot access mode', ...channelInfo });
                }
                break;
            case userMessage.startsWith('.anticall'):
                if (!message.key.fromMe && !senderIsOwnerOrSudo) {
                    await sock.sendMessage(chatId, { text: 'Only owner/sudo can use anticall.' }, { quoted: message });
                    break;
                }
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await anticallCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.pmblocker'):    
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    await pmblockerCommand(sock, chatId, message, args);
                }
                commandExecuted = true;
                break;
            case userMessage === '.owner':
                await ownerCommand(sock, chatId);
                break;
            case userMessage === '.tagall':
                await tagAllCommand(sock, chatId, senderId, message);
                break;
            case userMessage === '.tagnotadmin':
                await tagNotAdminCommand(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.hidetag'):
                {
                    const messageText = rawText.slice(8).trim();
                    const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                    await hideTagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                }
                break;
            case userMessage.startsWith('.tag'):
                const messageText = rawText.slice(4).trim();  // use rawText here, not userMessage
                const replyMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage || null;
                await tagCommand(sock, chatId, senderId, messageText, replyMessage, message);
                break;
            case userMessage.startsWith('.antilink'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, {
                        text: 'This command can only be used in groups.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, {
                        text: 'Please make the bot an admin first.',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                await handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message);
                break;

            case userMessage === '.meme':
                await memeCommand(sock, chatId, message);
                break;
            case userMessage === '.joke':
                await jokeCommand(sock, chatId, message);
                break;
            case userMessage === '.quote':
                await quoteCommand(sock, chatId, message);
                break;
            case userMessage === '.fact':
                await factCommand(sock, chatId, message, message);
                break;
            case userMessage.startsWith('.weather'):
                const city = userMessage.slice(9).trim();
                if (city) {
                    await weatherCommand(sock, chatId, message, city);
                } else {
                    await sock.sendMessage(chatId, { text: 'Please specify a city, e.g., .weather London', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage === '.news':
                await newsCommand(sock, chatId);
                break;
            case userMessage.startsWith('.nanobanana'):
                await nanobananaCommand(sock, chatId, message, userMessage.slice(11).trim());
                break;
            case userMessage.startsWith('.quran'):
                await quranCommand(sock, chatId, message, userMessage.slice(6).trim());
                break;
            case userMessage.startsWith('.tgsticker'):
                await tgStickerCommand(sock, chatId, message, userMessage.slice(10).trim());
                break;
            case userMessage.startsWith('.aivoice'):
                await voiceAiCommand(sock, chatId, message, userMessage.slice(8).trim());
                break;
            case userMessage.startsWith('.sptts'):
                await speechmaCommand(sock, chatId, message, userMessage.slice(6).trim());
                break;
            case userMessage === '.obfuscate':
                await obfuscateCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.8ball'):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question);
                break;
            case userMessage.startsWith('.lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;
            case userMessage === '.clear':
                if (isGroup) await clearCommand(sock, chatId);
                break;
            case userMessage.startsWith('.promote'):
                const mentionedJidListPromote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await promoteCommand(sock, chatId, mentionedJidListPromote, message);
                break;
            case userMessage.startsWith('.demote'):
                const mentionedJidListDemote = message.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await demoteCommand(sock, chatId, mentionedJidListDemote, message);
                break;
            case userMessage === '.ping':
                await pingCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tc ') || userMessage === '.tc':
            case userMessage.startsWith('.truecaller ') || userMessage === '.truecaller': {
                const tcArgs = userMessage.replace(/^\.(tc|truecaller)\s*/, '');
                await truecallerCommand(sock, chatId, message, tcArgs);
                break;
            }
            case userMessage === '.alive':
                await aliveCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.mention '):
                {
                    const args = userMessage.split(' ').slice(1).join(' ');
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await mentionToggleCommand(sock, chatId, message, args, isOwner);
                }
                break;
            case userMessage === '.setmention':
                {
                    const isOwner = message.key.fromMe || senderIsSudo;
                    await setMentionCommand(sock, chatId, message, isOwner);
                }
                break;
                
            case userMessage.startsWith('.blur'):
                const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                await blurCommand(sock, chatId, message, quotedMessage);
                break;
            case userMessage.startsWith('.welcome'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await welcomeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.goodbye'):
                if (isGroup) {
                    // Check admin status if not already checked
                    if (!isSenderAdmin) {
                        const adminStatus = await isAdmin(sock, chatId, senderId);
                        isSenderAdmin = adminStatus.isSenderAdmin;
                    }

                    if (isSenderAdmin || message.key.fromMe) {
                        await goodbyeCommand(sock, chatId, message);
                    } else {
                        await sock.sendMessage(chatId, { text: 'Sorry, only group admins can use this command.', ...channelInfo }, { quoted: message });
                    }
                } else {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                }
                break;
                
                
                // ... switch کے اندر
case userMessage.startsWith('.spam'): {
    const args = rawText.slice('.spam'.length).trim().split(/\s+/);
    if (args.length < 2) {
        await sock.sendMessage(chatId, {
            text: '📌 *Usage:* .spam <number> <message> [count] [delay_ms]\nExample: .spam 9232048822390 "I love you" 500 200',
            ...channelInfo
        }, { quoted: message });
        break;
    }
    const number = args.shift().replace(/[^0-9]/g, '');
    let count = 100;  // default
    let delay = 1000; // default
    let msg = args.join(' ');
    // اگر آخری دو آرگومنٹ عدد ہیں تو انہیں count اور delay سمجھیں
    const last = args[args.length-1];
    const secondLast = args[args.length-2];
    if (!isNaN(last) && !isNaN(secondLast)) {
        count = parseInt(secondLast);
        delay = parseInt(last);
        msg = args.slice(0, args.length-2).join(' ');
    } else if (!isNaN(last)) {
        count = parseInt(last);
        msg = args.slice(0, args.length-1).join(' ');
    }

    // صرف owner/sudo کو اجازت
    if (!message.key.fromMe && !senderIsOwnerOrSudo) {
        await sock.sendMessage(chatId, {
            text: '❌ Only owner/sudo can use this.',
            ...channelInfo
        }, { quoted: message });
        break;
    }

    const targetJid = number + '@s.whatsapp.net';
    const sent = await sendSpam(sock, targetJid, msg, count, delay);
    await sock.sendMessage(chatId, {
        text: `✅ Sent ${sent} messages to ${number}.`,
        ...channelInfo
    }, { quoted: message });
    commandExecuted = true;
    break;
}
                
                
                


// ─── .love COMMAND (10 random love texts) ──────────────────────
            case userMessage === '.git':
            case userMessage === '.github':
            case userMessage === '.sc':
            case userMessage === '.script':
            case userMessage === '.repo':
                await githubCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.antibadword'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                const adminStatus = await isAdmin(sock, chatId, senderId);
                isSenderAdmin = adminStatus.isSenderAdmin;
                isBotAdmin = adminStatus.isBotAdmin;

                if (!isBotAdmin) {
                    await sock.sendMessage(chatId, { text: '*Bot must be admin to use this feature*', ...channelInfo }, { quoted: message });
                    return;
                }

                await antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin);
                break;
            case userMessage.startsWith('.chatbot'):
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups.', ...channelInfo }, { quoted: message });
                    return;
                }

                // Check if sender is admin or bot owner
                const chatbotAdminStatus = await isAdmin(sock, chatId, senderId);
                if (!chatbotAdminStatus.isSenderAdmin && !message.key.fromMe) {
                    await sock.sendMessage(chatId, { text: '*Only admins or bot owner can use this command*', ...channelInfo }, { quoted: message });
                    return;
                }

                const match = userMessage.slice(8).trim();
                await handleChatbotCommand(sock, chatId, message, match);
                break;
            case userMessage.startsWith('.take') || userMessage.startsWith('.steal'):
                {
                    const isSteal = userMessage.startsWith('.steal');
                    const sliceLen = isSteal ? 6 : 5; // '.steal' vs '.take'
                    const takeArgs = rawText.slice(sliceLen).trim().split(' ');
                    await takeCommand(sock, chatId, message, takeArgs);
                }
                break;
            case userMessage === '.groupinfo' || userMessage === '.infogp' || userMessage === '.infogrupo':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await groupInfoCommand(sock, chatId, message);
                break;
            case userMessage === '.resetlink' || userMessage === '.revoke' || userMessage === '.anularlink':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await resetlinkCommand(sock, chatId, senderId);
                break;
            case userMessage === '.staff' || userMessage === '.admins' || userMessage === '.listadmin':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await staffCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tourl') || userMessage.startsWith('.url'):
                await urlCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.emojimix') || userMessage.startsWith('.emix'):
                await emojimixCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.tg') || userMessage.startsWith('.stickertelegram') || userMessage.startsWith('.tgsticker') || userMessage.startsWith('.telesticker'):
                await stickerTelegramCommand(sock, chatId, message);
                break;

            case userMessage === '.vv':
                await viewOnceCommand(sock, chatId, message);
                break;
            case userMessage === '.clearsession' || userMessage === '.clearsesi':
                await clearSessionCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autostatus'):
                const autoStatusArgs = userMessage.split(' ').slice(1);
                await autoStatusCommand(sock, chatId, message, autoStatusArgs);
                break;
            case userMessage.startsWith('.antidelete'):
                const antideleteMatch = userMessage.slice(11).trim();
                await handleAntideleteCommand(sock, chatId, message, antideleteMatch);
                break;
            case userMessage === '.cleartmp':
                await clearTmpCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.callprivacy'):
                {
                    const cpArgs = userMessage.split(' ').slice(1);
                    await callPrivacyCommand(sock, chatId, message, cpArgs);
                }
                break;
            case userMessage === '.setpp':
                await setProfilePicture(sock, chatId, message);
                break;
            case userMessage.startsWith('.setgdesc'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupDescription(sock, chatId, senderId, text, message);
                }
                break;
            case userMessage.startsWith('.setgname'):
                {
                    const text = rawText.slice(9).trim();
                    await setGroupName(sock, chatId, senderId, text, message);
                }
                break;
            case userMessage.startsWith('.setgpp'):
                await setGroupPhoto(sock, chatId, senderId, message);
                break;
            case userMessage.startsWith('.instagram') || userMessage.startsWith('.insta') || (userMessage === '.ig' || userMessage.startsWith('.ig ')):
                await instagramCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.igsc'):
                await igsCommand(sock, chatId, message, true);
                break;
            case userMessage.startsWith('.igs'):
                await igsCommand(sock, chatId, message, false);
                break;
            case userMessage.startsWith('.tiktok') || userMessage.startsWith('.tt'):
                await tiktokCommand(sock, chatId, message);
                break;
                            case userMessage.startsWith('.ytmp3') || userMessage.startsWith('.mp3') || userMessage.startsWith('.song') || userMessage.startsWith('.play') || userMessage.startsWith('.music'):
                await ytmp3Command(sock, chatId, message);
                break;
            case userMessage.startsWith('.ytmp4') || userMessage.startsWith('.video') || userMessage.startsWith('.yt'):
                await ytmp4Command(sock, chatId, message);
                break;
            case userMessage.startsWith('.gpt') || userMessage.startsWith('.gemini') || userMessage.startsWith('.claude') || userMessage.startsWith('.haiku') || userMessage.startsWith('.chiku'):
                await aiCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.translate') || userMessage.startsWith('.trt'):
                const commandLength = userMessage.startsWith('.translate') ? 10 : 4;
                await handleTranslateCommand(sock, chatId, message, userMessage.slice(commandLength));
                return;
            case userMessage.startsWith('.ss') || userMessage.startsWith('.ssweb') || userMessage.startsWith('.screenshot'):
                const ssCommandLength = userMessage.startsWith('.screenshot') ? 11 : (userMessage.startsWith('.ssweb') ? 6 : 3);
                await handleSsCommand(sock, chatId, message, userMessage.slice(ssCommandLength).trim());
                break;
            case userMessage.startsWith('.areact') || userMessage.startsWith('.autoreact') || userMessage.startsWith('.autoreaction'):
                await handleAreactCommand(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith('.sudo'):
                await sudoCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.approve '):
                await approvePayment(sock, chatId, message, userMessage.slice(9).trim(), isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith('.reject '):
                await rejectPayment(sock, chatId, message, userMessage.slice(8).trim(), isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith('.checkpaid'):
                await checkPaid(sock, chatId, message, userMessage.slice(11).trim(), isOwnerOrSudoCheck);
                break;
            case userMessage === '.pendingpay':
                await pendingPayments(sock, chatId, message, isOwnerOrSudoCheck);
                break;
            case userMessage.startsWith('.imagine') || userMessage.startsWith('.flux') || userMessage.startsWith('.dalle'): await imagineCommand(sock, chatId, message);
                break;
            case userMessage === '.jid': await groupJidCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.autotyping'):
                await autotypingCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.autoread'):
                await autoreadCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.heart'):
                await handleHeart(sock, chatId, message);
                break;
            case userMessage.startsWith('.horny'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['horny', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.circle'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['circle', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.lgbt'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lgbt', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.lolice'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['lolice', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.simpcard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['simpcard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.tonikawa'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tonikawa', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.its-so-stupid'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['its-so-stupid', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.namecard'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['namecard', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;

            case userMessage.startsWith('.oogway2'):
            case userMessage.startsWith('.oogway'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.startsWith('.oogway2') ? 'oogway2' : 'oogway';
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.tweet'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['tweet', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.ytcomment'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = ['youtube-comment', ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage.startsWith('.comrade'):
            case userMessage.startsWith('.gay'):
            case userMessage.startsWith('.glass'):
            case userMessage.startsWith('.jail'):
            case userMessage.startsWith('.passed'):
            case userMessage.startsWith('.triggered'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const sub = userMessage.slice(1).split(/\s+/)[0];
                    const args = [sub, ...parts.slice(1)];
                    await miscCommand(sock, chatId, message, args);
                }
                break;
            case userMessage === '.crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.update'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const zipArg = parts[1] && parts[1].startsWith('http') ? parts[1] : '';
                    await updateCommand(sock, chatId, message, zipArg);
                }
                commandExecuted = true;
                break;
            case userMessage.startsWith('.removebg') || userMessage.startsWith('.rmbg') || userMessage.startsWith('.nobg'):
                await removebgCommand.exec(sock, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith('.remini') || userMessage.startsWith('.enhance') || userMessage.startsWith('.upscale'):
                await reminiCommand(sock, chatId, message, userMessage.split(' ').slice(1));
                break;
            case userMessage.startsWith('.sora'):
                await soraCommand(sock, chatId, message);
                break;

            // ─── SIM DATA COMMAND ───────────────────────────────────────────
            case userMessage.startsWith('.simdata'):
            case userMessage.startsWith('.sim'): {
                const parts = rawText.trim().split(/\s+/);
                const number = parts[1];

                if (!number) {
                    await sock.sendMessage(chatId, {
                        text: '❌ *SIM Data Check*\n\nPlease provide a phone number.\n\n📌 *Usage:* .simdata <number>\n📌 *Example:* .simdata 03001234567',
                        ...channelInfo
                    }, { quoted: message });
                    commandExecuted = true;
                    break;
                }

                try {
                    await sock.sendMessage(chatId, {
                        text: `🔍 Checking SIM data for *${number}*... Please wait.`,
                        ...channelInfo
                    }, { quoted: message });

                    const apiUrl = `http://wasifali.biz.id/public_apis/sim-info-api.php?search=${encodeURIComponent(number)}`;

                    let result;
                    try {
                        const axiosResp = await axios.get(apiUrl, {
                            timeout: 15000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
                                'Accept': 'application/json'
                            }
                        });
                        result = axiosResp.data;
                        // Some PHP endpoints return JSON as a plain string body
                        // instead of setting a JSON content-type; axios then
                        // hands it back unparsed.
                        if (typeof result === 'string') {
                            try { result = JSON.parse(result); } catch (_) { /* leave as string, handled below */ }
                        }
                    } catch (axErr) {
                        throw new Error('Network error: ' + axErr.message);
                    }

                    // Response shape isn't documented for this endpoint, so try
                    // the common possibilities rather than assuming one:
                    //  - { records: [...] } / { data: [...] } / { result: [...] }
                    //  - a bare array of records
                    //  - a single record object with the fields directly on it
                    let records = null;
                    if (Array.isArray(result)) {
                        records = result;
                    } else if (Array.isArray(result?.records)) {
                        records = result.records;
                    } else if (Array.isArray(result?.data)) {
                        records = result.data;
                    } else if (Array.isArray(result?.result)) {
                        records = result.result;
                    } else if (result && typeof result === 'object' && (result.name || result.mobile || result.cnic)) {
                        records = [result];
                    }

                    let replyText = `📋 *SIM Data Result*\n`;
                    replyText += `━━━━━━━━━━━━━━━━━━\n`;
                    replyText += `📱 *Number:* ${number}\n`;

                    if (records && records.length > 0) {
                        records.forEach((rec, idx) => {
                            if (records.length > 1) replyText += `\n📌 *Record ${idx + 1}:*\n`;
                            if (rec.name)    replyText += `👤 *Name:* ${rec.name}\n`;
                            if (rec.mobile)  replyText += `📞 *Mobile:* ${rec.mobile}\n`;
                            if (rec.cnic)    replyText += `🪪 *CNIC:* ${rec.cnic}\n`;
                            if (rec.address) replyText += `🏠 *Address:* ${rec.address}\n`;
                            if (rec.network) replyText += `📶 *Network:* ${rec.network}\n`;
                        });
                    } else if (result && (result.success === false || result.error)) {
                        replyText += `⚠️ *No record found for this number.*\n`;
                    } else {
                        // Unknown shape — show the raw response so it can be
                        // diagnosed, instead of silently saying "not found"
                        // when the data might actually be sitting right there
                        // under a field name we didn't guess.
                        const raw = typeof result === 'string' ? result : JSON.stringify(result);
                        replyText += `⚠️ *Unrecognized response format from API:*\n`;
                        replyText += '```' + raw.slice(0, 500) + '```\n';
                    }


                    replyText += `━━━━━━━━━━━━━━━━━━\n`;
                    replyText += `_Powered by Usman Khan Chachar_`;

                    await sock.sendMessage(chatId, {
                        text: replyText,
                        ...channelInfo
                    }, { quoted: message });

                } catch (err) {
                    console.error('SimData error:', err.message);
                    await sock.sendMessage(chatId, {
                        text: `❌ *SIM Data Error*\n\n*Debug:* ${err.message}\n\nNumber: *${number}*`,
                        ...channelInfo
                    }, { quoted: message });
                }

                commandExecuted = true;
                break;
            }
            // ──────────────────────────────────────────
            
            
            
            //──────────────────────

            case userMessage === '.namaz' || userMessage === '.prayer' || userMessage === '.namazvaqt':
                await namazCommand(sock, chatId, message);
                commandExecuted = true;
                break;

            // ══════════════════════════════════════════
            // 📖 HADITH COMMANDS - 10 Authentic Books
            // ══════════════════════════════════════════

            // .hadithbooks / .hadithlist / .hbooks → show all books
            case userMessage === '.hadithbooks':
            case userMessage === '.hadithlist':
            case userMessage === '.hbooks':
                await sock.sendMessage(chatId, { text: getBooksListMessage() }, { quoted: message });
                commandExecuted = true;
                break;

            // .hadith [book] [number]
            case userMessage.startsWith('.hadith'): {
                const hadithArgs = rawText.slice('.hadith'.length).trim();
                await hadithCommand(sock, chatId, message, hadithArgs);
                commandExecuted = true;
                break;
            }

            // Short book commands: .bukhari, .muslim, .tirmizi etc.
            case userMessage.startsWith('.bukhari'):
            case userMessage.startsWith('.muslim'):
            case userMessage.startsWith('.tirmizi'):
            case userMessage.startsWith('.tirmidhi'):
            case userMessage.startsWith('.abudawud'):
            case userMessage.startsWith('.dawud'):
            case userMessage.startsWith('.nasai'):
            case userMessage.startsWith('.ibnmajah'):
            case userMessage.startsWith('.majah'):
            case userMessage.startsWith('.ahmad'):
            case userMessage.startsWith('.musnad'):
            case userMessage.startsWith('.muwatta'):
            case userMessage.startsWith('.darimi'):
            case userMessage.startsWith('.riyadh'): {
                // Extract command word (e.g. "bukhari") and args (e.g. "2812")
                const cmdWord = userMessage.slice(1).split(/\s+/)[0]; // remove dot, get first word
                const bKey = findBookKey(cmdWord);
                if (bKey) {
                    const bArgs = rawText.slice(cmdWord.length + 1).trim(); // +1 for dot
                    await bookCommand(sock, chatId, message, bKey, bArgs);
                    commandExecuted = true;
                }
                break;
            }

            case userMessage.startsWith('.pair'): {
                const q = rawText.slice('.pair'.length).trim();
                await pairCommand(sock, chatId, message, q);
                commandExecuted = true;
                break;
            }

            case userMessage.startsWith('.facebook') || userMessage.startsWith('.fbdl') || userMessage.startsWith('.fb'): {
                const cmdLen = userMessage.startsWith('.facebook') ? 9 : userMessage.startsWith('.fbdl') ? 5 : 3;
                const q = rawText.slice(cmdLen).trim();
                await facebookCommand(sock, chatId, message, q);
                commandExecuted = true;
                break;
            }

            default:
                // ── Unknown command handler ──
                if (userMessage.startsWith('.')) {
                    // It looks like a command but doesn't exist
                    const suggestions = getCommandSuggestions(userMessage);
                    let unknownMsg = `❌ *Command not found:* \`${userMessage.split(' ')[0]}\`

`;

                    if (suggestions.length > 0) {
                        unknownMsg += `💡 *Kya aap yeh kehna chahte the?*
`;
                        suggestions.forEach(s => {
                            unknownMsg += `  • \`${s}\`
`;
                        });
                        unknownMsg += `
📋 Sari commands dekhne ke liye: \`.help\``;
                    } else {
                        unknownMsg += `📋 Sari commands dekhne ke liye: \`.help\`
`;
                        unknownMsg += `🔍 Koi suggestion nahi mili, command dobara check karein.`;
                    }

                    await sock.sendMessage(chatId, {
                        text: unknownMsg,
                        ...channelInfo
                    }, { quoted: message });

                    commandExecuted = true;
                } else {
                    if (isGroup) {
                        // Handle non-command group messages
                        if (userMessage) {
                            await handleChatbotResponse(sock, chatId, message, userMessage, senderId);
                        }
                        await handleMentionDetection(sock, chatId, message);
                    }
                    commandExecuted = false;
                }
                break;
        }

        // If a command was executed, show typing status after command execution
        if (commandExecuted !== false) {
            // Command was executed, now show typing status after command execution
            await showTypingAfterCommand(sock, chatId);
        }

        // Function to handle .groupjid command
        async function groupJidCommand(sock, chatId, message) {
            const groupJid = message.key.remoteJid;

            if (!groupJid.endsWith('@g.us')) {
                return await sock.sendMessage(chatId, {
                    text: "❌ This command can only be used in a group."
                });
            }

            await sock.sendMessage(chatId, {
                text: `✅ Group JID: ${groupJid}`
            }, {
                quoted: message
            });
        }

        if (userMessage.startsWith('.')) {
            // After command is processed successfully
            await addCommandReaction(sock, message);
        }
    } catch (error) {
        console.error('❌ Error in message handler:', error.message);
        // Only try to send error message if we have a valid chatId,
        // and never reply to our own messages (prevents bot replying
        // to its own "Failed to process command!" message in a loop).
        try {
            if (chatId && !message?.key?.fromMe) {
                const now = Date.now();
                global.__lastErrorReplyAt = global.__lastErrorReplyAt || {};
                const last = global.__lastErrorReplyAt[chatId] || 0;
                // Only send one error reply per chat every 30 seconds
                if (now - last > 30000) {
                    global.__lastErrorReplyAt[chatId] = now;
                    await sock.sendMessage(chatId, { text: '❌ Failed to process command!' });
                }
            }
        } catch {}
    }
}

async function handleGroupParticipantUpdate(sock, update) {
    try {
        const { id, participants, action, author } = update;

        // Check if it's a group
        if (!id.endsWith('@g.us')) return;

        // Respect bot mode: only announce promote/demote in public mode
        let isPublic = true;
        try {
            const modeData = JSON.parse(fs.readFileSync('./data/messageCount.json'));
            if (typeof modeData.isPublic === 'boolean') isPublic = modeData.isPublic;
        } catch (e) {
            // If reading fails, default to public behavior
        }

        // Handle promotion events
        if (action === 'promote') {
            if (!isPublic) return;
            await handlePromotionEvent(sock, id, participants, author);
            return;
        }

        // Handle demotion events
        if (action === 'demote') {
            if (!isPublic) return;
            await handleDemotionEvent(sock, id, participants, author);
            return;
        }

        // Handle join events
        if (action === 'add') {
            await handleJoinEvent(sock, id, participants);
        }

        // Handle leave events
        if (action === 'remove') {
            await handleLeaveEvent(sock, id, participants);
        }
    } catch (error) {
        console.error('Error in handleGroupParticipantUpdate:', error);
    }
}

// Instead, export the handlers along with handleMessages
module.exports = {
    handleIncomingCall,
    handleMessages,
    handleGroupParticipantUpdate,
    restorePendingTempBans,
    handleStatus: async (sock, status) => {
        await handleStatusUpdate(sock, status);
        await handleStatusMention(sock, status);
    }
};                                