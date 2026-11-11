/**
 * AURA ULTRA PREMIUM - Pomodoro Timer
 * Focus/break timer with persistence and notifications
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

    const updateDisplay = () => {
        const safeTime = Math.max(0, Math.floor(timeLeft));
        const min = Math.floor(safeTime / 60).toString().padStart(2, '0');
        const sec = (safeTime % 60).toString().padStart(2, '0');
        DOM.pomoTime.textContent = `${min}:${sec}`;
        DOM.btnPomoStart.textContent = isRunning ? 'Pause' : 'Start';
        DOM.btnPomoMode.textContent = mode === 'focus' ? 'Break' : 'Focus';
        DOM.btnPomoMode.title = mode === 'focus' ? 'Switch to break timer' : 'Switch to focus timer';
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
    };

    const resetTimer = () => {
        isRunning = false;
        endAt = null;
        stopTimerLoop();
        timeLeft = durationForMode(mode);
        updateDisplay();
        void persist();
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
    };

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