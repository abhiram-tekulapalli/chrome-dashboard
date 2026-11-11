/**
 * AURA ULTRA PREMIUM - Main Application Bootstrapper
 * Initializes all features and coordinates cross-feature dependencies
 */

import { initLinkModal } from './ui/modal.js';
import { initClock } from './features/clock.js';
import { initCalendar } from './features/calendar.js';
import { initTheme } from './features/theme.js';
import { initSearch } from './features/search.js';
import { initLinks } from './features/links.js';
import { initTasks } from './features/tasks.js';
import { initNotes } from './features/notes.js';
import { initPomodoro } from './features/pomodoro.js';
import { initSpeedTest } from './features/speedtest.js';
import { initDataTools } from './features/data-tools.js';
import { initKeyboardShortcuts } from './ui/keyboard.js';
import { initSettingsButton, openSettingsModal } from './ui/settings.js';
import { initCheatsheet } from './ui/cheatsheet.js';
import { loadSettings, applySettings, initReducedMotion } from './core/settings.js';
import { setThemeState, getThemeState } from './features/theme.js';

// Initialize all features
const start = async () => {
    // Load settings first (affects other features)
    await loadSettings();
    applySettings();
    initReducedMotion();

    // Sync theme with settings
    const settings = await import('./core/settings.js');
    const savedTheme = settings.getSetting('theme');
    if (savedTheme) {
        setThemeState(savedTheme === 'dark');
    }

    // UI foundations first
    initLinkModal();
    initClock();
    initCalendar();

    // Core features
    await initTheme();
    await initSearch();
    await initLinks();
    await initTasks();
    await initNotes();
    await initPomodoro();

    // Tools & shortcuts
    initDataTools();
    initSpeedTest();
    initSettingsButton();
    initKeyboardShortcuts();
    initCheatsheet();

    console.log('Aura Ultra Premium initialized');
};

// Expose settings modal for keyboard shortcuts
window.__auraOpenSettings = openSettingsModal;

// Start on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    start().catch((err) => {
        console.error('Aura failed to initialize:', err);
    });
});