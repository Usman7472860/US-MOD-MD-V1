// commands/tempban.js  — Fixed: @lid JID handling + DM on ban/unban
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/tempbans.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function loadTempBans() {
    try {
        if (!fs.existsSync(DATA_FILE)) return {};
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch { return {}; }
}

function saveTempBans(data) {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    } catch (e) { console.error('TempBan save error:', e.message); }
}

function parseMinutes(text) {
    if (!text) return null;
    text = text.trim().toLowerCase();
    let total = 0;
    const days    = text.match(/(\d+)\s*d/);
    const hours   = text.match(/(\d+)\s*h/);
    const minutes = text.match(/(\d+)\s*m(?!s)/);
    const plain   = text.match(/^(\d+)$/);
    if (days)    total += parseInt(days[1])    * 1440;
    if (hours)   total += parseInt(hours[1])   * 60;
    if (minutes) total += parseInt(minutes[1]);
    if (plain)   total  = parseInt(plain[1]);
    return total > 0 ? total : null;
}

function formatDuration(minutes) {
    if (minutes < 60)   return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (minutes < 1440) {
        const h = Math.floor(minutes / 60), m = minutes % 60;
        return m > 0 ? `${h}h ${m}m` : `${h} hour${h !== 1 ? 's' : ''}`;
    }
    const d = Math.floor(minutes / 1440), rem = minutes % 1440;
    const h = Math.floor(rem / 60);
    return h > 0 ? `${d}d ${h}h` : `${d} day${d !== 1 ? 's' : ''}`;
}

// ─── KEY FIX: Resolve @lid → @s.whatsapp.net for re-add ──────────────────────
// WhatsApp now uses @lid (linked-device IDs) internally, but groupParticipantsUpdate
// requires the real @s.whatsapp.net JID. We get the real JID from group metadata.

async function resolveRealJid(sock, groupId, lidJid) {
    try {
        if (!lidJid.includes('@lid')) return lidJid; // already real JID
        const meta = await sock.groupMetadata(groupId);
        const participant = meta.participants.find(p =>
            p.id === lidJid || p.lid === lidJid
        );
        if (participant) {
            // Return the non-lid JID
            return participant.id.includes('@lid') ? (participant.lid || lidJid) : participant.id;
        }
        // Fallback: try converting lid number to s.whatsapp.net
        const num = lidJid.replace('@lid', '').replace(/[^0-9]/g, '');
        if (num.length > 5) return `${num}@s.whatsapp.net`;
        return lidJid;
    } catch (e) {
        console.error('resolveRealJid error:', e.message);
        return lidJid;
    }
}

// ─── Re-add with retry + @lid fix ────────────────────────────────────────────

