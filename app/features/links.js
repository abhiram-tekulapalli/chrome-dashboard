/**
 * AURA ULTRA PREMIUM - Links Feature
 * App shortcuts with custom link management and categories
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG } from '../core/config.js';
import { makeId, truncate, normalizeUrl, animateIn } from '../core/utils.js';
import { showToast, closeDataPanel } from '../ui/toast.js';
import { openLinkModal } from '../ui/modal.js';

const DEFAULT_CATEGORY = 'Uncategorized';

// Favicon fallback cache
const faviconCache = new Map();
const getFallback = (name) => {
    const letter = (name.trim().charAt(0) || '?').toUpperCase().replace(/[^A-Z0-9]/, '?');
    if (!faviconCache.has(letter)) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#ffffff15" rx="32"/><text x="50%" y="54%" fill="#ffffff" font-family="sans-serif" font-size="64" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
        faviconCache.set(letter, `data:image/svg+xml,${encodeURIComponent(svg)}`);
    }
    return faviconCache.get(letter);
};

const getDomain = (url) => {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch {
        return url;
    }
};

const sanitizeCustomLinks = (raw) => {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => {
            if (!item || typeof item !== 'object') return null;

            const name = truncate(String(item.name || ''), CONFIG.maxLinkNameLength);
            const url = normalizeUrl(String(item.url || '').trim());
            if (!name || !url) return null;

            return {
                id: typeof item.id === 'string' ? item.id : makeId(),
                name,
                url,
                category: typeof item.category === 'string' && item.category.trim() ? item.category.trim() : DEFAULT_CATEGORY
            };
        })
        .filter(Boolean);
};

let customLinks = [];

const saveCustom = () => Storage.setJSON(CONFIG.keys.customLinks, customLinks);

const createNode = (link, isCustom = false) => {
    const a = document.createElement('a');
    a.href = link.url;
    a.className = 'app-item';
    a.rel = 'noopener noreferrer';

    const domain = getDomain(link.url);
    const favUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

    const iconWrap = document.createElement('div');
    iconWrap.className = 'app-icon';

    const img = document.createElement('img');
    img.src = favUrl;
    img.alt = link.name;
    img.onerror = () => {
        img.src = getFallback(link.name);
    };
    iconWrap.appendChild(img);

    if (isCustom) {
        const removeBtn = document.createElement('button');
        removeBtn.className = 'delete-link-btn';
        removeBtn.type = 'button';
        removeBtn.title = 'Remove';
        removeBtn.setAttribute('aria-label', `Remove ${link.name}`);
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        removeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            a.classList.add('is-leaving');
            setTimeout(() => {
                customLinks = customLinks.filter((item) => item.id !== link.id);
                void saveCustom();
                void render();
                showToast('Shortcut removed.', 'success');
            }, 230);
        });
        iconWrap.appendChild(removeBtn);
    }

    const label = document.createElement('span');
    label.textContent = link.name;

    a.appendChild(iconWrap);
    a.appendChild(label);
    return a;
};

const render = () => {
    DOM.linksContainer.innerHTML = '';

    // Default link categories
    Object.entries(CONFIG.defaultLinks).forEach(([cat, links], catIndex) => {
        const grp = document.createElement('div');
        grp.className = 'link-category';

        const title = document.createElement('h3');
        title.textContent = cat;

        const grid = document.createElement('div');
        grid.className = 'app-grid';
        links.forEach((link, linkIndex) => {
            const node = createNode(link, false);
            grid.appendChild(animateIn(node, (catIndex * 3) + linkIndex));
        });

        grp.appendChild(title);
        grp.appendChild(grid);
        DOM.linksContainer.appendChild(grp);
    });

    // Custom links - grouped by category
    const customGrp = document.createElement('div');
    customGrp.className = 'link-category';

    const customTitle = document.createElement('h3');
    customTitle.textContent = 'My Shortcuts';

    const customGrid = document.createElement('div');
    customGrid.className = 'app-grid';

    // Group custom links by category
    const byCategory = {};
    customLinks.forEach(link => {
        const cat = link.category || DEFAULT_CATEGORY;
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(link);
    });

    // Sort categories: Uncategorized first, then alphabetically
    const sortedCategories = Object.keys(byCategory).sort((a, b) => {
        if (a === DEFAULT_CATEGORY) return -1;
        if (b === DEFAULT_CATEGORY) return 1;
        return a.localeCompare(b);
    });

    let globalIndex = 0;
    sortedCategories.forEach(cat => {
        const catTitle = document.createElement('h4');
        catTitle.textContent = cat;
        catTitle.style.cssText = `
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: var(--text-muted);
            margin: 1rem 0 0.5rem;
            font-weight: 700;
            border-top: 1px solid var(--glass-border);
            padding-top: 0.75rem;
        `;
        if (globalIndex === 0) {
            catTitle.style.marginTop = '0';
            catTitle.style.borderTop = 'none';
            catTitle.style.paddingTop = '0';
        }
        customGrid.appendChild(catTitle);

        byCategory[cat].forEach(link => {
            customGrid.appendChild(animateIn(createNode(link, true), globalIndex++));
        });
    });

    // Add button
    const addWrap = document.createElement('button');
    addWrap.type = 'button';
    addWrap.className = 'app-item app-item-btn';
    addWrap.setAttribute('aria-label', 'Add shortcut');

    const addBtn = document.createElement('span');
    addBtn.className = 'app-icon btn-add-link';
    addBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';

    const addLabel = document.createElement('span');
    addLabel.textContent = 'Add';

    addWrap.appendChild(addBtn);
    addWrap.appendChild(addLabel);
    addWrap.addEventListener('click', () => {
        void addCustomLink();
    });

    customGrid.appendChild(animateIn(addWrap, globalIndex + 1));
    customGrp.appendChild(customTitle);
    customGrp.appendChild(customGrid);
    DOM.linksContainer.appendChild(customGrp);
};

const addCustomLink = async () => {
    closeDataPanel();
    const result = await openLinkModal();
    if (!result) return;

    const duplicate = customLinks.some((link) => link.url === result.url);
    if (duplicate) {
        showToast('That shortcut already exists.', 'error');
        return;
    }

    customLinks.push(result);
    await saveCustom();
    render();
    showToast('Shortcut added.', 'success');
};

export const initLinks = async () => {
    customLinks = sanitizeCustomLinks(await Storage.getJSON(CONFIG.keys.customLinks, []));
    void Storage.setJSON(CONFIG.keys.customLinks, customLinks);

    render();
};

// Exported for keyboard shortcuts
export { addCustomLink };