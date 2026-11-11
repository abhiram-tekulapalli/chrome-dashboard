/**
 * AURA ULTRA PREMIUM - Pomodoro Timer
 * Focus/break timer with persistence, notifications, and detachable popup
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG } from '../core/config.js';
import { showToast } from '../ui/toast.js';
import { getSetting } from '../core/settings.js';

export const initPomodoro = async () => {
    let timerInterval;
    let mode = 'focus';
    let isRunning = false;
    let endAt = null;
    let popupWindowId = null;

    const getFocusDuration = () => (getSetting('pomodoroFocusDuration') || 25) * 60;
    const getBreakDuration = () => (getSetting('pomodoroBreakDuration') || 5) * 60;

    const durationForMode = (nextMode) => (
        nextMode === 'break' ? getBreakDuration() : getFocusDuration()
    );

    let timeLeft = durationForMode(mode);

    const notifyCompletion = async (message) => {
        showToast(message, 'success');

        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            try {
                new Notification('Aura Focus Timer', { body: message });
            } catch {
                // Silent fallback toast already shown
            }
            return;
        }

        if (Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch {
                // Ignore permission errors
            }
        }
    };

    const persist = () => Storage.setJSON(CONFIG.keys.pomoState, {
        mode,
        isRunning,
        endAt,
        timeLeft
    });

    const broadcastSync = () => {
        chrome.runtime.sendMessage({
            type: 'POMO_SYNC',
            payload: { mode, isRunning, endAt, timeLeft }
        });
    };

    const updateDisplay = () => {
        const safeTime = Math.max(0, Math.floor(timeLeft));
        const min = Math.floor(safeTime / 60).toString().padStart(2, '0');
        const sec = (safeTime % 60).toString().padStart(2, '0');
        DOM.pomoTime.textContent = `${min}:${sec}`;
        DOM.btnPomoStart.textContent = isRunning ? 'Pause' : 'Start';
        DOM.btnPomoMode.textContent = mode === 'focus' ? 'Break' : 'Focus';
        DOM.btnPomoMode.title = mode === 'focus' ? 'Switch to break timer' : 'Switch to focus timer';
        // Update popup button text
        if (DOM.btnPomoPopup) {
            DOM.btnPomoPopup.textContent = popupWindowId ? '🔗 Attached' : '🔲 Detach';
            DOM.btnPomoPopup.title = popupWindowId ? 'Close popup window' : 'Open in detachable window';
        }
    };

    const stopTimerLoop = () => {
        clearInterval(timerInterval);
        timerInterval = undefined;
    };

    const completeSession = async () => {
        const finishedMode = mode;
        isRunning = false;
        endAt = null;
        stopTimerLoop();

        mode = finishedMode === 'focus' ? 'break' : 'focus';
        timeLeft = durationForMode(mode);
        updateDisplay();
        void persist();
        broadcastSync();

        const message = finishedMode === 'focus'
            ? 'Focus session complete. Time for a short break.'
            : 'Break complete. Back to focus.';

        await notifyCompletion(message);
    };

    const syncRunningTimer = () => {
        if (!isRunning || !endAt) return;

        const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        if (remaining !== timeLeft) {
            timeLeft = remaining;
            updateDisplay();
            void persist();
            broadcastSync();
        }

        if (remaining <= 0) {
            void completeSession();
        }
    };

    const startTimer = () => {
        if (isRunning) return;
        isRunning = true;
        endAt = Date.now() + (timeLeft * 1000);
        stopTimerLoop();
        timerInterval = setInterval(syncRunningTimer, 1000);
        updateDisplay();
        void persist();
        broadcastSync();
    };

    const pauseTimer = () => {
        if (!isRunning) return;
        const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
        timeLeft = remaining;
        isRunning = false;
        endAt = null;
        stopTimerLoop();
        updateDisplay();
        void persist();
        broadcastSync();
    };

    const resetTimer = () => {
        isRunning = false;
        endAt = null;
        stopTimerLoop();
        timeLeft = durationForMode(mode);
        updateDisplay();
        void persist();
        broadcastSync();
    };

    const switchMode = () => {
        if (isRunning) {
            showToast('Pause timer before switching mode.', 'error');
            return;
        }
        mode = mode === 'focus' ? 'break' : 'focus';
        timeLeft = durationForMode(mode);
        updateDisplay();
        void persist();
        broadcastSync();
    };

    // --- Popup Window Management ---

    const createPopupButton = () => {
        if (DOM.btnPomoPopup) return;
        const btn = document.createElement('button');
        btn.id = 'btn-pomo-popup';
        btn.className = 'pomo-btn';
        btn.type = 'button';
        btn.textContent = '🔲 Detach';
        btn.title = 'Open in detachable window';
        btn.style.cssText = `
            background: var(--glass-highlight);
            border: 1px solid var(--glass-border);
            color: var(--text-main);
            padding: 0.4rem 0.75rem;
            border-radius: 20px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'var(--text-main)';
            btn.style.color = 'var(--bg-overlay)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'var(--glass-highlight)';
            btn.style.color = 'var(--text-main)';
        });
        btn.addEventListener('click', togglePopup);
        DOM.btnPomoPopup = btn;
        // Insert after mode button
        DOM.btnPomoMode.parentElement.insertBefore(btn, DOM.btnPomoMode.nextSibling);
    };

    const openPopup = async () => {
        try {
            const win = await chrome.windows.create({
                url: 'pomodoro-popup.html',
                type: 'normal',
                width: 360,
                height: 380,
                left: window.screenX + 100,
                top: window.screenY + 100,
                focused: true
            });
            popupWindowId = win.id;
            updateDisplay();

            // Listen for popup close
            chrome.windows.onRemoved.addListener(function listener(closedId) {
                if (closedId === popupWindowId) {
                    popupWindowId = null;
                    updateDisplay();
                    chrome.windows.onRemoved.removeListener(listener);
                }
            });
        } catch (e) {
            console.error('Failed to open popup:', e);
            showToast('Could not open popup window', 'error');
        }
    };

    const closePopup = () => {
        if (popupWindowId) {
            chrome.windows.remove(popupWindowId);
            popupWindowId = null;
            updateDisplay();
        }
    };

    const togglePopup = () => {
        if (popupWindowId) {
            closePopup();
        } else {
            openPopup();
        }
    };

    // Listen for sync from popup
    chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'POMO_SYNC' && message.payload) {
            const incoming = message.payload;
            // Popup is authoritative when it's running (has endAt)
            if (incoming.isRunning && incoming.endAt) {
                mode = incoming.mode;
                isRunning = incoming.isRunning;
                endAt = incoming.endAt;
                timeLeft = incoming.timeLeft;
                stopTimerLoop();
                timerInterval = setInterval(syncRunningTimer, 1000);
            } else if (!incoming.isRunning) {
                // Popup paused/stopped - sync state
                mode = incoming.mode;
                isRunning = incoming.isRunning;
                endAt = incoming.endAt;
                timeLeft = incoming.timeLeft;
                stopTimerLoop();
            }
            updateDisplay();
        }
    });

    // Load saved state
    const saved = await Storage.getJSON(CONFIG.keys.pomoState, null);
    if (saved && typeof saved === 'object') {
        mode = saved.mode === 'break' ? 'break' : 'focus';
        timeLeft = Number.isFinite(saved.timeLeft)
            ? Math.max(0, Math.floor(saved.timeLeft))
            : durationForMode(mode);
        isRunning = Boolean(saved.isRunning);
        endAt = Number.isFinite(saved.endAt) ? saved.endAt : null;

        if (isRunning && endAt) {
            const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
            if (remaining > 0) {
                timeLeft = remaining;
                timerInterval = setInterval(syncRunningTimer, 1000);
            } else {
                isRunning = false;
                endAt = null;
                timeLeft = durationForMode(mode);
            }
        } else {
            isRunning = false;
            endAt = null;
        }
    }

    createPopupButton();

    DOM.btnPomoStart.addEventListener('click', async () => {
        // Request notification permission on first interaction
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch {
                // Ignore permission errors
            }
        }
        if (isRunning) pauseTimer();
        else startTimer();
    });

    DOM.btnPomoReset.addEventListener('click', resetTimer);
    DOM.btnPomoMode.addEventListener('click', switchMode);

    updateDisplay();
};