async function reAddUser(sock, groupId, userJid) {
    // Try both the original JID and resolved real JID
    const jidsToTry = [userJid];

    // If it's a @lid JID, also try resolving it
    if (userJid.includes('@lid')) {
        // Try to get the phone number from stored data or convert
        const num = userJid.replace('@lid', '').split(':')[0];
        if (num && num.length > 5) {
            jidsToTry.push(`${num}@s.whatsapp.net`);
        }
    }

    for (const jid of jidsToTry) {
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                if (attempt > 0) await new Promise(r => setTimeout(r, 3000 * attempt));

                console.log(`🔄 Re-add attempt ${attempt + 1} for ${jid}`);
                const result = await sock.groupParticipantsUpdate(groupId, [jid], 'add');

                const status = result?.[0]?.status;
                console.log(`📊 Re-add status: ${status} for ${jid}`);

                if (status === 200 || status === '200') {
                    console.log(`✅ Successfully re-added ${jid}`);
                    return { success: true, jid };
                }
                if (status === 403 || status === '403') {
                    // Privacy settings — send invite link instead
                    try {
                        const inviteCode = await sock.groupInviteCode(groupId);
                        await sock.sendMessage(jid, {
                            text: `✅ *Your tempban has expired!*\n\nYou can rejoin the group:\nhttps://chat.whatsapp.com/${inviteCode}`
                        });
                    } catch (_) {}
                    return { success: false, reason: 'privacy', jid };
                }
                if (status === 408 || status === '408') {
                    return { success: false, reason: 'not_on_whatsapp', jid };
                }
                if (status === 409 || status === '409') {
                    // Already in group
                    return { success: true, jid };
                }
                // Any other non-200: try next JID variant
                break;

            } catch (err) {
                console.error(`Re-add error (attempt ${attempt + 1}, ${jid}):`, err.message);
                if (err.message?.includes('not-authorized') || err.message?.includes('forbidden')) {
                    return { success: false, reason: 'bot_not_admin' };
                }
                // bad-request: try next JID
                if (err.message?.includes('bad-request') || err.message?.includes('bad_request')) {
                    break; // try next jid variant
                }
            }
        }
    }

    // All JID variants failed — send invite link as last resort
    try {
        const inviteCode = await sock.groupInviteCode(groupId);
        await sock.sendMessage(userJid, {
            text: `✅ *Your tempban has expired!*\n\nWe couldn't re-add you automatically. Please rejoin:\nhttps://chat.whatsapp.com/${inviteCode}`
        });
    } catch (_) {}

    return { success: false, reason: 'bad_request_all_failed' };
}

// ─── DM banned user ───────────────────────────────────────────────────────────

async function dmBannedUser(sock, userJid, groupId, minutes, reason) {
    try {
        const duration = formatDuration(minutes);
        await sock.sendMessage(userJid, {
            text:
                `⛔ *You have been temporarily removed!*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📋 *Reason:* ${reason || 'Violated group rules'}\n` +
                `⏱️ *Duration:* ${duration}\n` +
                `🔄 *You will be re-added automatically after ${duration}.*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `_Please follow group rules when you return._`
        });
        console.log(`📩 DM sent to ${userJid}`);
    } catch (e) {
        console.error('DM to banned user failed:', e.message);
    }
}

// ─── Schedule restore ─────────────────────────────────────────────────────────

function scheduleTempBanRestore(sock, userJid, groupId, minutes, banId, realJid) {
    const ms = minutes * 60 * 1000;
    setTimeout(async () => {
        try {
            const bans = loadTempBans();
            if (!bans[banId]) {
                console.log(`ℹ️ Tempban ${banId} already cleared.`);
                return;
            }

            console.log(`⏰ Tempban expired for ${userJid}, re-adding...`);

            // Use stored realJid if available, else try resolving
            const jidToAdd = realJid || userJid;
            const result = await reAddUser(sock, groupId, jidToAdd);

            if (result.success) {
                await sock.sendMessage(groupId, {
                    text: `✅ @${(result.jid || jidToAdd).replace('@s.whatsapp.net','').replace('@lid','')} has been re-added after their tempban expired.`,
                    mentions: [result.jid || jidToAdd]
                }).catch(() => {});
                await sock.sendMessage(jidToAdd, {
                    text: `✅ *Your temporary ban has expired!*\nYou have been re-added to the group. Please follow the rules. 🙏`
                }).catch(() => {});
            } else if (result.reason !== 'privacy') {
                await sock.sendMessage(groupId, {
                    text: `⚠️ Tempban expired for @${jidToAdd.replace('@s.whatsapp.net','').replace('@lid','')} but couldn't re-add them (${result.reason}). Please add manually.`,
                    mentions: [jidToAdd]
                }).catch(() => {});
            }

            delete bans[banId];
            saveTempBans(bans);
        } catch (e) {
            console.error('Restore tempban error:', e.message);
        }
    }, ms);

    console.log(`⏱️ Scheduled re-add for ${userJid} in ${minutes} min`);
}

// ─── Main .tempban command ────────────────────────────────────────────────────

