/**
 * AURA ULTRA PREMIUM - Theme Feature
 * Light/dark theme toggle and background management
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG, setBackgroundImage } from '../core/utils.js';
import { showToast } from '../ui/toast.js';

const SVG_MOON = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
const SVG_SUN = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';

let isDark = true;

const applyTheme = () => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    DOM.iconTheme.innerHTML = isDark ? SVG_MOON : SVG_SUN;
    DOM.btnTheme.setAttribute('aria-pressed', String(!isDark));
};

const applyBackground = async () => {
    setBackgroundImage(CONFIG.defaultWallpaper);
};

export const initTheme = async () => {
    isDark = (await Storage.getString(CONFIG.keys.theme, 'dark')) !== 'light';

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
};

export const getThemeState = () => isDark;
export const setThemeState = (dark) => {
    isDark = dark;
    applyTheme();
};