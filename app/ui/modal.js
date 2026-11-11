/**
 * AURA ULTRA PREMIUM - Modal Dialog
 * Custom link add/edit modal
 */

import { DOM } from '../core/dom.js';
import { CONFIG, truncate, normalizeUrl } from '../core/utils.js';
import { showToast } from './toast.js';

let linkModalResolver = null;

export const closeLinkModal = (payload = null) => {
    if (!DOM.linkModal || DOM.linkModal.hidden) return;

    DOM.linkModal.hidden = true;
    DOM.body.classList.remove('modal-open');

    const resolver = linkModalResolver;
    linkModalResolver = null;
    if (resolver) resolver(payload);
};

const submitLinkModal = () => {
    const name = truncate(DOM.linkNameInput.value || '', CONFIG.maxLinkNameLength);
    const url = normalizeUrl((DOM.linkUrlInput.value || '').trim());

    if (!name) {
        showToast('Please enter a shortcut name.', 'error');
        DOM.linkNameInput.focus();
        return;
    }
    if (!url) {
        showToast('Please enter a valid http/https URL.', 'error');
        DOM.linkUrlInput.focus();
        return;
    }

    closeLinkModal({ id: crypto.randomUUID(), name, url });
};

export const openLinkModal = (prefill = {}) => {
    if (!DOM.linkModal || linkModalResolver) return Promise.resolve(null);

    DOM.linkNameInput.value = typeof prefill.name === 'string' ? prefill.name : '';
    DOM.linkUrlInput.value = typeof prefill.url === 'string' ? prefill.url : '';

    DOM.linkModal.hidden = false;
    DOM.body.classList.add('modal-open');
    requestAnimationFrame(() => DOM.linkNameInput.focus());

    return new Promise((resolve) => {
        linkModalResolver = resolve;
    });
};

export const initLinkModal = () => {
    DOM.linkSaveBtn.addEventListener('click', submitLinkModal);
    DOM.linkCancelBtn.addEventListener('click', () => closeLinkModal(null));

    DOM.linkModal.addEventListener('click', (e) => {
        if (e.target === DOM.linkModal) closeLinkModal(null);
    });

    DOM.linkModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            closeLinkModal(null);
            return;
        }
        if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
            e.preventDefault();
            submitLinkModal();
        }
    });
};