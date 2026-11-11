/**
 * AURA ULTRA PREMIUM - Keyboard Shortcuts Cheatsheet
 * Visual reference for all keyboard shortcuts
 */

import { DOM } from '../core/dom.js';

const SHORTCUTS = [
    { key: '/', description: 'Focus search' },
    { key: '?', description: 'Show this cheatsheet', shift: true },
    { key: 'f', description: 'Toggle Zen Mode' },
    { key: 'n', description: 'Add shortcut' },
    { key: 't', description: 'Focus task input' },
    { key: 'd', description: 'Toggle Data Panel' },
    { key: 's', description: 'Open Settings' },
    { key: 'e', description: 'Focus search engine', ctrl: true },
    { key: 'Escape', description: 'Close modal / panel / Zen' }
];

let cheatsheetVisible = false;
let cheatsheetEl = null;

const createCheatsheet = () => {
    const overlay = document.createElement('div');
    overlay.className = 'cheatsheet-overlay';
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 50;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s ease;
    `;

    const card = document.createElement('div');
    card.className = 'cheatsheet-card bento';
    card.style.cssText = `
        width: min(480px, 90vw);
        max-height: 80vh;
        overflow-y: auto;
        padding: 2rem;
        transform: scale(0.95) translateY(10px);
        transition: transform 0.2s ease;
    `;

    card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h2 style="font-size: 1.25rem; font-weight: 700;">Keyboard Shortcuts</h2>
            <button class="cheatsheet-close" type="button" style="
                background: none;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 6px;
                transition: color 0.2s;
            " aria-label="Close cheatsheet">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="cheatsheet-list" style="display: flex; flex-direction: column; gap: 0.6rem;">
            ${SHORTCUTS.map(s => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--glass-border);">
                    <kbd style="
                        display: inline-flex;
                        align-items: center;
                        gap: 0.25rem;
                        font-family: var(--font-family);
                        font-size: 0.8rem;
                        font-weight: 600;
                        background: var(--glass-bg);
                        border: 1px solid var(--glass-border);
                        border-radius: 6px;
                        padding: 0.25rem 0.5rem;
                        color: var(--text-main);
                    ">
                        ${s.ctrl ? '<kbd style="padding:0 0.25rem">Ctrl</kbd>+' : ''}${s.shift ? '<kbd style="padding:0 0.25rem">Shift</kbd>+' : ''}<kbd>${s.key}</kbd>
                    </kbd>
                    <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 1rem;">${s.description}</span>
                </div>
            `).join('')}
        </div>
        <p style="margin-top: 1rem; font-size: 0.7rem; color: var(--text-muted); text-align: center;">
            Press <kbd style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 4px; padding: 0.1rem 0.35rem;">?</kbd> or <kbd style="background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 4px; padding: 0.1rem 0.35rem;">Esc</kbd> to close
        </p>
    `;

    overlay.appendChild(card);

    const closeBtn = card.querySelector('.cheatsheet-close');
    const close = () => {
        overlay.style.opacity = '0';
        card.style.transform = 'scale(0.95) translateY(10px)';
        overlay.style.pointerEvents = 'none';
        cheatsheetVisible = false;
        setTimeout(() => overlay.hidden = true, 200);
    };

    const open = () => {
        overlay.hidden = false;
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            card.style.transform = 'scale(1) translateY(0)';
            overlay.style.pointerEvents = 'auto';
            cheatsheetVisible = true;
        });
    };

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);
    cheatsheetEl = overlay;

    return { open, close, toggle: () => cheatsheetVisible ? close() : open() };
};

export const initCheatsheet = () => {
    const { open, close, toggle } = createCheatsheet();

    // Expose globally for keyboard module
    window.__auraCheatsheet = { open, close, toggle };

    // Also handle Escape key when cheatsheet is open
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && cheatsheetVisible) {
            close();
        }
    });

    return { open, close, toggle };
};