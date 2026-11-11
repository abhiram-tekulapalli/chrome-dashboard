/**
 * AURA ULTRA PREMIUM - Pomodoro Popup Window
 * Detachable timer window that syncs with main page
 */

import { Storage } from '../core/storage.js';
import { CONFIG } from '../core/config.js';

const DOM = {
    badge: document.getElementById('pomo-popup-mode-badge'),
    time: document.getElementById('pomo-popup-time'),
    btnStart: document.getElementById('pomo-popup-start'),
    btnReset: document.getElementById('pomo-popup-reset'),
    btnMode: document.getElementById('pomo-popup-mode'),
    btnClose: document.getElementById('pomo-popup-close'),
    body: document.querySelector('.pomo-popup-body'),
    header: document.querySelector('.pomo-popup-header'),
    dragHandle: document.querySelector('.pomo-popup-drag')
};

let state = {
    mode: 'focus',
    isRunning: false,
    endAt: null,
    timeLeft: 25 * 60
};

let syncInterval = null;
let focusDuration = 25 * 60;
let breakDuration = 5 * 60;

// Load settings from storage
const loadSettings = async () => {
    const settings = await Storage.getJSON(CONFIG.keys.settings, {});
    focusDuration = (settings.pomodoroFocusDuration || 25) * 60;
    breakDuration = (settings.pomodoroBreakDuration || 5) * 60;
};

const durationForMode = (mode) => mode === 'break' ? breakDuration : focusDuration;

const persist = async () => {
    await Storage.setJSON(CONFIG.keys.pomoState, {
        mode: state.mode,
        isRunning: state.isRunning,
        endAt: state.endAt,
        timeLeft: state.timeLeft
    });
    // Notify main page
    chrome.runtime.sendMessage({ type: 'POMO_SYNC', payload: state });
};

const updateDisplay = () => {
    const safeTime = Math.max(0, Math.floor(state.timeLeft));
    const min = Math.floor(safeTime / 60).toString().padStart(2, '0');
    const sec = (safeTime % 60).toString().padStart(2, '0');
    DOM.time.textContent = `${min}:${sec}`;
    DOM.btnStart.textContent = state.isRunning ? 'Pause' : 'Start';
    DOM.btnMode.textContent = state.mode === 'focus' ? 'Break' : 'Focus';
    DOM.badge.textContent = state.mode === 'focus' ? 'Focus' : 'Break';
    DOM.badge.className = 'pomo-popup-mode ' + (state.mode === 'focus' ? 'focus' : 'break');
};

const stopSyncInterval = () => {
    if (syncInterval) {
        clearInterval(syncInterval);
        syncInterval = null;
    }
};

const notifyCompletion = async (message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            new Notification('Aura Focus Timer', { body: message });
        } catch { /* ignore */ }
    }
};

const completeSession = async () => {
    const finishedMode = state.mode;
    state.isRunning = false;
    state.endAt = null;
    stopSyncInterval();

    state.mode = finishedMode === 'focus' ? 'break' : 'focus';
    state.timeLeft = durationForMode(state.mode);
    updateDisplay();
    await persist();

    const message = finishedMode === 'focus'
        ? 'Focus session complete. Time for a short break.'
        : 'Break complete. Back to focus.';
    await notifyCompletion(message);
};

const syncRunningTimer = async () => {
    if (!state.isRunning || !state.endAt) return;

    const remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    if (remaining !== state.timeLeft) {
        state.timeLeft = remaining;
        updateDisplay();
        await persist();
    }

    if (remaining <= 0) {
        await completeSession();
    }
};

const startTimer = async () => {
    if (state.isRunning) return;
    state.isRunning = true;
    state.endAt = Date.now() + (state.timeLeft * 1000);
    stopSyncInterval();
    syncInterval = setInterval(syncRunningTimer, 1000);
    updateDisplay();
    await persist();
};

const pauseTimer = async () => {
    if (!state.isRunning) return;
    const remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
    state.timeLeft = remaining;
    state.isRunning = false;
    state.endAt = null;
    stopSyncInterval();
    updateDisplay();
    await persist();
};

const resetTimer = async () => {
    state.isRunning = false;
    state.endAt = null;
    stopSyncInterval();
    state.timeLeft = durationForMode(state.mode);
    updateDisplay();
    await persist();
};

const switchMode = async () => {
    if (state.isRunning) return; // Silently ignore if running
    state.mode = state.mode === 'focus' ? 'break' : 'focus';
    state.timeLeft = durationForMode(state.mode);
    updateDisplay();
    await persist();
};

const loadState = async () => {
    await loadSettings();
    const saved = await Storage.getJSON(CONFIG.keys.pomoState, null);
    if (saved && typeof saved === 'object') {
        state.mode = saved.mode === 'break' ? 'break' : 'focus';
        state.timeLeft = Number.isFinite(saved.timeLeft)
            ? Math.max(0, Math.floor(saved.timeLeft))
            : durationForMode(state.mode);
        state.isRunning = Boolean(saved.isRunning);
        state.endAt = Number.isFinite(saved.endAt) ? saved.endAt : null;

        if (state.isRunning && state.endAt) {
            const remaining = Math.max(0, Math.ceil((state.endAt - Date.now()) / 1000));
            if (remaining > 0) {
                state.timeLeft = remaining;
                syncInterval = setInterval(syncRunningTimer, 1000);
            } else {
                state.isRunning = false;
                state.endAt = null;
                state.timeLeft = durationForMode(state.mode);
            }
        }
    }
    updateDisplay();
};

// Listen for sync messages from main page
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'POMO_SYNC' && message.payload) {
        const incoming = message.payload;
        // Only update if the incoming state is newer (based on endAt or timeLeft)
        if (incoming.isRunning && incoming.endAt) {
            state = { ...incoming };
            stopSyncInterval();
            syncInterval = setInterval(syncRunningTimer, 1000);
        } else if (!incoming.isRunning) {
            state = { ...incoming };
            stopSyncInterval();
        }
        updateDisplay();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    if (e.code === 'Space') {
        e.preventDefault();
        if (state.isRunning) pauseTimer(); else startTimer();
    } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        resetTimer();
    } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        switchMode();
    }
});

// Button events
DOM.btnStart.addEventListener('click', () => {
    if (state.isRunning) pauseTimer(); else startTimer();
});
DOM.btnReset.addEventListener('click', resetTimer);
DOM.btnMode.addEventListener('click', switchMode);
DOM.btnClose.addEventListener('click', () => {
    // Just close the window - state is already persisted
    window.close();
});

// Drag to move window (header area)
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

DOM.dragHandle.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragOffset.x = e.clientX;
    dragOffset.y = e.clientY;
    DOM.dragHandle.style.cursor = 'grabbing';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragOffset.x;
    const dy = e.clientY - dragOffset.y;
    dragOffset.x = e.clientX;
    dragOffset.y = e.clientY;
    chrome.windows.getCurrent().then(win => {
        chrome.windows.update(win.id, { left: win.left + dx, top: win.top + dy });
    });
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    DOM.dragHandle.style.cursor = 'grab';
});

// Prevent text selection while dragging
DOM.dragHandle.addEventListener('selectstart', (e) => e.preventDefault());

// Initialize
loadState().catch(console.error);