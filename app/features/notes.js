/**
 * AURA ULTRA PREMIUM - Notes Feature
 * Scratchpad with auto-save
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG } from '../core/config.js';

let saveTimer = null;

export const initNotes = async () => {
    DOM.scratchpad.value = await Storage.getString(CONFIG.keys.notes, '');

    DOM.scratchpad.addEventListener('input', (e) => {
        clearTimeout(saveTimer);
        const nextValue = String(e.target.value || '');
        saveTimer = setTimeout(() => {
            void Storage.setString(CONFIG.keys.notes, nextValue);
        }, 250);
    });
};