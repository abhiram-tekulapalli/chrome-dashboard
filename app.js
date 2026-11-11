
/**
 * AURA ULTRA PREMIUM V5.0
 * - Storage hardening with chrome.storage migration + fallback
 * - Custom modal/toast UX (no prompt/alert)
 * - Data tools: export/import/reset
 * - Stable IDs for links/tasks
 * - Keyboard shortcuts and accessibility upgrades
 * - Persistent pomodoro state with mode switching
 */

const App = (() => {
    const CONFIG = {
        defaultWallpaper: 'radial-gradient(130% 120% at 8% 6%, #2b2b2b 0%, #171717 32%, #0b0b0b 64%, #030303 100%), radial-gradient(90% 60% at 82% 18%, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)',
        maxTaskLength: 180,
        maxLinkNameLength: 40,
        focusDurationSec: 25 * 60,
        breakDurationSec: 5 * 60,
        keys: {
            theme: 'aura_theme',
            customBg: 'aura_custom_bg',
            customLinks: 'aura_custom_links',
            tasks: 'aura_tasks',
            notes: 'aura_notes',
            pomoState: 'aura_pomo_state',
            searchEngine: 'aura_search_engine',
            legacyBgIndex: 'aura_bg_index'
        },
        defaultLinks: {
            'Development': [
                { name: 'GitHub', url: 'https://github.com' },
                { name: 'Vercel', url: 'https://vercel.com' },
                { name: 'Netlify', url: 'https://netlify.com' },
                { name: 'Figma', url: 'https://figma.com' },
                { name: 'StackOverflow', url: 'https://stackoverflow.com' }
            ],
            'DSA & Logic': [
                { name: 'LeetCode', url: 'https://leetcode.com' },
                { name: 'Codeforces', url: 'https://codeforces.com' },
                { name: 'HackerRank', url: 'https://hackerrank.com' },
                { name: 'GfG', url: 'https://geeksforgeeks.org' },
                { name: 'TakeUForward', url: 'https://takeuforward.org' }
            ],
            'AI & Tools': [
                { name: 'Gemini', url: 'https://gemini.google.com' },
                { name: 'Claude', url: 'https://claude.ai' },
                { name: 'Perplexity', url: 'https://perplexity.ai' },
                { name: 'CanIUse', url: 'https://caniuse.com' }
            ],
            'Workspace': [
                { name: 'ChatGPT', url: 'https://chatgpt.com' },
                { name: 'Gmail', url: 'https://mail.google.com' },
                { name: 'Notion', url: 'https://notion.so' },
                { name: 'YouTube', url: 'https://youtube.com' }
            ]
        }
    };

    const DOM = {
        bgLayer: document.getElementById('bg-layer'),
        clock: document.getElementById('clock'),
        greeting: document.getElementById('greeting'),
        search: document.getElementById('search-input'),
        searchEngine: document.getElementById('search-engine'),
        btnBgDefault: document.getElementById('btn-bg-default'),
        btnTheme: document.getElementById('btn-theme'),
        iconTheme: document.getElementById('icon-theme'),
        btnFocus: document.getElementById('btn-focus'),
        btnZenBack: document.getElementById('btn-zen-back'),
        linksContainer: document.getElementById('links-container'),
        inputTask: document.getElementById('input-task'),
        listTasks: document.getElementById('list-tasks'),
        calMonth: document.getElementById('cal-month'),
        calDays: document.getElementById('cal-days'),
        scratchpad: document.getElementById('scratchpad'),
        pomoTime: document.getElementById('pomo-time'),
        btnPomoStart: document.getElementById('btn-pomo-start'),
        btnPomoReset: document.getElementById('btn-pomo-reset'),
        btnPomoMode: document.getElementById('btn-pomo-mode'),
        btnData: document.getElementById('btn-data'),
        controls: document.querySelector('.controls'),
        dataPanel: document.getElementById('data-panel'),
        btnExport: document.getElementById('btn-export'),
        btnImport: document.getElementById('btn-import'),
        btnResetAll: document.getElementById('btn-reset-all'),
        importDataInput: document.getElementById('import-data-input'),
        linkModal: document.getElementById('link-modal'),
        linkNameInput: document.getElementById('link-name-input'),
        linkUrlInput: document.getElementById('link-url-input'),
        linkSaveBtn: document.getElementById('link-save-btn'),
        linkCancelBtn: document.getElementById('link-cancel-btn'),
        toast: document.getElementById('toast'),
        body: document.body
    };

    const hasChromeStorage =
        typeof chrome !== 'undefined' &&
        chrome.storage &&
        chrome.storage.local &&
        typeof chrome.storage.local.get === 'function';

    const readLocal = (key) => localStorage.getItem(key);
    const writeLocal = (key, value) => localStorage.setItem(key, value);

    const getChromeValue = async (key) => {
        if (!hasChromeStorage) return undefined;
        try {
            const result = await chrome.storage.local.get([key]);
            return result[key];
        } catch {
            return undefined;
        }
    };

    const setChromeValue = async (key, value) => {
        if (!hasChromeStorage) return;
        try {
            await chrome.storage.local.set({ [key]: value });
        } catch {
            // Keep UI functional if extension storage fails.
        }
    };

    const removeStoredKey = async (key) => {
        if (hasChromeStorage) {
            try {
                await chrome.storage.local.remove(key);
            } catch {
                // ignore
            }
        }
        localStorage.removeItem(key);
    };

    const Storage = {
        async getString(key, fallback = '') {
            const chromeValue = await getChromeValue(key);
            if (typeof chromeValue === 'string') return chromeValue;
            if (chromeValue !== undefined && chromeValue !== null) return String(chromeValue);

            const legacy = readLocal(key);
            if (legacy !== null) {
                await setChromeValue(key, legacy);
                return legacy;
            }
            return fallback;
        },
        async setString(key, value) {
            await setChromeValue(key, value);
            writeLocal(key, value);
        },
        async getNumber(key, fallback = 0) {
            const chromeValue = await getChromeValue(key);
            if (typeof chromeValue === 'number' && Number.isFinite(chromeValue)) return chromeValue;
            if (typeof chromeValue === 'string') {
                const parsed = Number.parseInt(chromeValue, 10);
                if (Number.isFinite(parsed)) return parsed;
            }

            const legacy = readLocal(key);
            if (legacy !== null) {
                const parsed = Number.parseInt(legacy, 10);
                if (Number.isFinite(parsed)) {
                    await setChromeValue(key, parsed);
                    return parsed;
                }
            }
            return fallback;
        },
        async setNumber(key, value) {
            await setChromeValue(key, value);
            writeLocal(key, String(value));
        },
        async getJSON(key, fallback) {
            const chromeValue = await getChromeValue(key);
            if (chromeValue !== undefined) return chromeValue;

            const legacy = readLocal(key);
            if (legacy !== null) {
                try {
                    const parsed = JSON.parse(legacy);
                    await setChromeValue(key, parsed);
                    return parsed;
                } catch {
                    return fallback;
                }
            }
            return fallback;
        },
        async setJSON(key, value) {
            await setChromeValue(key, value);
            writeLocal(key, JSON.stringify(value));
        },
        remove: removeStoredKey
    };

    let focusMode = false;
    let dataPanelOpen = false;
    let linkModalResolver = null;
    let calendarRefreshTimer;
    let toastTimer;
    let createShortcutFlow = async () => { };
    let resetArmedUntil = 0;

    const SEARCH_ENGINES = {
        google: {
            label: 'Google',
            url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`
        },
        duckduckgo: {
            label: 'DuckDuckGo',
            url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}`
        },
        bing: {
            label: 'Bing',
            url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`
        },
        brave: {
            label: 'Brave',
            url: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}`
        },
        perplexity: {
            label: 'Perplexity',
            url: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}`
        }
    };

    const makeId = () => {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    };

    const truncate = (value, maxLen) => value.trim().slice(0, maxLen);

    const normalizeUrl = (rawUrl) => {
        if (!rawUrl || typeof rawUrl !== 'string') return null;
        const candidate = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
        try {
            const parsed = new URL(candidate);
            if (!['http:', 'https:'].includes(parsed.protocol)) return null;
            return parsed.toString();
        } catch {
            return null;
        }
    };

    const isEditableTarget = (target) => {
        if (!target || typeof target.closest !== 'function') return false;
        return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
    };

    const animateIn = (node, index = 0) => {
        node.classList.add('reveal-item');
        node.style.setProperty('--delay', `${Math.min(index * 35, 280)}ms`);
        return node;
    };

    const toCssBackgroundValue = (rawValue) => {
        if (!rawValue || typeof rawValue !== 'string') return CONFIG.defaultWallpaper;
        const trimmed = rawValue.trim();
        if (!trimmed) return CONFIG.defaultWallpaper;

        if (
            trimmed.startsWith('url(') ||
            trimmed.startsWith('linear-gradient(') ||
            trimmed.startsWith('radial-gradient(')
        ) {
            return trimmed;
        }

        if (
            trimmed.startsWith('data:image/') ||
            trimmed.startsWith('blob:') ||
            /^https?:\/\//i.test(trimmed)
        ) {
            const escaped = trimmed.replace(/"/g, '\\"');
            return `url("${escaped}")`;
        }

        return CONFIG.defaultWallpaper;
    };

    const setBackgroundImage = (rawValue) => {
        const cssValue = toCssBackgroundValue(rawValue);
        const probe = document.createElement('div');
        probe.style.backgroundImage = cssValue;
        if (!probe.style.backgroundImage) return false;

        document.documentElement.style.setProperty('--bg-image', cssValue);
        if (DOM.bgLayer) DOM.bgLayer.style.backgroundImage = cssValue;
        return true;
    };

    const getSearchEngineValue = (value) => (
        typeof value === 'string' && value in SEARCH_ENGINES ? value : 'google'
    );

    const showToast = (message, type = 'info') => {
        if (!DOM.toast) return;

        DOM.toast.className = 'toast';
        DOM.toast.textContent = message;
        if (type === 'success') DOM.toast.classList.add('success');
        if (type === 'error') DOM.toast.classList.add('error');

        DOM.toast.classList.remove('show');
        void DOM.toast.offsetWidth;
        DOM.toast.classList.add('show');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            DOM.toast.classList.remove('show');
        }, 2200);
    };

    const downloadFile = (filename, content, mimeType = 'application/json') => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const readFileAsText = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });

    const setDataPanel = (open) => {
        dataPanelOpen = open;
        if (!DOM.dataPanel || !DOM.btnData) return;
        DOM.dataPanel.hidden = !open;
        DOM.btnData.setAttribute('aria-expanded', String(open));
    };

    const setFocusMode = (enabled) => {
        focusMode = Boolean(enabled);
        DOM.body.classList.toggle('focus-mode', focusMode);
        DOM.btnFocus.classList.toggle('focus-active', focusMode);
        DOM.btnFocus.setAttribute('aria-pressed', String(focusMode));
        DOM.btnFocus.setAttribute('title', focusMode ? 'Zen Mode Enabled' : 'Zen Mode');
        DOM.btnZenBack.tabIndex = focusMode ? 0 : -1;
        if (focusMode) setDataPanel(false);
    };
    const closeLinkModal = (payload = null) => {
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

        closeLinkModal({ id: makeId(), name, url });
    };

    const openLinkModal = (prefill = {}) => {
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

    const initLinkModal = () => {
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

    const initClock = () => {
        const tick = () => {
            const now = new Date();
            const h = now.getHours();
            const m = now.getMinutes().toString().padStart(2, '0');
            DOM.clock.textContent = `${h % 12 || 12}:${m}`;

            let greeting = '';
            if (h >= 5 && h < 12) greeting = 'Good morning';
            else if (h >= 12 && h < 17) greeting = 'Good afternoon';
            else if (h >= 17 && h < 22) greeting = 'Good evening';
            else greeting = 'Up late';

            DOM.greeting.textContent = `${greeting}.`;

            const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
            setTimeout(tick, msUntilNextMinute);
        };
        tick();
    };

    const initCalendar = () => {
        const now = new Date();
        const today = now.getDate();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        DOM.calMonth.textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });

        const fragment = document.createDocumentFragment();
        let todayElement = null;

        for (let i = 1; i <= daysInMonth; i++) {
            const dateObj = new Date(now.getFullYear(), now.getMonth(), i);
            const dayName = daysOfWeek[dateObj.getDay()];

            const dayWrap = document.createElement('div');
            dayWrap.className = `cal-day ${i < today ? 'passed' : i === today ? 'today' : ''}`;

            const dayLabel = document.createElement('span');
            dayLabel.className = 'cal-day-label';
            dayLabel.textContent = dayName;

            const dayNum = document.createElement('span');
            dayNum.textContent = String(i);

            dayWrap.appendChild(dayLabel);
            dayWrap.appendChild(dayNum);

            if (i === today) todayElement = dayWrap;
            fragment.appendChild(dayWrap);
        }

        DOM.calDays.innerHTML = '';
        DOM.calDays.appendChild(fragment);

        if (todayElement) {
            requestAnimationFrame(() => {
                const scrollPos = todayElement.offsetLeft - (DOM.calDays.offsetWidth / 2) + (todayElement.offsetWidth / 2);
                DOM.calDays.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
            });
        }

        clearTimeout(calendarRefreshTimer);
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const msToMidnight = nextMidnight.getTime() - now.getTime();
        calendarRefreshTimer = setTimeout(initCalendar, msToMidnight + 750);
    };

    const initControls = async () => {
        let isDark = (await Storage.getString(CONFIG.keys.theme, 'dark')) !== 'light';

        const SVG_MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        const SVG_SUN = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';

        const applyTheme = () => {
            document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
            DOM.iconTheme.innerHTML = isDark ? SVG_MOON : SVG_SUN;
            DOM.btnTheme.setAttribute('aria-pressed', String(!isDark));
        };

        const applyBackground = async () => {
            setBackgroundImage(CONFIG.defaultWallpaper);
        };

        applyTheme();
        await Storage.remove(CONFIG.keys.customBg);
        await applyBackground();
        await Storage.remove(CONFIG.keys.legacyBgIndex);

        DOM.btnTheme.addEventListener('click', () => {
            isDark = !isDark;
            void Storage.setString(CONFIG.keys.theme, isDark ? 'dark' : 'light');
            applyTheme();
        });

        DOM.btnBgDefault.addEventListener('click', async () => {
            await applyBackground();
            DOM.btnBgDefault.classList.remove('pulse-once');
            void DOM.btnBgDefault.offsetWidth;
            DOM.btnBgDefault.classList.add('pulse-once');
            showToast('Using default abstract wallpaper.', 'success');
        });

        DOM.btnFocus.setAttribute('aria-pressed', 'false');
        DOM.btnFocus.addEventListener('click', () => setFocusMode(!focusMode));
        DOM.btnZenBack.addEventListener('click', () => {
            setFocusMode(false);
            DOM.btnFocus.focus();
        });
    };

    const initSearch = async () => {
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
                showToast(`Search engine set to ${SEARCH_ENGINES[selectedEngine].label}.`, 'success');
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
    const initLinks = async () => {
        const getDomain = (url) => {
            try {
                return new URL(url).hostname.replace('www.', '');
            } catch {
                return url;
            }
        };

        // Cache favicon fallback SVGs to avoid recreating on every render
        const faviconCache = new Map();
        const getFallback = (name) => {
            const letter = (name.trim().charAt(0) || '?').toUpperCase().replace(/[^A-Z0-9]/, '?');
            if (!faviconCache.has(letter)) {
                const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#ffffff15" rx="32"/><text x="50%" y="54%" fill="#ffffff" font-family="sans-serif" font-size="64" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${letter}</text></svg>`;
                faviconCache.set(letter, `data:image/svg+xml,${encodeURIComponent(svg)}`);
            }
            return faviconCache.get(letter);
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
                        url
                    };
                })
                .filter(Boolean);
        };

        let custom = sanitizeCustomLinks(await Storage.getJSON(CONFIG.keys.customLinks, []));
        void Storage.setJSON(CONFIG.keys.customLinks, custom);

        const saveCustom = () => Storage.setJSON(CONFIG.keys.customLinks, custom);

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
                        custom = custom.filter((item) => item.id !== link.id);
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

        const render = async () => {
            DOM.linksContainer.innerHTML = '';

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

            const customGrp = document.createElement('div');
            customGrp.className = 'link-category';

            const customTitle = document.createElement('h3');
            customTitle.textContent = 'My Shortcuts';

            const customGrid = document.createElement('div');
            customGrid.className = 'app-grid';

            custom.forEach((link, i) => {
                customGrid.appendChild(animateIn(createNode(link, true), i));
            });

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
                void createShortcutFlow();
            });

            customGrid.appendChild(animateIn(addWrap, custom.length + 1));
            customGrp.appendChild(customTitle);
            customGrp.appendChild(customGrid);
            DOM.linksContainer.appendChild(customGrp);
        };

        createShortcutFlow = async () => {
            setDataPanel(false);
            const result = await openLinkModal();
            if (!result) return;

            const duplicate = custom.some((link) => link.url === result.url);
            if (duplicate) {
                showToast('That shortcut already exists.', 'error');
                return;
            }

            custom.push(result);
            await saveCustom();
            await render();
            showToast('Shortcut added.', 'success');
        };

        await render();
    };
    const initTasks = async () => {
        const sanitizeTasks = (raw) => {
            if (!Array.isArray(raw)) return [];
            return raw
                .map((item) => {
                    if (!item || typeof item !== 'object') return null;
                    const text = truncate(String(item.text || ''), CONFIG.maxTaskLength);
                    if (!text) return null;
                    return {
                        id: typeof item.id === 'string' ? item.id : makeId(),
                        text,
                        done: Boolean(item.done)
                    };
                })
                .filter(Boolean);
        };

        let tasks = sanitizeTasks(await Storage.getJSON(CONFIG.keys.tasks, []));
        void Storage.setJSON(CONFIG.keys.tasks, tasks);

        const save = () => Storage.setJSON(CONFIG.keys.tasks, tasks);

        const render = () => {
            DOM.listTasks.innerHTML = '';
            const frag = document.createDocumentFragment();

            tasks.forEach((task, i) => {
                const li = document.createElement('li');
                li.className = `list-item ${task.done ? 'checked' : ''}`;
                li.dataset.id = task.id;

                const check = document.createElement('div');
                check.className = 'check-box';
                check.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>';

                const text = document.createElement('span');
                text.className = 'item-text';
                text.textContent = task.text;

                const del = document.createElement('button');
                del.className = 'btn-del';
                del.type = 'button';
                del.title = 'Delete';
                del.setAttribute('aria-label', `Delete task: ${task.text}`);
                del.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

                li.appendChild(check);
                li.appendChild(text);
                li.appendChild(del);
                frag.appendChild(animateIn(li, i));
            });

            DOM.listTasks.appendChild(frag);
        };

        DOM.listTasks.addEventListener('click', (e) => {
            const li = e.target.closest('.list-item');
            if (!li) return;

            const id = li.dataset.id;
            const index = tasks.findIndex((task) => task.id === id);
            if (index === -1) return;

            if (e.target.closest('.btn-del')) {
                li.classList.add('is-leaving');
                setTimeout(() => {
                    tasks = tasks.filter((task) => task.id !== id);
                    void save();
                    render();
                    showToast('Task deleted.', 'success');
                }, 220);
                return;
            }

            tasks[index].done = !tasks[index].done;
            void save();
            render();
        });

        DOM.inputTask.addEventListener('keydown', (e) => {
            const value = truncate(DOM.inputTask.value || '', CONFIG.maxTaskLength);
            if (e.key === 'Enter' && value) {
                tasks.push({ id: makeId(), text: value, done: false });
                DOM.inputTask.value = '';
                void save();
                render();
            }
        });

        render();
    };

    const initNotes = async () => {
        DOM.scratchpad.value = await Storage.getString(CONFIG.keys.notes, '');

        let saveTimer;
        DOM.scratchpad.addEventListener('input', (e) => {
            clearTimeout(saveTimer);
            const nextValue = String(e.target.value || '');
            saveTimer = setTimeout(() => {
                void Storage.setString(CONFIG.keys.notes, nextValue);
            }, 250);
        });
    };

    const initPomodoro = async () => {
        let timerInterval;
        let mode = 'focus';
        let isRunning = false;
        let endAt = null;
        let timeLeft = CONFIG.focusDurationSec;

        const durationForMode = (nextMode) => (
            nextMode === 'break' ? CONFIG.breakDurationSec : CONFIG.focusDurationSec
        );

        const notifyCompletion = async (message) => {
            showToast(message, 'success');

            if (!('Notification' in window)) return;

            if (Notification.permission === 'granted') {
                try {
                    new Notification('Aura Focus Timer', { body: message });
                } catch {
                    // Silent fallback toast already shown.
                }
                return;
            }

            if (Notification.permission === 'default') {
                try {
                    await Notification.requestPermission();
                } catch {
                    // Ignore permission errors.
                }
            }
        };

        const persist = () => Storage.setJSON(CONFIG.keys.pomoState, {
            mode,
            isRunning,
            endAt,
            timeLeft
        });

        const updateDisplay = () => {
            const safeTime = Math.max(0, Math.floor(timeLeft));
            const min = Math.floor(safeTime / 60).toString().padStart(2, '0');
            const sec = (safeTime % 60).toString().padStart(2, '0');
            DOM.pomoTime.textContent = `${min}:${sec}`;
            DOM.btnPomoStart.textContent = isRunning ? 'Pause' : 'Start';
            DOM.btnPomoMode.textContent = mode === 'focus' ? 'Break' : 'Focus';
            DOM.btnPomoMode.title = mode === 'focus' ? 'Switch to break timer' : 'Switch to focus timer';
        };

        const stopTimerLoop = () => {
            clearInterval(timerInterval);
            timerInterval = undefined;
        };

        const completeSession = async () => {
            const finishedMode = mode;
            isRunning = false;
            endAt = null;
            stopTimerLoop();

            mode = finishedMode === 'focus' ? 'break' : 'focus';
            timeLeft = durationForMode(mode);
            updateDisplay();
            void persist();

            const message = finishedMode === 'focus'
                ? 'Focus session complete. Time for a short break.'
                : 'Break complete. Back to focus.';

            await notifyCompletion(message);
        };

        const syncRunningTimer = () => {
            if (!isRunning || !endAt) return;

            const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
            if (remaining !== timeLeft) {
                timeLeft = remaining;
                updateDisplay();
                void persist();
            }

            if (remaining <= 0) {
                void completeSession();
            }
        };

        const startTimer = () => {
            if (isRunning) return;
            isRunning = true;
            endAt = Date.now() + (timeLeft * 1000);
            stopTimerLoop();
            timerInterval = setInterval(syncRunningTimer, 1000);
            updateDisplay();
            void persist();
        };

        const pauseTimer = () => {
            if (!isRunning) return;
            const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
            timeLeft = remaining;
            isRunning = false;
            endAt = null;
            stopTimerLoop();
            updateDisplay();
            void persist();
        };

        const resetTimer = () => {
            isRunning = false;
            endAt = null;
            stopTimerLoop();
            timeLeft = durationForMode(mode);
            updateDisplay();
            void persist();
        };

        const switchMode = () => {
            if (isRunning) {
                showToast('Pause timer before switching mode.', 'error');
                return;
            }
            mode = mode === 'focus' ? 'break' : 'focus';
            timeLeft = durationForMode(mode);
            updateDisplay();
            void persist();
        };

        const saved = await Storage.getJSON(CONFIG.keys.pomoState, null);
        if (saved && typeof saved === 'object') {
            mode = saved.mode === 'break' ? 'break' : 'focus';
            timeLeft = Number.isFinite(saved.timeLeft)
                ? Math.max(0, Math.floor(saved.timeLeft))
                : durationForMode(mode);
            isRunning = Boolean(saved.isRunning);
            endAt = Number.isFinite(saved.endAt) ? saved.endAt : null;

            if (isRunning && endAt) {
                const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
                if (remaining > 0) {
                    timeLeft = remaining;
                    timerInterval = setInterval(syncRunningTimer, 1000);
                } else {
                    isRunning = false;
                    endAt = null;
                    timeLeft = durationForMode(mode);
                }
            } else {
                isRunning = false;
                endAt = null;
            }
        }

        DOM.btnPomoStart.addEventListener('click', async () => {
            // Request notification permission on first interaction
            if ('Notification' in window && Notification.permission === 'default') {
                try {
                    await Notification.requestPermission();
                } catch {
                    // Ignore permission errors
                }
            }
            if (isRunning) pauseTimer();
            else startTimer();
        });

        DOM.btnPomoReset.addEventListener('click', resetTimer);
        DOM.btnPomoMode.addEventListener('click', switchMode);

        updateDisplay();
    };
    const initDataTools = () => {
        DOM.btnData.addEventListener('click', (e) => {
            e.stopPropagation();
            setDataPanel(!dataPanelOpen);
        });

        document.addEventListener('click', (e) => {
            if (!dataPanelOpen) return;
            if (DOM.controls.contains(e.target)) return;
            setDataPanel(false);
        });

        DOM.btnExport.addEventListener('click', async () => {
            const payload = {
                version: 2,
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

    const initKeyboardShortcuts = () => {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            if (key === 'escape') {
                if (!DOM.linkModal.hidden) {
                    e.preventDefault();
                    closeLinkModal(null);
                    return;
                }
                if (dataPanelOpen) {
                    e.preventDefault();
                    setDataPanel(false);
                    return;
                }
                if (focusMode) {
                    e.preventDefault();
                    setFocusMode(false);
                }
                return;
            }

            if (!DOM.linkModal.hidden) return;
            if (isEditableTarget(e.target)) return;
            if (focusMode) return;

            if (key === '/') {
                e.preventDefault();
                DOM.search.focus();
                DOM.search.select();
                return;
            }

            if (key === 'f') {
                e.preventDefault();
                setFocusMode(!focusMode);
                return;
            }

            if (key === 'n') {
                e.preventDefault();
                void createShortcutFlow();
                return;
            }

            if (key === 't') {
                e.preventDefault();
                DOM.inputTask.focus();
                return;
            }

            if (key === 'd') {
                e.preventDefault();
                setDataPanel(!dataPanelOpen);
            }
        });
    };

    return {
        start: async () => {
            initLinkModal();
            initClock();
            initCalendar();
            await initControls();
            await initSearch();
            await initLinks();
            await initTasks();
            await initNotes();
            await initPomodoro();
            initDataTools();
            initKeyboardShortcuts();
        }
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    void App.start().catch((err) => {
        console.error('Aura failed to initialize:', err);
    });
});
