/**
 * US MOD MD — WhatsApp Bot
 * Developed & Owned by: USMAN KHAN CHACHAR
 * GitHub / Credit must remain intact. Do not remove or alter this header.
 * Unauthorized redistribution without credit is a violation of the license.
 */

// commands/anticall.js
// Warning system: 1st call = 1st warning, 2nd = 2nd warning, 3rd = block warning, 4th = AUTO BLOCK
//
// PER-SESSION (per logged-in number) settings: har WhatsApp number ka apna
// anticall on/off aur apni warnings file hoti hai, taake multi-session bot
// mein ek number ka anticall on karne se baaki numbers per asar na ho.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// sock.user.id format hota hai "923xxxxxxxxx:12@s.whatsapp.net" — sirf number nikalo
function getSessionId(sock) {
    try {
        const raw = sock?.user?.id || 'default';
        return raw.split(':')[0].split('@')[0].replace(/[^0-9]/g, '') || 'default';
    } catch {
        return 'default';
    }
}

function getAnticallPath(sessionId) {
    return path.join(DATA_DIR, `anticall_${sessionId}.json`);
}

function getWarningsPath(sessionId) {
    return path.join(DATA_DIR, `anticall_warnings_${sessionId}.json`);
}

function getAllowedPath(sessionId) {
    return path.join(DATA_DIR, `anticall_allowed_${sessionId}.json`);
}

// ─── State helpers ────────────────────────────────────────────────────────────

function readState(sock) {
    const sessionId = getSessionId(sock);
    const ANTICALL_PATH = getAnticallPath(sessionId);
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        const data = JSON.parse(fs.readFileSync(ANTICALL_PATH, 'utf8') || '{}');
        return { enabled: !!data.enabled };
    } catch {
        return { enabled: false };
    }
}

function writeState(sock, enabled) {
    const sessionId = getSessionId(sock);
    const ANTICALL_PATH = getAnticallPath(sessionId);
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch {}
}

// ─── Warning store helpers ────────────────────────────────────────────────────

function readWarnings(sock) {
    const sessionId = getSessionId(sock);
    const WARNINGS_PATH = getWarningsPath(sessionId);
    try {
        if (!fs.existsSync(WARNINGS_PATH)) return {};
        return JSON.parse(fs.readFileSync(WARNINGS_PATH, 'utf8') || '{}');
    } catch {
        return {};
    }
}

function saveWarnings(sock, data) {
    const sessionId = getSessionId(sock);
    const WARNINGS_PATH = getWarningsPath(sessionId);
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(WARNINGS_PATH, JSON.stringify(data, null, 2));
    } catch {}
}

function getWarningCount(sock, jid) {
    const w = readWarnings(sock);
    return w[jid] || 0;
}

function incrementWarning(sock, jid) {
    const w = readWarnings(sock);
    w[jid] = (w[jid] || 0) + 1;
    saveWarnings(sock, w);
    return w[jid];
}

function resetWarnings(sock, jid) {
    const w = readWarnings(sock);
    delete w[jid];
    saveWarnings(sock, w);
}

// ─── Allowed (trusted) numbers helpers ────────────────────────────────────────
// Ye numbers hamesha allowed hain — inki call reject nahi hogi, warning bhi nahi lagegi.