async function tempbanCommand(sock, chatId, message, senderId, isSenderAdmin, isBotAdmin) {
    try {
        if (!chatId.endsWith('@g.us')) {
            return await sock.sendMessage(chatId, { text: '❌ Groups only.' }, { quoted: message });
        }
        if (!isSenderAdmin) {
            return await sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });
        }
        if (!isBotAdmin) {
            return await sock.sendMessage(chatId, { text: '❌ Make bot an admin first.' }, { quoted: message });
        }

        const text = (
            message.message?.conversation ||
            message.message?.extendedTextMessage?.text || ''
        ).trim();
        const parts = text.split(/\s+/);

        // Get target JID (mention or quoted message)
        let targetJid = null;
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length > 0) {
            targetJid = mentioned[0];
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            targetJid = message.message.extendedTextMessage.contextInfo.participant;
        } else {
            const numMatch = parts[1]?.replace(/[^0-9]/g, '');
            if (numMatch && numMatch.length > 5) targetJid = `${numMatch}@s.whatsapp.net`;
        }

        if (!targetJid) {
            return await sock.sendMessage(chatId, {
                text: '❌ Mention a user or reply to their message.\n\nUsage: `.tempban @user 10m reason`'
            }, { quoted: message });
        }
        if (targetJid === senderId) {
            return await sock.sendMessage(chatId, { text: '❌ Cannot tempban yourself.' }, { quoted: message });
        }

        // Parse duration
        let durationMin = null, durationIndex = -1;
        for (let i = 1; i < parts.length; i++) {
            const parsed = parseMinutes(parts[i]);
            if (parsed) { durationMin = parsed; durationIndex = i; break; }
        }
        if (!durationMin) {
            return await sock.sendMessage(chatId, {
                text: '❌ Specify duration.\n\nExamples:\n`.tempban @user 10m`\n`.tempban @user 2h spam`\n`.tempban @user 1d violation`'
            }, { quoted: message });
        }

        const reason = parts.slice(durationIndex + 1).join(' ') || 'Violated group rules';
        const duration = formatDuration(durationMin);
        const targetNum = targetJid.replace('@s.whatsapp.net', '').replace('@lid', '').split(':')[0];

        // Resolve real JID now (before removing, they're still in group)
        let realJid = targetJid;
        try {
            const meta = await sock.groupMetadata(chatId);
            const participant = meta.participants.find(p => p.id === targetJid || p.lid === targetJid);
            if (participant) {
                realJid = participant.id.includes('@lid') ? (participant.lid || targetJid) : participant.id;
                console.log(`🔍 Resolved ${targetJid} → ${realJid}`);
            }
        } catch (e) { console.error('Metadata fetch error:', e.message); }

        // Step 1: DM user before removing
        await dmBannedUser(sock, realJid, chatId, durationMin, reason);

        // Step 2: Remove from group
        try {
            await sock.groupParticipantsUpdate(chatId, [targetJid], 'remove');
        } catch (removeErr) {
            console.error('Remove error:', removeErr.message);
            // Try with realJid
            if (realJid !== targetJid) {
                await sock.groupParticipantsUpdate(chatId, [realJid], 'remove');
            }
        }

        // Step 3: Announce in group
        await sock.sendMessage(chatId, {
            text:
                `⛔ *Temporary Ban Issued*\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `👤 *User:* @${targetNum}\n` +
                `⏱️ *Duration:* ${duration}\n` +
                `📋 *Reason:* ${reason}\n` +
                `🔄 *Auto re-add after ${duration}.*\n` +
                `━━━━━━━━━━━━━━━━━━`,
            mentions: [targetJid]
        }, { quoted: message });

        // Step 4: Save & schedule
        const banId = `${Date.now()}_${targetNum}`;
        const bans = loadTempBans();
        bans[banId] = {
            userJid: targetJid,
            realJid,
            groupId: chatId,
            minutes: durationMin,
            reason,
            bannedAt: Date.now(),
            expiresAt: Date.now() + durationMin * 60 * 1000
        };
        saveTempBans(bans);
        scheduleTempBanRestore(sock, targetJid, chatId, durationMin, banId, realJid);

    } catch (e) {
        console.error('tempbanCommand error:', e.message);
        await sock.sendMessage(chatId, { text: `❌ Tempban failed: ${e.message}` }, { quoted: message });
    }
}

// ─── .untempban ───────────────────────────────────────────────────────────────

async function untempbanCommand(sock, chatId, message, senderId, isSenderAdmin, isBotAdmin) {
    try {
        if (!isSenderAdmin) {
            return await sock.sendMessage(chatId, { text: '❌ Admins only.' }, { quoted: message });
        }

        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (!mentioned[0]) {
            return await sock.sendMessage(chatId, {
                text: '❌ Mention the user: `.untempban @user`'
            }, { quoted: message });
        }
        const targetJid = mentioned[0];

        const bans = loadTempBans();
        let foundBan = null;
        let foundBanId = null;
        for (const [banId, ban] of Object.entries(bans)) {
            if ((ban.userJid === targetJid || ban.realJid === targetJid) && ban.groupId === chatId) {
                foundBan = ban;
                foundBanId = banId;
            }
        }

        if (!foundBan) {
            return await sock.sendMessage(chatId, {
                text: `⚠️ No active tempban for @${targetJid.replace('@s.whatsapp.net','').replace('@lid','')}`,
                mentions: [targetJid]
            }, { quoted: message });
        }

        delete bans[foundBanId];
        saveTempBans(bans);

        const result = await reAddUser(sock, chatId, foundBan.realJid || targetJid);
        const num = targetJid.replace('@s.whatsapp.net','').replace('@lid','').split(':')[0];

        if (result.success) {
            await sock.sendMessage(chatId, {
                text: `✅ @${num} untempbanned and re-added.`,
                mentions: [targetJid]
            }, { quoted: message });
            await sock.sendMessage(foundBan.realJid || targetJid, {
                text: `✅ *Your tempban was lifted early!*\nYou've been re-added. Please follow the rules. 🙏`
            }).catch(() => {});
        } else {
            await sock.sendMessage(chatId, {
                text: `⚠️ @${num} untempbanned but couldn't re-add (${result.reason}). Add manually.`,
                mentions: [targetJid]
            }, { quoted: message });
        }
    } catch (e) {
        console.error('untempbanCommand error:', e.message);
        await sock.sendMessage(chatId, { text: `❌ Untempban failed: ${e.message}` }, { quoted: message });
    }
}

