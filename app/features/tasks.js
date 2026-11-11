/**
 * AURA ULTRA PREMIUM - Tasks Feature
 * Todo list with add, toggle, delete
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG, makeId, truncate, animateIn } from '../core/utils.js';
import { showToast } from '../ui/toast.js';

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

let tasks = [];

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

export const initTasks = async () => {
    tasks = sanitizeTasks(await Storage.getJSON(CONFIG.keys.tasks, []));
    void Storage.setJSON(CONFIG.keys.tasks, tasks);

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