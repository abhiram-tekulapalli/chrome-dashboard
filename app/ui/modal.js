/**
 * AURA ULTRA PREMIUM - Modal Dialog
 * Custom link add/edit modal
 */

import { DOM } from '../core/dom.js';
import { CONFIG } from '../core/config.js';
import { Storage } from '../core/storage.js';
import { truncate, normalizeUrl } from '../core/utils.js';
import { showToast } from './toast.js';

let linkModalResolver = null;

const DEFAULT_CATEGORY = 'Uncategorized';

const getCategories = async () => {
    const saved = await Storage.getJSON(CONFIG.keys.linkCategories, []);
    return Array.isArray(saved) ? saved : [DEFAULT_CATEGORY];
};

const saveCategories = async (categories) => {
    await Storage.setJSON(CONFIG.keys.linkCategories, categories);
};

const addCategory = async (category) => {
    const categories = await getCategories();
    if (!categories.includes(category)) {
        categories.push(category);
        await saveCategories(categories);
    }
};

const createCategorySelect = async (selectedCategory = DEFAULT_CATEGORY) => {
    const categories = await getCategories();
    const select = document.createElement('select');
    select.id = 'link-category-input';
    select.style.cssText = `
        appearance: none;
        -webkit-appearance: none;
        background: rgba(255,255,255,0.06);
        color: var(--text-main);
        border: 1px solid var(--glass-border);
        border-radius: 999px;
        padding: 0.5rem 2rem 0.5rem 0.75rem;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
        background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
        background-position: calc(100% - 14px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px);
        background-size: 5px 5px, 5px 5px;
        background-repeat: no-repeat;
    `;
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
    // Add "New Category..." option
    const newOpt = document.createElement('option');
    newOpt.value = '__new__';
    newOpt.textContent = '+ New Category...';
    select.appendChild(newOpt);
    select.value = categories.includes(selectedCategory) ? selectedCategory : DEFAULT_CATEGORY;
    return { select, categories };
};

export const closeLinkModal = (payload = null) => {
    if (!DOM.linkModal || DOM.linkModal.hidden) return;

    DOM.linkModal.hidden = true;
    DOM.body.classList.remove('modal-open');

    const resolver = linkModalResolver;
    linkModalResolver = null;
    if (resolver) resolver(payload);
};

const submitLinkModal = async () => {
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

    let category = DOM.linkCategorySelect?.value || DEFAULT_CATEGORY;
    if (category === '__new__') {
        const newCat = prompt('Enter new category name:');
        if (newCat && newCat.trim()) {
            category = newCat.trim();
            await addCategory(category);
        } else {
            category = DEFAULT_CATEGORY;
        }
    }

    closeLinkModal({ id: crypto.randomUUID(), name, url, category });
};

export const openLinkModal = async (prefill = {}) => {
    if (!DOM.linkModal || linkModalResolver) return Promise.resolve(null);

    DOM.linkNameInput.value = typeof prefill.name === 'string' ? prefill.name : '';
    DOM.linkUrlInput.value = typeof prefill.url === 'string' ? prefill.url : '';

    // Build category select dynamically
    const categoryWrapper = DOM.linkModal.querySelector('#link-category-wrapper');
    if (categoryWrapper) {
        const { select } = await createCategorySelect(prefill.category);
        DOM.linkCategorySelect = select;
        categoryWrapper.innerHTML = '';
        categoryWrapper.appendChild(select);
    }

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