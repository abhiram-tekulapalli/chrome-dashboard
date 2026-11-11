/**
 * AURA ULTRA PREMIUM - Clock Feature
 * Live clock with greeting
 */

import { DOM } from '../core/dom.js';

export const initClock = () => {
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