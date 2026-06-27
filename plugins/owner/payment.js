/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

/**
 * US MOD MD - Payment Commands
 * .approve, .reject, .checkpaid, .plans
 */

const fs = require('fs');
const path = require('path');
const settings = require('../../settings');

const PAYMENTS_FILE = path.join(__dirname, '../../data/payments.json');
const PAID_FILE = path.join(__dirname, '../../data/paid_users.json');

// ─── Plans config (prices change karo yahan) ───────────────────────────────
const PLANS = {
    weekly:   { label: 'Weekly',  days: 7,   price: 50  },
    monthly:  { label: 'Monthly', days: 30,  price: 100 },
    '3month': { label: '3 Month', days: 90,  price: 250 },
    '6month': { label: '6 Month', days: 180, price: 400 },
    yearly:   { label: 'Yearly',  days: 365, price: 700 },
};
// ───────────────────────────────────────────────────────────────────────────

function readPayments() {
    try { return JSON.parse(fs.readFileSync(PAYMENTS_FILE, 'utf8')); } 
    catch { return []; }
}
function writePayments(data) {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(data, null, 2));
}

function readPaid() {
    try { return JSON.parse(fs.readFileSync(PAID_FILE, 'utf8')); }
    catch { return {}; }
}
function writePaid(data) {
    fs.writeFileSync(PAID_FILE, JSON.stringify(data, null, 2));
}

// Check kar ke user paid hai ya nahi
function isPaidUser(phone) {
    const paid = readPaid();
    const entry = paid[phone];
    if (!entry) return false;
    if (entry.expiry === 'lifetime') return true;
    return new Date(entry.expiry) > new Date();
}

// Approve command: .approve 923xxxxxxxxx weekly
async function approvePayment(sock, chatId, message, args, senderIsOwner) {
    if (!senderIsOwner) return sock.sendMessage(chatId, { text: '❌ Sirf owner ye command use kar sakta hai.' }, { quoted: message });

    const parts = args.trim().split(/\s+/);
    const phone = (parts[0] || '').replace(/[^0-9]/g, '');
    const planKey = (parts[1] || 'monthly').toLowerCase();

    if (!phone || phone.length < 10) {
        return sock.sendMessage(chatId, { text: '❌ Format: `.approve 923xxxxxxxxx weekly`\nPlans: weekly, monthly, 3month' }, { quoted: message });
    }

    const plan = PLANS[planKey] || PLANS['monthly'];
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + plan.days);

    // Save paid user
    const paid = readPaid();
    paid[phone] = {
        plan: planKey,
        expiry: expiry.toISOString(),
        approvedAt: new Date().toISOString(),
        approvedBy: 'owner'
    };
    writePaid(paid);

    // Mark payment as approved
    const payments = readPayments();
    const idx = payments.findIndex(p => p.phone === phone && p.status === 'pending');
    if (idx !== -1) {
        payments[idx].status = 'approved';
        payments[idx].approvedAt = new Date().toISOString();
        writePayments(payments);
    }

    const expiryStr = expiry.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });

    await sock.sendMessage(chatId, {
        text: `✅ *Payment Approved!*\n\n📱 *Number:* ${phone}\n📦 *Plan:* ${plan.label}\n📅 *Expiry:* ${expiryStr}\n\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐔𝐬𝐦𝐚𝐧 𝐊𝐡𝐚𝐧 𝐂𝐡𝐚𝐜𝐡𝐚𝐫`
    }, { quoted: message });

    // Notify the user on WhatsApp
    try {
        const userJid = `${phone}@s.whatsapp.net`;
        await sock.sendMessage(userJid, {
            text: `🎉 *US MOD MD — Premium Activated!*\n\n✅ Aapka payment approve ho gaya!\n\n📦 *Plan:* ${plan.label}\n📅 *Expiry:* ${expiryStr}\n\nAb aap sab premium commands use kar sakte hain! 🚀\n\n> 𝐏𝐨𝐰𝐞𝐫𝐞𝐝 𝐁𝐲 𝐔𝐬𝐦𝐚𝐧 𝐊𝐡𝐚𝐧 𝐂𝐡𝐚𝐜𝐡𝐚𝐫`
        });
    } catch (e) {
        console.log('User notify failed:', e.message);
    }
}

