const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data', 'messageCount.json');

function loadMessageCounts() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const raw = fs.readFileSync(dataFilePath, 'utf8').trim();
            return raw ? JSON.parse(raw) : {};
        }
    } catch (err) {
        console.error('loadMessageCounts error (returning empty):', err.message);
    }
    return {};
}

function saveMessageCounts(messageCounts) {
    try {
        const dataDir = path.dirname(dataFilePath);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        // Atomic write: write to temp file then rename, so a crash/parallel
        // write from another session never leaves messageCount.json empty.
        const tmpPath = `${dataFilePath}.${process.pid}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(messageCounts, null, 2));
        fs.renameSync(tmpPath, dataFilePath);
    } catch (err) {
        console.error('saveMessageCounts error:', err.message);
    }
}

function incrementMessageCount(groupId, userId) {
    const messageCounts = loadMessageCounts();

    if (!messageCounts[groupId]) {
        messageCounts[groupId] = {};
    }

    if (!messageCounts[groupId][userId]) {
        messageCounts[groupId][userId] = 0;
    }

    messageCounts[groupId][userId] += 1;

    saveMessageCounts(messageCounts);
}

function topMembers(sock, chatId, isGroup) {
    if (!isGroup) {
        sock.sendMessage(chatId, { text: 'This command is only available in group chats.' });
        return;
    }

    const messageCounts = loadMessageCounts();
    const groupCounts = messageCounts[chatId] || {};

    const sortedMembers = Object.entries(groupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Get top 5 members

    if (sortedMembers.length === 0) {
        sock.sendMessage(chatId, { text: 'No message activity recorded yet.' });
        return;
    }

    let message = '🏆 Top Members Based on Message Count:\n\n';
    sortedMembers.forEach(([userId, count], index) => {
        message += `${index + 1}. @${userId.split('@')[0]} - ${count} messages\n`;
    });

    sock.sendMessage(chatId, { text: message, mentions: sortedMembers.map(([userId]) => userId) });
}

module.exports = { incrementMessageCount, topMembers };
