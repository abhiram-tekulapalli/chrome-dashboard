/**
 * AURA ULTRA PREMIUM - DOM Element Cache
 * Lazy getters - elements resolved on first access (after DOM is ready)
 */

const selectors = {
    bgLayer: '#bg-layer',
    clock: '#clock',
    greeting: '#greeting',
    search: '#search-input',
    searchEngine: '#search-engine',
    btnBgDefault: '#btn-bg-default',
    btnTheme: '#btn-theme',
    iconTheme: '#icon-theme',
    btnFocus: '#btn-focus',
    btnZenBack: '#btn-zen-back',
    linksContainer: '#links-container',
    inputTask: '#input-task',
    listTasks: '#list-tasks',
    calMonth: '#cal-month',
    calDays: '#cal-days',
    scratchpad: '#scratchpad',
    pomoTime: '#pomo-time',
    btnPomoStart: '#btn-pomo-start',
    btnPomoReset: '#btn-pomo-reset',
    btnPomoMode: '#btn-pomo-mode',
    btnData: '#btn-data',
    controls: '.controls',
    dataPanel: '#data-panel',
    btnExport: '#btn-export',
    btnImport: '#btn-import',
    btnResetAll: '#btn-reset-all',
    importDataInput: '#import-data-input',
    linkModal: '#link-modal',
    linkNameInput: '#link-name-input',
    linkUrlInput: '#link-url-input',
    linkSaveBtn: '#link-save-btn',
    linkCancelBtn: '#link-cancel-btn',
    toast: '#toast',
    body: 'body'
};

const cache = new Map();

function getElement(key) {
    if (cache.has(key)) return cache.get(key);

    const selector = selectors[key];
    if (!selector) return null;

    const el = selector.startsWith('.')
        ? document.querySelector(selector)
        : document.getElementById(selector.slice(1));

    cache.set(key, el);
    return el;
}

function getBody() {
    return document.body;
}

export const DOM = new Proxy({}, {
    get(_target, prop) {
        if (prop === 'body') return getBody();
        return getElement(prop);
    },
    ownKeys() {
        return Object.keys(selectors).concat('body');
    },
    getOwnPropertyDescriptor(_target, prop) {
        if (prop in selectors || prop === 'body') {
            return { enumerable: true, configurable: true };
        }
    }
});

// For debugging: DOM._cache = cache
DOM._cache = cache;