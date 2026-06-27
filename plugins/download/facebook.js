/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

const axios = require('axios');
const cheerio = require('cheerio');

const channelInfo = {
    contextInfo: {
        
        
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363428492698734@newsletter',
            newsletterName: 'US MOD BOT',
            serverMessageId: -1
        }
    }
};

async function facebookCommand(sock, chatId, message, q) {
    if (!q) {
        return await sock.sendMessage(chatId, {
            text: `Please provide a Facebook video link.\nExample: *.facebook https://www.facebook.com/...*`,
            ...channelInfo
        }, { quoted: message });
    }

    await sock.sendMessage(chatId, {
        text: `⏳ Fetching Facebook video, please wait...`,
        ...channelInfo
    }, { quoted: message });

    try {
        const res = await axios.post(
            'https://v3.fdownloader.net/api/ajaxSearch',
            new URLSearchParams({
                q: q,
                lang: 'en',
                web: 'fdownloader.net',
                v: 'v2',
                w: ''
            }).toString(),
            {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'origin': 'https://fdownloader.net',
                    'referer': 'https://fdownloader.net/',
                    'user-agent': 'Mozilla/5.0 (Linux; Android 10)'
                }
            }
        );

        const $ = cheerio.load(res.data.data);

        const duration = $('.content p').first().text().trim() || 'Unknown';
        const videos = $('.download-link-fb').map((_, el) => ({
            quality: $(el).attr('title')?.replace('Download ', '') || '',
            url: $(el).attr('href')
        })).get();

        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `❌ No video found. Make sure the link is a valid public Facebook video.`,
                ...channelInfo
            }, { quoted: message });
        }

        const selected = videos.find(v => v.quality.includes('720p')) || videos[0];

        await sock.sendMessage(chatId, {
            video: { url: selected.url },
            caption: `🎬 *Facebook Video*\n\n⏱ Duration: ${duration}\n📊 Quality: ${selected.quality}`,
            mimetype: 'video/mp4',
            ...channelInfo
        }, { quoted: message });

    } catch (err) {
        console.error('facebookCommand error:', err);
        await sock.sendMessage(chatId, {
            text: `❌ Error: ${err.message || 'Could not download video. Try again later.'}`,
            ...channelInfo
        }, { quoted: message });
    }
}

module.exports = facebookCommand;
