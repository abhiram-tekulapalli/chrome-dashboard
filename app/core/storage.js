/**
 * AURA ULTRA PREMIUM - Storage Abstraction
 * Chrome storage + localStorage fallback with migration
 */

const hasChromeStorage =
    typeof chrome !== 'undefined' &&
    chrome.storage &&
    chrome.storage.local &&
    typeof chrome.storage.local.get === 'function';

const readLocal = (key) => localStorage.getItem(key);
const writeLocal = (key, value) => localStorage.setItem(key, value);

const getChromeValue = async (key) => {
    if (!hasChromeStorage) return undefined;
    try {
        const result = await chrome.storage.local.get([key]);
        return result[key];
    } catch {
        return undefined;
    }
};

const setChromeValue = async (key, value) => {
    if (!hasChromeStorage) return;
    try {
        await chrome.storage.local.set({ [key]: value });
    } catch {
        // Keep UI functional if extension storage fails
    }
};

export const removeStoredKey = async (key) => {
    if (hasChromeStorage) {
        try {
            await chrome.storage.local.remove(key);
        } catch {
            // ignore
        }
    }
    localStorage.removeItem(key);
};

export const Storage = {
    async getString(key, fallback = '') {
        const chromeValue = await getChromeValue(key);
        if (typeof chromeValue === 'string') return chromeValue;
        if (chromeValue !== undefined && chromeValue !== null) return String(chromeValue);

        const legacy = readLocal(key);
        if (legacy !== null) {
            await setChromeValue(key, legacy);
            return legacy;
        }
        return fallback;
    },

    async setString(key, value) {
        await setChromeValue(key, value);
        writeLocal(key, value);
    },

    async getNumber(key, fallback = 0) {
        const chromeValue = await getChromeValue(key);
        if (typeof chromeValue === 'number' && Number.isFinite(chromeValue)) return chromeValue;
        if (typeof chromeValue === 'string') {
            const parsed = Number.parseInt(chromeValue, 10);
            if (Number.isFinite(parsed)) return parsed;
        }

        const legacy = readLocal(key);
        if (legacy !== null) {
            const parsed = Number.parseInt(legacy, 10);
            if (Number.isFinite(parsed)) {
                await setChromeValue(key, parsed);
                return parsed;
            }
        }
        return fallback;
    },

    async setNumber(key, value) {
        await setChromeValue(key, value);
        writeLocal(key, String(value));
    },

    async getJSON(key, fallback) {
        const chromeValue = await getChromeValue(key);
        if (chromeValue !== undefined) return chromeValue;

        const legacy = readLocal(key);
        if (legacy !== null) {
            try {
                const parsed = JSON.parse(legacy);
                await setChromeValue(key, parsed);
                return parsed;
            } catch {
                return fallback;
            }
        }
        return fallback;
    },

    async setJSON(key, value) {
        await setChromeValue(key, value);
        writeLocal(key, JSON.stringify(value));
    },

    remove: removeStoredKey
};