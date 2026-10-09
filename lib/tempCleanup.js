/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

const fs = require('fs');
const path = require('path');

// ─── DISK CLEANUP ─────────────────────────────────────────────────────────────
function cleanupTempFiles(maxAgeMinutes = 15) {
    const tempDirs = [
        path.join(process.cwd(), 'temp'),
        path.join(process.cwd(), 'tmp'),
        path.join(process.cwd(), 'downloads'),
    ];

    const maxAge = maxAgeMinutes * 60 * 1000;
    const now = Date.now();
    let totalCleaned = 0;

    tempDirs.forEach(tempDir => {
        if (!fs.existsSync(tempDir)) return;

        let cleaned = 0;
        try {
            const files = fs.readdirSync(tempDir);
            files.forEach(file => {
                const filePath = path.join(tempDir, file);
                try {
                    const stats = fs.statSync(filePath);
                    if (stats.isFile() && (now - stats.mtimeMs > maxAge)) {
                        fs.unlinkSync(filePath);
                        cleaned++;
                    }
                } catch {}
            });
            if (cleaned > 0) {
                console.log(`🧹 Cleaned ${cleaned} file(s) from ${path.basename(tempDir)}/`);
                totalCleaned += cleaned;
            }
        } catch {}
    });

    return totalCleaned;
}

// ─── MEMORY CLEANUP ───────────────────────────────────────────────────────────
function cleanupMemory() {
    if (global.gc) {
        global.gc();
        console.log('🧠 GC triggered');
    }

    const used = process.memoryUsage();
    const rssMB = Math.round(used.rss / 1024 / 1024);
    const heapMB = Math.round(used.heapUsed / 1024 / 1024);

    console.log(`📊 Memory — RSS: ${rssMB}MB | Heap: ${heapMB}MB`);

    // Clear caches on high usage
    if (rssMB > 430) {
        if (global.mediaCache) global.mediaCache = {};
        if (global.msgCache) global.msgCache = {};
        if (global.downloadCache) global.downloadCache = {};
        console.log('🧹 Memory caches cleared (RSS > 430MB)');
    }

    return rssMB;
}

// ─── COMBINED CLEANUP ─────────────────────────────────────────────────────────
function runCleanup() {
    console.log('♻️ Auto cleanup running...');
    const files = cleanupTempFiles(15); // delete files older than 15 min
    const ram = cleanupMemory();
    console.log(`✅ Cleanup done — ${files} files removed, RAM: ${ram}MB`);
}

// Cleanup on startup
runCleanup();

// ── Cleanup every 10 minutes ──
setInterval(runCleanup, 10 * 60 * 1000);

module.exports = { cleanupTempFiles, cleanupMemory, runCleanup };
