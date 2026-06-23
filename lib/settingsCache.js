/**
 * US MOD MD V1 - Settings Cache (lightweight)
 */
import { getSettings, getSudoUsers, getBannedUsers, getAllowedUsers,
         registerSettingsListener, registerSudoListener, registerBannedListener } from '../database/config.js';

const _DEFAULTS = { device: 'android', prefix: '.', mode: 'public', warn_limit: 3 };
let _s = null, _su = null, _b = null, _al = null;

registerSettingsListener(() => { _s = null; });
registerSudoListener(() => { _su = null; });
registerBannedListener(() => { _b = null; });

export async function getCachedSettings() {
    if (!_s) _s = await getSettings().catch(() => _DEFAULTS);
    return _s || _DEFAULTS;
}
export async function getCachedSudo() {
    if (!_su) _su = await getSudoUsers().catch(() => []);
    return _su || [];
}
export async function getCachedBanned() {
    if (!_b) _b = await getBannedUsers().catch(() => []);
    return _b || [];
}
export async function getCachedAllowed() {
    if (!_al) _al = await getAllowedUsers().catch(() => []);
    return _al || [];
}
export function getCachedSettingsSync() { return _s || _DEFAULTS; }
export function getCachedSudoSync() { return _su || []; }
export function getCachedBannedSync() { return _b || []; }
export function invalidateSettings() { _s = null; }
export function invalidateSudo() { _su = null; }
export function invalidateBanned() { _b = null; }
export function invalidateAllowed() { _al = null; }
