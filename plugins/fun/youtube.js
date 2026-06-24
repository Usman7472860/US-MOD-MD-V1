const axios = require('axios');

const YOUTUBE_ID_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

function extractVideoId(url) {
    return String(url || '').match(YOUTUBE_ID_REGEX)?.[1] || null;
}

async function ytdl(url, format = 'mp3') {
    try {
        const videoId = extractVideoId(url);
        if (!videoId) return { status: false, mess: 'Invalid YouTube URL.' };

        const normalizedFormat = String(format).toLowerCase() === 'mp4' ? 'mp4' : 'mp3';

        const client = axios.create({
            timeout: 60000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 16; NX729J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.7271.123 Mobile Safari/537.36',
                Referer: 'https://id.ytmp3.mobi/'
            }
        });

        const { data: init } = await client.get('https://d.ymcdn.org/api/v1/init', {
            params: { p: 'y', 23: '1llum1n471', _: Math.random() }
        });
        if (!init?.convertURL) return { status: false, mess: 'Server init failed.' };

        const { data: convert } = await client.get(init.convertURL, {
            params: { v: videoId, f: normalizedFormat, _: Math.random() }
        });
        if (!convert?.progressURL || !convert?.downloadURL) return { status: false, mess: 'Conversion failed.' };

        let progress = 0, title = convert.title || '', attempts = 0;
        while (progress < 3 && attempts < 20) {
            const { data } = await client.get(convert.progressURL);
            if ((data?.error || 0) > 0) return { status: false, mess: `Server error: ${data.error}` };
            progress = Number(data?.progress || 0);
            title = data?.title || title;
            if (progress < 3) { attempts++; await new Promise(r => setTimeout(r, 300)); }
        }

        if (attempts >= 20 && progress < 3) return { status: false, mess: 'Timeout. Try again.' };
        return { status: true, title, dl: convert.downloadURL };

    } catch (e) {
        return { status: false, mess: `Error: ${e.message}` };
    }
}

async function getAudioUrl(url) {
    try {
        const { data } = await axios.get(
            `https://api.nexray.eu.cc/downloader/v1/ytmp3?url=${encodeURIComponent(url)}`,
            { timeout: 20000 }
        );
        if (data?.result?.url) return { download: data.result.url, title: data.result.title };
    } catch {}

    const fallback = await ytdl(url, 'mp3');
    if (fallback?.status && fallback?.dl) return { download: fallback.dl, title: fallback.title };
    throw new Error(fallback?.mess || 'Failed to get audio URL');
}

async function getVideoUrl(url) {
    const result = await ytdl(url, 'mp4');
    if (result?.status && result?.dl) return { download: result.dl, title: result.title };

    try {
        const { data } = await axios.get(
            `https://api.nexray.eu.cc/downloader/v1/ytmp4?url=${encodeURIComponent(url)}`,
            { timeout: 20000 }
        );
        if (data?.result?.url) return { download: data.result.url, title: data.result.title };
    } catch {}

    throw new Error(result?.mess || 'Failed to get video URL');
}

async function ytmp3Command(sock, chatId, message, directUrl = null) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const url = directUrl || text.split(' ').slice(1).join(' ').trim();

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: '📌 *YouTube MP3 Downloader*\n\nUsage: .ytmp3 <url>\nExample: .ytmp3 https://youtube.com/watch?v=xxx'
            }, { quoted: message });
        }

        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return await sock.sendMessage(chatId, { text: '❌ Please provide a valid YouTube URL.' }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
        const result = await getAudioUrl(url);

        await sock.sendMessage(chatId, {
            audio: { url: result.download },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `${result.title || 'audio'}.mp3`
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('[YTMP3] Error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: `❌ Failed to download audio.\n${err.message}` }, { quoted: message });
    }
}

async function ytmp4Command(sock, chatId, message, directUrl = null) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const url = directUrl || text.split(' ').slice(1).join(' ').trim();

        if (!url) {
            return await sock.sendMessage(chatId, {
                text: '📌 *YouTube MP4 Downloader*\n\nUsage: .ytmp4 <url>\nExample: .ytmp4 https://youtube.com/watch?v=xxx'
            }, { quoted: message });
        }

        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return await sock.sendMessage(chatId, { text: '❌ Please provide a valid YouTube URL.' }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        // Send both video AND audio
        const [videoResult, audioResult] = await Promise.allSettled([
            getVideoUrl(url),
            getAudioUrl(url)
        ]);

        if (videoResult.status === 'fulfilled') {
            await sock.sendMessage(chatId, {
                video: { url: videoResult.value.download },
                caption: `*🎬 YouTube Video*\n\n📝 ${videoResult.value.title || 'YouTube Video'}`
            }, { quoted: message });
        } else {
            throw new Error(videoResult.reason?.message || 'Video download failed');
        }

        if (audioResult.status === 'fulfilled') {
            await sock.sendMessage(chatId, {
                audio: { url: audioResult.value.download },
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${audioResult.value.title || 'audio'}.mp3`
            }, { quoted: message });
        }

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('[YTMP4] Error:', err.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        await sock.sendMessage(chatId, { text: `❌ Failed to download video.\n${err.message}` }, { quoted: message });
    }
}

module.exports = { ytmp3Command, ytmp4Command };
