/**
 * AURA ULTRA PREMIUM - Calendar Feature
 * Month strip with day indicators
 */

import { DOM } from '../core/dom.js';

let calendarRefreshTimer = null;

export const initCalendar = () => {
    const render = () => {
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
    };

    render();

    // Schedule midnight refresh
    clearTimeout(calendarRefreshTimer);
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msToMidnight = nextMidnight.getTime() - now.getTime();
    calendarRefreshTimer = setTimeout(initCalendar, msToMidnight + 750);
};

// Optional: incremental update for "today" change (can be called daily)
export const updateCalendarToday = () => {
    const today = new Date().getDate();
    DOM.calDays.querySelectorAll('.cal-day').forEach((day, i) => {
        const dayNum = i + 1;
        day.classList.toggle('passed', dayNum < today);
        day.classList.toggle('today', dayNum === today);
    });
};