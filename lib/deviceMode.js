export async function getDeviceMode() {
    const val = (process.env.DEVICE || 'android').toLowerCase().trim();
    return val === 'ios' ? 'ios' : 'android';
}