function readAllowed(sock) {
    const sessionId = getSessionId(sock);
    const ALLOWED_PATH = getAllowedPath(sessionId);
    try {
        if (!fs.existsSync(ALLOWED_PATH)) return [];
        const data = JSON.parse(fs.readFileSync(ALLOWED_PATH, 'utf8') || '[]');
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveAllowed(sock, list) {
    const sessionId = getSessionId(sock);
    const ALLOWED_PATH = getAllowedPath(sessionId);
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(ALLOWED_PATH, JSON.stringify(list, null, 2));
        return true;
    } catch (e) {
        console.error('❌ anticall: failed to save allowed list:', e.message);
        return false;
    }
}

// number ko normalize karo (sirf digits) taake .anticall allow 923xx / +923xx / 923xx@s.whatsapp.net sab match ho jaye
function normalizeNumber(input) {
    const str = String(input || '');
    // Pehle domain (@...) aur device-id suffix (:N) hata do, taake sirf real number bache
    const cleaned = str.split('@')[0].split(':')[0];
    return cleaned.replace(/[^0-9]/g, '');
}

function isAllowedNumber(sock, jidOrNumber) {
    const num = normalizeNumber(jidOrNumber);
    if (!num) return false;
    const list = readAllowed(sock);
    if (list.includes(num)) return true;
    // Fallback: match by last 9 digits, taake country-code / leading-zero farak se allow list fail na ho
    const numTail = num.slice(-9);
    if (numTail.length === 9 && list.some(n => n.slice(-9) === numTail)) return true;
    return false;
}

function addAllowedNumber(sock, jidOrNumber) {
    const num = normalizeNumber(jidOrNumber);
    if (!num) return false;
    const list = readAllowed(sock);
    if (!list.includes(num)) {
        list.push(num);
        return saveAllowed(sock, list);
    }
    return true; // already in the list
}

function removeAllowedNumber(sock, jidOrNumber) {
    const num = normalizeNumber(jidOrNumber);
    if (!num) return false;
    let list = readAllowed(sock);
    const before = list.length;
    list = list.filter(n => n !== num);
    saveAllowed(sock, list);
    return list.length !== before;
}

// ─── Main call handler ────────────────────────────────────────────────────────

async function handleIncomingCall(sock, callEvent) {
    try {
        const state = readState(sock);
        if (!state.enabled) return;

        // callEvent is array from sock.ev.on('call', ...)
        const calls = Array.isArray(callEvent) ? callEvent : [callEvent];

        for (const call of calls) {
            // Only act on incoming/ringing calls (not ended ones)
            if (call.status !== 'offer' && call.status !== 'ringing') continue;

            const callerJid = call.from;
            if (!callerJid) continue;

            let callerNum = callerJid.replace('@s.whatsapp.net', '').replace('@lid', '');
            let resolvedJid = callerJid;

            // 🔍 Debug: dekho asal call kis JID/format se aa rahi hai (bot console/logs mein check karo)
            console.log(`📞 Incoming call — raw JID: ${callerJid} | status: ${call.status}`);

            if (callerJid.endsWith('@lid')) {
                // WhatsApp ne is caller ko privacy-ID (@lid) se bheja hai, real number nahi.
                // Baileys apne signal store mein LID <-> real-number ki mapping rakhta hai (encryption ke liye zaroori hai) — wahi se poochte hain.
                try {
                    const pn = await sock?.signalRepository?.lidMapping?.getPNForLID?.(callerJid);
                    if (pn) {
                        resolvedJid = pn.includes('@') ? pn : `${pn}@s.whatsapp.net`;
                        callerNum = resolvedJid.replace('@s.whatsapp.net', '');
                        console.log(`🔁 @lid ${callerJid} resolve hua real number mein: ${callerNum}`);
                    } else {
                        console.log(`⚠️ @lid ${callerJid} ka real number resolve nahi ho saka — Baileys ke paas abhi mapping nahi hai. Allow list is call ke liye kaam nahi karegi.`);
                    }
                } catch (e) {
                    console.log(`⚠️ LID resolve karte waqt error: ${e.message}`);
                }
            }

            // ✅ Agar number allowed/trusted list mein hai to call jaane do — reject/warning skip
            if (isAllowedNumber(sock, resolvedJid) || (resolvedJid !== callerJid && isAllowedNumber(sock, callerJid))) {
                console.log(`✅ Allowed number ${callerNum} — call not blocked`);
                continue;
            }

            // Reject the call first
            try {
                await sock.rejectCall(call.id, callerJid);
            } catch (e) {
                console.error('Call reject error:', e.message);
            }

            // Increment warning
            const count = incrementWarning(sock, callerJid);

            console.log(`📵 Call from ${callerNum} — Warning ${count}/4`);

            if (count === 1) {
                // ── 1st warning ──
                await sock.sendMessage(callerJid, {
                    text:
                        `⚠️ *Warning 1/3*\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `📵 Calling this number is *not allowed.*\n\n` +
                        `Please *do not call* again.\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `_2 more warnings before you are blocked._`
                });

            } else if (count === 2) {
                // ── 2nd warning ──
                await sock.sendMessage(callerJid, {
                    text:
                        `⚠️ *Warning 2/3*\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `📵 You called *again* after a warning!\n\n` +
                        `This is your *second warning.*\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `🚨 *One more call and you will be BLOCKED.*`
                });

            } else if (count === 3) {
                // ── 3rd warning — final warning ──
                await sock.sendMessage(callerJid, {
                    text:
                        `🚨 *FINAL WARNING — 3/3*\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `❌ You have been warned *3 times.*\n\n` +
                        `If you call *one more time,* you will be\n` +
                        `*AUTOMATICALLY BLOCKED* with no further warning.\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `_This is your last chance._`
                });

            } else if (count >= 4) {
                // ── 4th call → AUTO BLOCK ──
                await sock.sendMessage(callerJid, {
                    text:
                        `🔴 *You have been BLOCKED!*\n` +
                        `━━━━━━━━━━━━━━━━━━\n` +
                        `You ignored all 3 warnings and called again.\n` +
                        `You are now *permanently blocked.*\n` +
                        `━━━━━━━━━━━━━━━━━━`
                });

                // Block the user
                try {
                    await sock.updateBlockStatus(callerJid, 'block');
                    console.log(`🔴 AUTO BLOCKED: ${callerNum} after ${count} calls`);
                } catch (blockErr) {
                    console.error('Block error:', blockErr.message);
                }

                // Reset warnings after block (clean slate if unblocked later)
                resetWarnings(sock, callerJid);
            }
        }
    } catch (e) {
        console.error('handleIncomingCall error:', e.message);
    }
}

// ─── .anticall command ────────────────────────────────────────────────────────

async function anticallCommand(sock, chatId, message, args) {
    const state = readState(sock);
    const sub = (args || '').trim().toLowerCase();

    if (sub === 'status') {
        const warnings = readWarnings(sock);
        const warnCount = Object.keys(warnings).length;
        await sock.sendMessage(chatId, {
            text:
                `📵 *Anticall Status*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `Status: *${state.enabled ? '✅ ON' : '❌ OFF'}*\n` +
                `Tracked callers: *${warnCount}*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `_Warning system: 3 warnings → auto block on 4th call_`
        }, { quoted: message });
        return;
    }

    if (sub === 'on') {
        writeState(sock, true);
        await sock.sendMessage(chatId, {
            text:
                `✅ *Anticall ENABLED*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📵 Calls will be rejected automatically.\n\n` +
                `⚠️ *Warning system active:*\n` +
                `• 1st call → Warning 1\n` +
                `• 2nd call → Warning 2\n` +
                `• 3rd call → Final warning\n` +
                `• 4th call → 🔴 Auto Block\n` +
                `━━━━━━━━━━━━━━━━━━`
        }, { quoted: message });
        return;
    }

    if (sub === 'off') {
        writeState(sock, false);
        await sock.sendMessage(chatId, {
            text: `❌ *Anticall DISABLED*\nCalls will no longer be blocked.`
        }, { quoted: message });
        return;
    }

    if (sub.startsWith('allow ')) {
        const target = sub.replace('allow', '').trim();
        if (!normalizeNumber(target)) {
            await sock.sendMessage(chatId, { text: `❗ Number number likho.\n Misaal: \`.anticall allow 923001234567\`` }, { quoted: message });
            return;
        }
        const ok = addAllowedNumber(sock, target);
        if (!ok) {
            await sock.sendMessage(chatId, {
                text: `❌ *${normalizeNumber(target)}* ko save nahi kar saka — data folder likhne mein masla hai. Console/log check karo.`
            }, { quoted: message });
            return;
        }
        resetWarnings(sock, `${normalizeNumber(target)}@s.whatsapp.net`);
        await sock.sendMessage(chatId, {
            text: `✅ *${normalizeNumber(target)}* ab allowed hai — is number ki call reject/warning nahi hogi.`
        }, { quoted: message });
        return;
    }

    if (sub.startsWith('unallow ')) {
        const target = sub.replace('unallow', '').trim();
        const removed = removeAllowedNumber(sock, target);
        await sock.sendMessage(chatId, {
            text: removed
                ? `🗑️ *${normalizeNumber(target)}* allowed list se hata diya gaya.`
                : `❗ Ye number allowed list mein nahi mila.`
        }, { quoted: message });
        return;
    }

    if (sub === 'allowed') {
        const list = readAllowed(sock);
        await sock.sendMessage(chatId, {
            text: list.length
                ? `✅ *Allowed Numbers*\n━━━━━━━━━━━━━━━━━━\n${list.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
                : `📵 Koi allowed number nahi hai.\nAdd karne ke liye: \`.anticall allow <number>\``
        }, { quoted: message });
        return;
    }

    if (sub === 'reset') {
        // Reset all warnings for THIS session only (owner utility)
        saveWarnings(sock, {});
        await sock.sendMessage(chatId, {
            text: `🔄 All anticall warnings have been reset.`
        }, { quoted: message });
        return;
    }

    // Help menu
    await sock.sendMessage(chatId, {
        text:
            `📵 *Anticall Commands*\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `• \`.anticall on\`  — Enable\n` +
            `• \`.anticall off\` — Disable\n` +
            `• \`.anticall status\` — Show status\n` +
            `• \`.anticall allow <number>\` — Trusted number (call jayegi)\n` +
            `• \`.anticall unallow <number>\` — Trusted list se hatao\n` +
            `• \`.anticall allowed\` — Allowed numbers dikhao\n` +
            `• \`.anticall reset\` — Clear all warnings\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `_Warning system: 3 warnings → auto block 4th call_`
    }, { quoted: message });
}

module.exports = {
    anticallCommand,
    readState,
    handleIncomingCall,
    isAllowedNumber,
    addAllowedNumber,
    removeAllowedNumber,
    readAllowed
};
