/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

/**
 * fakeQuoted - US MOD MD V1
 * ESM version
 */

export function getFakeQuoted(m) {
    return {
        key: {
            participant: '0@s.whatsapp.net',
            remoteJid: '0@s.whatsapp.net',
            id: m?.id || m?.key?.id || '0',
        },
        message: {
            conversation: 'Usman',
        },
        contextInfo: {
            mentionedJid: [m?.sender || m?.key?.participant || ''],
            forwardingScore: 999,
            isForwarded: true,
        },
    };
}
