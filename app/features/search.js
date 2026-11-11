/**
 * AURA ULTRA PREMIUM - Search Feature
 * Search bar with engine selector
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG, SEARCH_ENGINES, getSearchEngineValue } from '../core/config.js';

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

    DOM.search.addEventListener('keydown', (e) => {
        const query = DOM.search.value.trim();
        if (e.key === 'Enter' && query) {
            const finalEngine = DOM.searchEngine
                ? getSearchEngineValue(DOM.searchEngine.value)
                : selectedEngine;
            window.location.href = SEARCH_ENGINES[finalEngine].url(query);
        }
    });
};