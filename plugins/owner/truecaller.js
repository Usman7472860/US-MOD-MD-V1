/**
 * Truecaller Lookup Command
 * Uses truecallerjs library — requires login via: truecallerjs login
 * Command: .tc <number>  or  .truecaller <number>
 */

let truecallerjs;
try {
    truecallerjs = require('truecallerjs');
} catch (e) {
    truecallerjs = null;
}

const settings = require('../../settings.js');

async function truecallerCommand(sock, chatId, message, args) {
    try {
        // Check if library is installed
        if (!truecallerjs) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Truecaller not installed*\n\nServer pe run karo:\n```npm install truecallerjs```'
            }, { quoted: message });
        }

        // Check installation ID is set
        const installationId = settings.truecallerInstallId || process.env.TRUECALLER_INSTALL_ID;
        if (!installationId) {
            return await sock.sendMessage(chatId, {
                text: '❌ *Truecaller Installation ID missing*\n\nSettings mein `truecallerInstallId` set karo.\n\nID lene ke liye server pe:\n```truecallerjs login\ntruecallerjs -i```'
            }, { quoted: message });
        }

        // Get number from args
        let number = (args || '').trim().replace(/[^0-9+]/g, '');
        if (!number) {
            return await sock.sendMessage(chatId, {
                text: `📞 *Truecaller Lookup*\n\n*Usage:* .tc <number>\n*Example:* .tc 923001234567\n\n_Number country code ke saath likho_`
            }, { quoted: message });
        }

        // Add + if not present
        if (!number.startsWith('+')) number = '+' + number;

        // Send searching message
        await sock.sendMessage(chatId, {
            text: `🔍 *Searching Truecaller...*\n📞 Number: ${number}`
        }, { quoted: message });

        // Build search data
        const countryCode = number.startsWith('+92') ? 'PK' : 'IN';
        const searchData = {
            number: number.replace('+', ''),
            countryCode: countryCode,
            installationId: installationId,
        };

        // Make request
        const result = await truecallerjs.search(searchData);
        const json = result.json();

        if (!json || json.data?.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `❌ *No results found*\n\n📞 Number: ${number}\n_This number may not be registered on Truecaller._`
            }, { quoted: message });
        }

        const data = json.data?.[0] || {};

        // Extract info
        const name       = data.name || 'Unknown';
        const phones     = data.phones?.[0] || {};
        const e164       = phones.e164Format || number;
        const national   = phones.nationalFormat || number;
        const carrier    = phones.carrier || 'Unknown';
        const numberType = phones.numberType || 'Unknown';
        const address    = data.addresses?.[0] || {};
        const city       = address.city || '';
        const country    = address.countryCode || '';
        const score      = data.score ? data.score.toFixed(1) : 'N/A';
        const spamScore  = data.spamScore ? Math.round(data.spamScore) : 0;
        const isSpam     = spamScore > 30;
        const emailList  = data.internetAddresses?.map(e => e.id).join(', ') || 'N/A';

        // Format response
        const spamBar = isSpam
            ? `⚠️ SPAM (Score: ${spamScore}/100)`
            : `✅ Clean (Score: ${spamScore}/100)`;

        const response = `
┏━━〔 📞 *TRUECALLER RESULT* 〕━━┓
┃
┃ 👤 *Name*     : ${name}
┃ 📱 *Number*   : ${national}
┃ 🌍 *Country*  : ${country || 'N/A'}
┃ 🏙️ *City*     : ${city || 'N/A'}
┃ 📡 *Carrier*  : ${carrier}
┃ 📋 *Type*     : ${numberType}
┃ 📧 *Email*    : ${emailList}
┃ ⭐ *Score*    : ${score}
┃ 🚫 *Spam*     : ${spamBar}
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
_Powered by US MOD MD_`.trim();

        await sock.sendMessage(chatId, { text: response }, { quoted: message });

    } catch (error) {
        console.error('[Truecaller] Error:', error.message);

        let errMsg = '❌ *Truecaller lookup failed*\n\n';
        if (error.message?.includes('login') || error.message?.includes('auth')) {
            errMsg += '⚠️ Session expired. Server pe dobara login karo:\n```truecallerjs login```';
        } else if (error.message?.includes('rate')) {
            errMsg += '⏳ Rate limit — thodi der baad try karo.';
        } else {
            errMsg += `Error: ${error.message}`;
        }

        await sock.sendMessage(chatId, { text: errMsg }, { quoted: message });
    }
}

module.exports = truecallerCommand;
