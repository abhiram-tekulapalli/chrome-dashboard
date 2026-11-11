/**
 * AURA ULTRA PREMIUM - Search Feature
 * Search bar with engine selector and history
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG, SEARCH_ENGINES, getSearchEngineValue } from '../core/config.js';

const MAX_HISTORY = 4;

const getHistory = async () => {
    const history = await Storage.getJSON(CONFIG.keys.searchHistory, []);
    return Array.isArray(history) ? history : [];
};

const saveHistory = async (history) => {
    await Storage.setJSON(CONFIG.keys.searchHistory, history.slice(0, MAX_HISTORY));
};

const addToHistory = async (query) => {
    const history = await getHistory();
    const filtered = history.filter(q => q.toLowerCase() !== query.toLowerCase());
    filtered.unshift(query);
    await saveHistory(filtered);
};

const createHistoryDropdown = () => {
    const dropdown = document.createElement('div');
    dropdown.className = 'search-history-dropdown';
    dropdown.hidden = true;
    dropdown.style.cssText = `
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-sm);
        box-shadow: var(--glass-shadow);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        z-index: 20;
        overflow: hidden;
        max-height: 200px;
        overflow-y: auto;
    `;
    return dropdown;
};

let historyDropdown = null;

const showHistory = async () => {
    if (!historyDropdown) {
        historyDropdown = createHistoryDropdown();
        DOM.search.parentElement.style.position = 'relative';
        DOM.search.parentElement.appendChild(historyDropdown);
    }

    const history = await getHistory();
    if (history.length === 0) {
        historyDropdown.hidden = true;
        return;
    }

    historyDropdown.innerHTML = history.map((query, i) => `
        <button type="button" class="history-item" data-query="${query.replace(/"/g, '"')}" style="
            width: 100%;
            padding: 0.6rem 1rem;
            text-align: left;
            background: ${i === 0 ? 'var(--glass-highlight)' : 'transparent'};
            border: none;
            border-bottom: ${i < history.length - 1 ? '1px solid var(--glass-border)' : 'none'};
            color: var(--text-main);
            font-size: 0.9rem;
            cursor: pointer;
            transition: background 0.15s;
        ">
            <span style="display: flex; align-items: center; gap: 0.5rem;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted); flex-shrink: 0;">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                </svg>
                <span>${query}</span>
            </span>
        </button>
    `).join('');

    historyDropdown.hidden = false;

    historyDropdown.querySelectorAll('.history-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.dataset.query;
            DOM.search.value = query;
            historyDropdown.hidden = true;
            const finalEngine = DOM.searchEngine
                ? getSearchEngineValue(DOM.searchEngine.value)
                : 'google';
            window.location.href = SEARCH_ENGINES[finalEngine].url(query);
        });
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'var(--glass-highlight)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'transparent';
        });
    });
};

const hideHistory = () => {
    if (historyDropdown) historyDropdown.hidden = true;
};

export const initSearch = async () => {
    let selectedEngine = getSearchEngineValue(await Storage.getString(CONFIG.keys.searchEngine, 'google'));

    const updateSearchPlaceholder = () => {
        const label = SEARCH_ENGINES[selectedEngine].label;
        DOM.search.placeholder = `Search with ${label}...`;
    };

    if (DOM.searchEngine) {
        DOM.searchEngine.innerHTML = '';
        Object.entries(SEARCH_ENGINES).forEach(([value, engine]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = engine.label;
            DOM.searchEngine.appendChild(option);
        });

        DOM.searchEngine.value = selectedEngine;
        DOM.searchEngine.addEventListener('change', () => {
            selectedEngine = getSearchEngineValue(DOM.searchEngine.value);
            DOM.searchEngine.value = selectedEngine;
            updateSearchPlaceholder();
            void Storage.setString(CONFIG.keys.searchEngine, selectedEngine);
        });
    }

    updateSearchPlaceholder();

    // Show history on focus
    DOM.search.addEventListener('focus', showHistory);
    DOM.search.addEventListener('input', showHistory);

    // Hide on blur (with delay to allow click)
    DOM.search.addEventListener('blur', () => setTimeout(hideHistory, 150));

    DOM.search.addEventListener('keydown', (e) => {
        const query = DOM.search.value.trim();
        if (e.key === 'Enter' && query) {
            await addToHistory(query);
            const finalEngine = DOM.searchEngine
                ? getSearchEngineValue(DOM.searchEngine.value)
                : selectedEngine;
            window.location.href = SEARCH_ENGINES[finalEngine].url(query);
        }
        if (e.key === 'Escape') {
            hideHistory();
            DOM.search.blur();
        }
    });

    // Keyboard navigation in dropdown
    document.addEventListener('keydown', (e) => {
        if (!historyDropdown || historyDropdown.hidden) return;
        const items = historyDropdown.querySelectorAll('.history-item');
        if (items.length === 0) return;
        const focused = historyDropdown.querySelector('.history-item:focus');
        let idx = focused ? Array.from(items).indexOf(focused) : -1;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            idx = (idx + 1) % items.length;
            items[idx].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            idx = (idx - 1 + items.length) % items.length;
            items[idx].focus();
        } else if (e.key === 'Enter' && focused) {
            e.preventDefault();
            focused.click();
        }
    });
};