// ─── Restore on bot restart ───────────────────────────────────────────────────

async function restorePendingTempBans(sock) {
    try {
        const bans = loadTempBans();
        const now = Date.now();
        let count = 0;

        for (const [banId, ban] of Object.entries(bans)) {
            const remaining = ban.expiresAt - now;
            if (remaining <= 0) {
                console.log(`🔄 Expired tempban on restart, re-adding ${ban.realJid || ban.userJid}`);
                const result = await reAddUser(sock, ban.groupId, ban.realJid || ban.userJid);
                if (result.success) {
                    await sock.sendMessage(ban.realJid || ban.userJid, {
                        text: `✅ *Your temporary ban has expired!*\nYou've been re-added. Please follow the rules. 🙏`
                    }).catch(() => {});
                }
                delete bans[banId];
                saveTempBans(bans);
            } else {
                const remainMin = Math.ceil(remaining / 60000);
                scheduleTempBanRestore(sock, ban.userJid, ban.groupId, remainMin, banId, ban.realJid);
                count++;
            }
        }
        if (count > 0) console.log(`✅ Restored ${count} pending tempban(s)`);
    } catch (e) {
        console.error('restorePendingTempBans error:', e.message);
    }
}

module.exports = { tempbanCommand, untempbanCommand, restorePendingTempBans };