// Reject command: .reject 923xxxxxxxxx
async function rejectPayment(sock, chatId, message, args, senderIsOwner) {
    if (!senderIsOwner) return sock.sendMessage(chatId, { text: '❌ Sirf owner ye command use kar sakta hai.' }, { quoted: message });

    const phone = (args || '').replace(/[^0-9]/g, '');
    if (!phone || phone.length < 10) {
        return sock.sendMessage(chatId, { text: '❌ Format: `.reject 923xxxxxxxxx`' }, { quoted: message });
    }

    const payments = readPayments();
    const idx = payments.findIndex(p => p.phone === phone && p.status === 'pending');
    if (idx !== -1) {
        payments[idx].status = 'rejected';
        writePayments(payments);
    }

    await sock.sendMessage(chatId, {
        text: `❌ *Payment Rejected*\n📱 Number: ${phone}\n\nUser ko notify kar diya gaya.`
    }, { quoted: message });

    try {
        const userJid = `${phone}@s.whatsapp.net`;
        await sock.sendMessage(userJid, {
            text: `❌ *US MOD MD — Payment Rejected*\n\nAapka payment TXN ID verify nahi hua.\nDobara try karein ya owner se rabta karein:\nwa.me/${settings.owner}`
        });
    } catch (e) {}
}

// .checkpaid 923xxxxxxxxx
async function checkPaid(sock, chatId, message, args, senderIsOwner) {
    if (!senderIsOwner) return sock.sendMessage(chatId, { text: '❌ Sirf owner.' }, { quoted: message });

    const phone = (args || '').replace(/[^0-9]/g, '');
    if (!phone) return sock.sendMessage(chatId, { text: '❌ Format: `.checkpaid 923xxxxxxxxx`' }, { quoted: message });

    const paid = readPaid();
    const entry = paid[phone];
    if (!entry) {
        return sock.sendMessage(chatId, { text: `📱 ${phone}\n❌ Free user — paid nahi hai.` }, { quoted: message });
    }

    const isActive = isPaidUser(phone);
    const expiryStr = entry.expiry === 'lifetime' ? 'Lifetime' : new Date(entry.expiry).toLocaleDateString('en-PK');
    const plan = PLANS[entry.plan] || { label: entry.plan };

    await sock.sendMessage(chatId, {
        text: `📱 *${phone}*\n${isActive ? '✅ Active Premium' : '⏰ Expired'}\n📦 Plan: ${plan.label}\n📅 Expiry: ${expiryStr}`
    }, { quoted: message });
}

// .pendingpay — pending payments list
async function pendingPayments(sock, chatId, message, senderIsOwner) {
    if (!senderIsOwner) return sock.sendMessage(chatId, { text: '❌ Sirf owner.' }, { quoted: message });

    const payments = readPayments().filter(p => p.status === 'pending');
    if (!payments.length) {
        return sock.sendMessage(chatId, { text: '📭 Koi pending payment nahi.' }, { quoted: message });
    }

    const list = payments.map((p, i) => 
        `${i+1}. 📱 ${p.phone}\n   📦 Plan: ${p.plan}\n   🆔 TXN: ${p.txnId}\n   ⏰ ${new Date(p.submittedAt).toLocaleString('en-PK')}`
    ).join('\n\n');

    await sock.sendMessage(chatId, {
        text: `📋 *Pending Payments (${payments.length})*\n\n${list}\n\n> .approve [number] [plan] likhein approve karne ke liye`
    }, { quoted: message });
}

module.exports = { approvePayment, rejectPayment, checkPaid, pendingPayments, isPaidUser, PLANS };
