/**
 * AURA ULTRA PREMIUM - Background Service Worker
 * Handles extension lifecycle, alarms, and future sync capabilities
 */

// Extension install/update
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('Aura Ultra Premium installed');
        // Set default settings on first install
        chrome.storage.local.set({
            aura_theme: 'dark',
            aura_search_engine: 'google'
        });
    } else if (details.reason === 'update') {
        console.log('Aura Ultra Premium updated to', chrome.runtime.getManifest().version);
    }
});

// Handle alarms (for future: periodic sync, data backup reminders)
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log('Alarm fired:', alarm.name);
    // Future: trigger sync, backup reminders, etc.
});

// Keep service worker alive for short periods if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ping') {
        sendResponse({ status: 'alive' });
    }
    return true; // Keep channel open for async response
});

// Badge management (optional: show notification count, etc.)
const updateBadge = (text) => {
    chrome.action.setBadgeText({ text: text || '' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });
};

console.log('Aura background service worker started');