/**
 * AURA ULTRA PREMIUM - Settings Management
 * User preferences with persistence
 */

import { Storage } from './storage.js';
import { CONFIG } from './config.js';

// Default settings
export const DEFAULT_SETTINGS = {
    clockFormat: '12h',           // '12h' | '24h'
    pomodoroFocusDuration: 25,    // minutes
    pomodoroBreakDuration: 5,     // minutes
    animationsEnabled: true,      // boolean
    theme: 'dark'                 // 'dark' | 'light' (synced with theme module)
};

const SETTINGS_KEY = CONFIG.keys.settings;

let currentSettings = { ...DEFAULT_SETTINGS };

export const loadSettings = async () => {
    const stored = await Storage.getJSON(SETTINGS_KEY, null);
    if (stored && typeof stored === 'object') {
        currentSettings = { ...DEFAULT_SETTINGS, ...stored };
    }
    return currentSettings;
};

export const saveSettings = async (partialSettings) => {
    currentSettings = { ...currentSettings, ...partialSettings };
    await Storage.setJSON(SETTINGS_KEY, currentSettings);
    return currentSettings;
};

export const getSettings = () => ({ ...currentSettings });

export const getSetting = (key) => currentSettings[key];

// Apply settings to document (for CSS-based settings)
export const applySettings = () => {
    document.documentElement.style.setProperty('--animations-enabled', currentSettings.animationsEnabled ? '1' : '0');
};

// Initialize reduced motion from settings
export const initReducedMotion = () => {
    if (!currentSettings.animationsEnabled) {
        document.documentElement.classList.add('reduced-motion');
    }
};