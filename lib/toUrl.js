import axios from 'axios';
import FormData from 'form-data';

// Simple mime → ext map (no file-type package needed)
function getExtFromMime(mime = '', hint = '') {
    if (hint) {
        const h = hint.includes('.') ? hint.split('.').pop().split('?')[0] : hint;
        if (h && h.length <= 10) return h;
    }
    const map = {
        'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
        'image/webp': 'webp', 'video/mp4': 'mp4', 'video/3gpp': '3gp',
        'audio/mpeg': 'mp3', 'audio/mp4': 'mp4', 'audio/ogg': 'ogg',
        'audio/wav': 'wav', 'application/pdf': 'pdf',
        'application/zip': 'zip', 'application/octet-stream': 'bin',
    };
    return map[mime] || mime.split('/')[1] || 'bin';
}

export async function uploadToUrl(buffer, extOrMime = '') {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    const ext = getExtFromMime('', extOrMime) || 'bin';
    const filename = `upload_${Date.now()}.${ext}`;

    try {
        const form = new FormData();
        form.append('files[]', buf, { filename, contentType: 'application/octet-stream' });
        const res = await axios.post('https://qu.ax/upload.php', form, {
            headers: form.getHeaders(),
            timeout: 30000,
            maxContentLength: 256 * 1024 * 1024,
        });
        const url = res.data?.files?.[0]?.url;
        if (url) return url;
        throw new Error('No URL in response');
    } catch (e1) {
        // Fallback: catbox
        try {
            const form2 = new FormData();
            form2.append('reqtype', 'fileupload');
            form2.append('fileToUpload', buf, { filename });
            const res2 = await axios.post('https://catbox.moe/user/api.php', form2, {
                headers: form2.getHeaders(),
                timeout: 30000,
            });
            if (res2.data?.startsWith('http')) return res2.data.trim();
            throw new Error('Catbox failed');
        } catch (e2) {
            throw new Error(`Upload failed: ${e1.message}`);
        }
    }
}
