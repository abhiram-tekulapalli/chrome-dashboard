/**
 * AURA ULTRA PREMIUM - Keyboard Shortcuts
 * Global keyboard handlers
 */

import { DOM } from '../core/dom.js';
import { isEditableTarget } from '../core/utils.js';
import { setFocusMode, getFocusMode } from './focus.js';
import { setDataPanel, getDataPanelState } from './toast.js';
import { addCustomLink } from '../features/links.js';

export const initKeyboardShortcuts = () => {
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();

        if (key === 'escape') {
            if (!DOM.linkModal.hidden) {
                e.preventDefault();
                import('./modal.js').then(m => m.closeLinkModal(null));
                return;
            }
            if (getDataPanelState()) {
                e.preventDefault();
                setDataPanel(false);
                return;
            }
            if (getFocusMode()) {
                e.preventDefault();
                setFocusMode(false);
            }
            return;
        }

        if (!DOM.linkModal.hidden) return;
        if (isEditableTarget(e.target)) return;
        if (getFocusMode()) return;

        if (key === '/') {
            e.preventDefault();
            DOM.search.focus();
            DOM.search.select();
            return;
        }

        if (key === 'f') {
            e.preventDefault();
            setFocusMode(!getFocusMode());
            return;
        }

        if (key === 'n') {
            e.preventDefault();
            void addCustomLink();
            return;
        }

        if (key === 't') {
            e.preventDefault();
            DOM.inputTask.focus();
            return;
        }

        if (key === 'd') {
            e.preventDefault();
            setDataPanel(!getDataPanelState());
        }

        // Ctrl+E for search engine selector
        if (key === 'e' && e.ctrlKey) {
            e.preventDefault();
            DOM.searchEngine.focus();
        }
    });
};