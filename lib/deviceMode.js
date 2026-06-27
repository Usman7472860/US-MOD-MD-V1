/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

export async function getDeviceMode() {
    const val = (process.env.DEVICE || 'android').toLowerCase().trim();
    return val === 'ios' ? 'ios' : 'android';
}
