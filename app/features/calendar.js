/**
 * AURA ULTRA PREMIUM - Calendar Feature
 * Month strip with day indicators
 * Optimized: incremental update at midnight, full rebuild only on month change
 */

import { DOM } from '../core/dom.js';

let calendarRefreshTimer = null;

const renderMonth = (now) => {
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

const updateTodayOnly = () => {
    const today = new Date().getDate();
    DOM.calDays.querySelectorAll('.cal-day').forEach((day, i) => {
        const dayNum = i + 1;
        day.classList.toggle('passed', dayNum < today);
        day.classList.toggle('today', dayNum === today);
    });
};

export const initCalendar = () => {
    const now = new Date();
    renderMonth(now);

    // Schedule next update
    scheduleNextUpdate(now);
};

const scheduleNextUpdate = (now) => {
    clearTimeout(calendarRefreshTimer);

    // Check if next midnight crosses month boundary
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msToMidnight = nextMidnight.getTime() - now.getTime();

    // If month changes, do full re-render; otherwise just update today
    const monthChanges = nextMidnight.getMonth() !== now.getMonth();

    calendarRefreshTimer = setTimeout(() => {
        if (monthChanges) {
            initCalendar(); // Full rebuild for new month
        } else {
            updateTodayOnly(); // Incremental update
            // Schedule another update for the next day
            scheduleNextUpdate(new Date());
        }
    }, msToMidnight + 750);
};

// Exported for manual refresh if needed
export const refreshCalendar = () => {
    const now = new Date();
    renderMonth(now);
    scheduleNextUpdate(now);
};