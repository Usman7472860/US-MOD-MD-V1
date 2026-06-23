/**
 * US MOD MD V1 - Lightweight In-Memory Database
 * No SQLite/PostgreSQL needed - uses Maps for storage
 * Data resets on restart (stateless hosting compatible)
 */

// ── In-memory stores ──
const _settings = {
    device: 'android',
    prefix: '.',
    mode: 'public',
    warn_limit: 3,
    packname: 'US MOD MD V1',
    author: 'Usman',
    multiprefix: false,
    stealth: false,
    autoview: false,
    autoai: false,
    autoread: false,
    autolike: false,
    anticall: false,
    antiviewonce: false,
    antidelete: true,
    antilink: 'off',
    chatbotpm: false,
};

const _sudo = new Set();
const _banned = new Set();
const _groupSettings = new Map();   // groupJid -> { antilink, welcome, goodbye, ... }
const _warns = new Map();           // `${groupJid}:${userJid}` -> count
const _allowed = new Set();

const _settingsListeners = [];
const _sudoListeners = [];
const _bannedListeners = [];

// ── Settings ──
export async function getSettings() { return { ..._settings }; }
export async function updateSettings(key, value) {
    _settings[key] = value;
    _settingsListeners.forEach(fn => fn());
}
export function registerSettingsListener(fn) { _settingsListeners.push(fn); }

// ── Sudo ──
export async function getSudoUsers() { return [..._sudo]; }
export async function addSudo(jid) { _sudo.add(jid); _sudoListeners.forEach(fn => fn()); }
export async function removeSudo(jid) { _sudo.delete(jid); _sudoListeners.forEach(fn => fn()); }
export function registerSudoListener(fn) { _sudoListeners.push(fn); }

// ── Banned ──
export async function getBannedUsers() { return [..._banned]; }
export async function banUser(jid) { _banned.add(jid); _bannedListeners.forEach(fn => fn()); }
export async function unbanUser(jid) { _banned.delete(jid); _bannedListeners.forEach(fn => fn()); }
export function registerBannedListener(fn) { _bannedListeners.push(fn); }

// ── Allowed users ──
export async function getAllowedUsers() { return [..._allowed]; }
export async function addAllowedUser(jid) { _allowed.add(jid); }
export async function removeAllowedUser(jid) { _allowed.delete(jid); }

// ── Group settings ──
export async function getGroupSettings(groupJid) {
    if (!_groupSettings.has(groupJid)) {
        _groupSettings.set(groupJid, {
            antilink: false, welcome: false, goodbye: false,
            antitag: false, antiforeign: false, warn_limit: 3,
            gcpresence: false, autoai: false,
        });
    }
    return { ..._groupSettings.get(groupJid) };
}
export async function updateGroupSetting(groupJid, key, value) {
    const current = await getGroupSettings(groupJid);
    current[key] = value;
    _groupSettings.set(groupJid, current);
}

// ── Warn system ──
export async function getWarnCount(groupJid, userJid) {
    return _warns.get(`${groupJid}:${userJid}`) || 0;
}
export async function addWarn(groupJid, userJid) {
    const key = `${groupJid}:${userJid}`;
    const current = _warns.get(key) || 0;
    _warns.set(key, current + 1);
    return current + 1;
}
export async function resetWarn(groupJid, userJid) {
    _warns.delete(`${groupJid}:${userJid}`);
}
export async function getWarnLimit(groupJid) {
    const gs = await getGroupSettings(groupJid);
    return gs.warn_limit || _settings.warn_limit || 3;
}
export async function setWarnLimit(groupJid, limit) {
    await updateGroupSetting(groupJid, 'warn_limit', limit);
}
