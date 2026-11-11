/**
 * AURA ULTRA PREMIUM - Toast Notifications
 */

import { DOM } from '../core/dom.js';

let toastTimer = null;
let dataPanelOpen = false;

export const showToast = (message, type = 'info') => {
    if (!DOM.toast) return;

    DOM.toast.className = 'toast';
    DOM.toast.textContent = message;
    if (type === 'success') DOM.toast.classList.add('success');
    if (type === 'error') DOM.toast.classList.add('error');

    DOM.toast.classList.remove('show');
    void DOM.toast.offsetWidth;
    DOM.toast.classList.add('show');

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 2200);
};

export const getDataPanelState = () => dataPanelOpen;

export const setDataPanel = (open) => {
    dataPanelOpen = open;
    if (!DOM.dataPanel || !DOM.btnData) return;
    DOM.dataPanel.hidden = !open;
    DOM.btnData.setAttribute('aria-expanded', String(open));
};

export const closeDataPanel = () => setDataPanel(false);