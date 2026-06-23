const axios = require('axios');

async function tiktokDl(url) {
    function formatNumber(integer) {
        let numb = parseInt(integer);
        return Number(numb).toLocaleString().replace(/,/g, '.');
    }

    const formData = new URLSearchParams();
    formData.append('url', url);
    formData.append('count', '12');
    formData.append('cursor', '0');
    formData.append('web', '1');
    formData.append('hd', '1');

    const response = await axios.post('https://www.tikwm.com/api/', formData.toString(), {
        headers: {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Language': 'en-US,en;q=0.9',
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Origin': 'https://www.tikwm.com',
            'Referer': 'https://www.tikwm.com/',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest'
        },
        timeout: 25000
    });

    const res = response.data?.data;
    if (!res) throw new Error('No data from tikwm API');

    const BASE = 'https://www.tikwm.com';

    let data = [];
    if (res.duration == 0 && res.images?.length) {
        res.images.forEach(v => data.push({ type: 'photo', url: v }));
    } else {
        data.push(
            { type: 'watermark',      url: res.wmplay  ? (res.wmplay.startsWith('http')  ? res.wmplay  : BASE + res.wmplay)  : '' },
            { type: 'nowatermark',    url: res.play    ? (res.play.startsWith('http')    ? res.play    : BASE + res.play)    : '' },
            { type: 'nowatermark_hd', url: res.hdplay  ? (res.hdplay.startsWith('http')  ? res.hdplay  : BASE + res.hdplay)  : '' }
        );
    }

    // ── AUDIO: try multiple fields in order ──
    let musicUrl = '';
    let musicTitle = res.music_info?.title || res.title || 'tiktok_audio';

    const candidates = [
        res.music_info?.play,
        res.music,
        res.music_info?.url,
        // tikwm sometimes puts audio inside hdplay-like field
    ].filter(Boolean);

    for (const c of candidates) {
        if (c && c.length > 5) {
            musicUrl = c.startsWith('http') ? c : BASE + c;
            break;
        }
    }

    // Fallback: extract audio from video URL by replacing /play/ with /music/
    if (!musicUrl && res.play) {
        const videoUrl = res.play.startsWith('http') ? res.play : BASE + res.play;
        // tikwm music endpoint pattern
        musicUrl = videoUrl.replace('/play/', '/music/');
    }

    return {
        status: true,
        title: res.title || '',
        durations: res.duration,
        data,
        musicUrl,
        musicTitle,
        stats: {
            views:   formatNumber(res.play_count    || 0),
            likes:   formatNumber(res.digg_count    || 0),
            comment: formatNumber(res.comment_count || 0),
            share:   formatNumber(res.share_count   || 0)
        },
        author: {
            nickname: res.author?.nickname || res.author?.unique_id || ''
        }
    };
}

// ── Verify audio URL actually responds ──
async function verifyUrl(url) {
    try {
        const r = await axios.head(url, { timeout: 8000, maxRedirects: 5 });
        return r.status >= 200 && r.status < 400;
    } catch {
        return false;
    }
}

async function tiktokCommand(sock, chatId, message, directUrl = null) {
    try {
        const text = message.message?.conversation ||
                     message.message?.extendedTextMessage?.text || '';

        let url = directUrl;
        if (!url) {
            const parts = text.trim().split(/\s+/);
            parts.shift();
            url = parts.join(' ').trim();
        }

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: '📌 *TikTok Downloader*\n\nUsage: .tiktok <url>\nExample: .tiktok https://vt.tiktok.com/ZSxTwxnth/'
            }, { quoted: message });
        }

        if (!url.match(/tiktok\.com/i)) {
            return await sock.sendMessage(chatId, {
                text: '❌ Invalid URL. Please provide a TikTok link.'
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        const result = await tiktokDl(url);

        const caption =
            `*🎵 TikTok Download*\n\n` +
            `📝 ${result.title || 'No title'}\n` +
            `👤 ${result.author?.nickname || ''}\n` +
            `👁️ Views: ${result.stats?.views || '-'} | ❤️ Likes: ${result.stats?.likes || '-'}`;

        if (result.durations > 0) {
            // ── VIDEO ──
            const nowm = result.data.find(e => e.type === 'nowatermark_hd') ||
                         result.data.find(e => e.type === 'nowatermark');

            if (!nowm?.url) throw new Error('No video URL found');

            await sock.sendMessage(chatId, {
                video: { url: nowm.url },
                caption
            }, { quoted: message });

        } else {
            // ── SLIDES ──
            const photos = result.data.filter(e => e.type === 'photo');
            if (photos.length === 0) throw new Error('No media found');

            for (let i = 0; i < photos.length; i++) {
                await sock.sendMessage(chatId, {
                    image: { url: photos[i].url },
                    caption: i === 0
                        ? `*🖼️ TikTok Slide (${i + 1}/${photos.length})*\n${caption}`
                        : `Slide ${i + 1}/${photos.length}`
                }, { quoted: message });
            }
        }

        // ── AUDIO (video + slides dono ke liye) ──
        if (result.musicUrl) {
            try {
                const audioOk = await verifyUrl(result.musicUrl);
                if (audioOk) {
                    await sock.sendMessage(chatId, {
                        audio: { url: result.musicUrl },
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        fileName: `${result.musicTitle}.mp3`
                    }, { quoted: message });
                } else {
                    // Try tikwm /music/ direct endpoint as last resort
                    const altAudio = `https://www.tikwm.com/video/music/${url.split('/video/')[1]?.split('/')[0] || ''}.mp3`;
                    const altOk = await verifyUrl(altAudio);
                    if (altOk) {
                        await sock.sendMessage(chatId, {
                            audio: { url: altAudio },
                            mimetype: 'audio/mpeg',
                            ptt: false,
                            fileName: `${result.musicTitle}.mp3`
                        }, { quoted: message });
                    } else {
                        await sock.sendMessage(chatId, {
                            text: `⚠️ Audio download nahi ho saka — TikTok ne block kar diya. Video mil gaya! 🎬`
                        }, { quoted: message });
                    }
                }
            } catch (audioErr) {
                console.error('[TikTok] Audio send failed:', audioErr.message);
                await sock.sendMessage(chatId, {
                    text: `⚠️ Audio bhejne mein masla: ${audioErr.message}`
                }, { quoted: message });
            }
        } else {
            await sock.sendMessage(chatId, {
                text: `⚠️ Is video ka audio tikwm ne nahi diya.`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('[TikTok] Error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `❌ TikTok download failed: ${err.message}`
        }, { quoted: message });
    }
}

module.exports = tiktokCommand;
