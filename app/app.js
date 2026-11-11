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
import { initDataTools } from './features/data-tools.js';
import { initKeyboardShortcuts } from './ui/keyboard.js';
import { initSettingsButton, openSettingsModal } from './ui/settings.js';
import { loadSettings, applySettings, initReducedMotion } from './core/settings.js';

// Initialize all features
const start = async () => {
    // Load settings first (affects other features)
    await loadSettings();
    applySettings();
    initReducedMotion();

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
    initSettingsButton();
    initKeyboardShortcuts();

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