/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

/**
 * 🕌 NAMAZ TIMES - Lahore, Pakistan
 * Command: .namaz → shows today's prayer times on demand (no auto-alert)
 */

const axios = require('axios');

// Aladhan API - Lahore, method 1 = University of Islamic Sciences, Karachi
const PRAYER_API = 'https://api.aladhan.com/v1/timingsByCity';
const CITY = 'Lahore';
const COUNTRY = 'Pakistan';
const METHOD = 1;

// Cache today's times
let cachedTimes = null;
let cachedDate  = null;

async function fetchPrayerTimes() {
    const today = new Date().toDateString();
    if (cachedDate === today && cachedTimes) return cachedTimes;

    const { data } = await axios.get(PRAYER_API, {
        params: { city: CITY, country: COUNTRY, method: METHOD },
        timeout: 10000
    });

    if (data.code !== 200) throw new Error('Aladhan API error: ' + data.status);

    const t = data.data.timings;
    cachedTimes = {
        Fajr:    t.Fajr,
        Sunrise: t.Sunrise,
        Dhuhr:   t.Dhuhr,
        Asr:     t.Asr,
        Maghrib: t.Maghrib,
        Isha:    t.Isha,
        date:    data.data.date.readable,
        hijri:   `${data.data.date.hijri.day} ${data.data.date.hijri.month.en} ${data.data.date.hijri.year} ھ`,
    };
    cachedDate = today;
    return cachedTimes;
}

// .namaz COMMAND — show today's times on demand
async function namazCommand(sock, chatId, message) {
    try {
        await sock.sendMessage(chatId, { text: '🕌 Fetching Lahore prayer times...' }, { quoted: message });

        const times = await fetchPrayerTimes();

        const reply =
`━━━━━━━━━━━━━━━━━━━━━
🕌 *نماز اوقات — لاہور، پاکستان*
━━━━━━━━━━━━━━━━━━━━━
📅 ${times.date}  |  🌙 ${times.hijri}

🌅 *فجر (Fajr):*      ${times.Fajr}
🌄 *طلوع آفتاب:*      ${times.Sunrise}
☀️ *ظہر (Dhuhr):*     ${times.Dhuhr}
🌤️ *عصر (Asr):*       ${times.Asr}
🌆 *مغرب (Maghrib):*  ${times.Maghrib}
🌃 *عشاء (Isha):*     ${times.Isha}

📍 طریقہ حساب: جامعہ بنوری ٹاؤن، کراچی
━━━━━━━━━━━━━━━━━━━━━`;

        await sock.sendMessage(chatId, { text: reply }, { quoted: message });
    } catch (e) {
        console.error('🕌 namazCommand error:', e.message);
        await sock.sendMessage(chatId, { text: '❌ Namaz times fetch karne mein error aaya. Dobara try karein.' }, { quoted: message });
    }
}

module.exports = { namazCommand };
