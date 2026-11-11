/**
 * AURA ULTRA PREMIUM - Data Tools
 * Export, import, reset functionality
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG } from '../core/config.js';
import { showToast, setDataPanel, getDataPanelState } from '../ui/toast.js';
import { downloadFile, readFileAsText } from '../core/utils.js';

let resetArmedUntil = 0;

export const initDataTools = () => {
    DOM.btnData.addEventListener('click', (e) => {
        e.stopPropagation();
        setDataPanel(!getDataPanelState());
    });

    document.addEventListener('click', (e) => {
        if (!getDataPanelState()) return;
        if (DOM.controls.contains(e.target)) return;
        setDataPanel(false);
    });

    DOM.btnExport.addEventListener('click', async () => {
        const payload = {
            version: CONFIG.storageVersion,
            exportedAt: new Date().toISOString(),
            data: {
                [CONFIG.keys.theme]: await Storage.getString(CONFIG.keys.theme, 'dark'),
                [CONFIG.keys.searchEngine]: await Storage.getString(CONFIG.keys.searchEngine, 'google'),
                [CONFIG.keys.customLinks]: await Storage.getJSON(CONFIG.keys.customLinks, []),
                [CONFIG.keys.tasks]: await Storage.getJSON(CONFIG.keys.tasks, []),
                [CONFIG.keys.notes]: await Storage.getString(CONFIG.keys.notes, ''),
                [CONFIG.keys.pomoState]: await Storage.getJSON(CONFIG.keys.pomoState, null)
            }
        };

        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadFile(`aura-backup-${stamp}.json`, JSON.stringify(payload, null, 2));
        setDataPanel(false);
        showToast('Backup exported.', 'success');
    });

    DOM.btnImport.addEventListener('click', () => {
        DOM.importDataInput.value = '';
        DOM.importDataInput.click();
    });

    DOM.importDataInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
            const text = await readFileAsText(file);
            const parsed = JSON.parse(text);
            const data = parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object'
                ? parsed.data
                : parsed;

            if (!data || typeof data !== 'object') {
                showToast('Invalid backup file.', 'error');
                return;
            }

            const writes = [];

            if (CONFIG.keys.theme in data) {
                writes.push(Storage.setString(CONFIG.keys.theme, String(data[CONFIG.keys.theme])));
            }
            if (CONFIG.keys.searchEngine in data) {
                const { getSearchEngineValue } = await import('../core/config.js');
                writes.push(Storage.setString(CONFIG.keys.searchEngine, getSearchEngineValue(String(data[CONFIG.keys.searchEngine]))));
            }
            if (CONFIG.keys.customLinks in data && Array.isArray(data[CONFIG.keys.customLinks])) {
                writes.push(Storage.setJSON(CONFIG.keys.customLinks, data[CONFIG.keys.customLinks]));
            }
            if (CONFIG.keys.tasks in data && Array.isArray(data[CONFIG.keys.tasks])) {
                writes.push(Storage.setJSON(CONFIG.keys.tasks, data[CONFIG.keys.tasks]));
            }
            if (CONFIG.keys.notes in data) {
                writes.push(Storage.setString(CONFIG.keys.notes, String(data[CONFIG.keys.notes] || '')));
            }
            if (CONFIG.keys.pomoState in data) {
                writes.push(Storage.setJSON(CONFIG.keys.pomoState, data[CONFIG.keys.pomoState]));
            }

            await Promise.all(writes);
            await Storage.remove(CONFIG.keys.legacyBgIndex);

            setDataPanel(false);
            showToast('Backup imported. Reloading...', 'success');
            setTimeout(() => window.location.reload(), 550);
        } catch {
            showToast('Import failed. Please use a valid JSON backup.', 'error');
        }
    });

    DOM.btnResetAll.addEventListener('click', async () => {
        const now = Date.now();
        if (now > resetArmedUntil) {
            resetArmedUntil = now + 4000;
            showToast('Press reset again within 4s to confirm.', 'error');
            return;
        }

        const keysToClear = Object.values(CONFIG.keys);
        await Promise.all(keysToClear.map((key) => Storage.remove(key)));
        setDataPanel(false);
        showToast('All data reset. Reloading...', 'success');
        setTimeout(() => window.location.reload(), 450);
    });
};