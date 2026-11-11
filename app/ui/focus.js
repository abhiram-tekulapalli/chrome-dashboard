/**
 * AURA ULTRA PREMIUM - Focus/Zen Mode
 * Focus mode state and UI toggling
 */

import { DOM } from '../core/dom.js';

let focusMode = false;

export const getFocusMode = () => focusMode;

export const setFocusMode = (enabled) => {
    focusMode = Boolean(enabled);
    DOM.body.classList.toggle('focus-mode', focusMode);
    DOM.btnFocus.classList.toggle('focus-active', focusMode);
    DOM.btnFocus.setAttribute('aria-pressed', String(focusMode));
    DOM.btnFocus.setAttribute('title', focusMode ? 'Zen Mode Enabled' : 'Zen Mode');
    DOM.btnZenBack.tabIndex = focusMode ? 0 : -1;
    if (focusMode) setDataPanel(false);
};

// Need to import setDataPanel to avoid circular dependency
import { setDataPanel } from './toast.js';