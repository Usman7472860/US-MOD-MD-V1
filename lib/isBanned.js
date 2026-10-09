/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

const fs = require('fs');

function isBanned(userId) {
    try {
        const raw = fs.readFileSync('./data/banned.json', 'utf8').trim();
        const bannedUsers = raw ? JSON.parse(raw) : [];
        return bannedUsers.includes(userId);
    } catch (error) {
        console.error('Error checking banned status:', error);
        return false;
    }
}

module.exports = { isBanned }; 