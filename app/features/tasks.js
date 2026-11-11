/**
 * AURA ULTRA PREMIUM - Tasks Feature
 * Todo list with add, toggle, delete, and drag-to-reorder
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

let draggedItem = null;
let dragSourceIndex = -1;

const render = () => {
    DOM.listTasks.innerHTML = '';
    const frag = document.createDocumentFragment();

    tasks.forEach((task, i) => {
        const li = document.createElement('li');
        li.className = `list-item ${task.done ? 'checked' : ''}`;
        li.dataset.id = task.id;
        li.draggable = true;
        li.dataset.index = i;

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

        // Drag handle
        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.setAttribute('aria-label', 'Drag to reorder');
        dragHandle.style.cssText = `
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            cursor: grab;
            flex-shrink: 0;
            opacity: 0;
            transition: opacity 0.2s, color 0.2s;
        `;
        dragHandle.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" stroke-width="2.5"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
        li.insertBefore(dragHandle, li.firstChild);

        li.appendChild(check);
        li.appendChild(text);
        li.appendChild(del);
        frag.appendChild(animateIn(li, i));

        // Drag events
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragend', handleDragEnd);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('dragenter', handleDragEnter);
        li.addEventListener('dragleave', handleDragLeave);
        li.addEventListener('drop', handleDrop);

        // Show drag handle on hover
        li.addEventListener('mouseenter', () => { dragHandle.style.opacity = '1'; });
        li.addEventListener('mouseleave', () => { if (!li.classList.contains('dragging')) dragHandle.style.opacity = '0'; });
    });

    DOM.listTasks.appendChild(frag);
};

const handleDragStart = (e) => {
    if (e.target.closest('.btn-del') || e.target.closest('.check-box') || e.target.closest('input')) {
        e.preventDefault();
        return;
    }
    draggedItem = e.currentTarget;
    dragSourceIndex = parseInt(draggedItem.dataset.index, 10);
    draggedItem.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItem.dataset.id);

    // Hide drag handle on other items
    DOM.listTasks.querySelectorAll('.list-item:not(.dragging) .drag-handle').forEach(h => h.style.opacity = '0');
};

const handleDragEnd = (e) => {
    if (!draggedItem) return;
    draggedItem.classList.remove('dragging');
    DOM.listTasks.querySelectorAll('.list-item').forEach(li => li.classList.remove('drag-over'));
    draggedItem = null;
    dragSourceIndex = -1;
};

const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};

const handleDragEnter = (e) => {
    const target = e.currentTarget;
    if (target === draggedItem) return;
    target.classList.add('drag-over');
};

const handleDragLeave = (e) => {
    const target = e.currentTarget;
    // Only remove if actually leaving the element (not entering a child)
    if (!target.contains(e.relatedTarget)) {
        target.classList.remove('drag-over');
    }
};

const handleDrop = (e) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.remove('drag-over');

    if (!draggedItem || target === draggedItem) return;

    const targetIndex = parseInt(target.dataset.index, 10);
    if (dragSourceIndex === targetIndex) return;

    // Reorder tasks array
    const [movedTask] = tasks.splice(dragSourceIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);

    void save();
    render();
    showToast('Task reordered.', 'success');
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

        if (e.target.closest('.check-box') || e.target.closest('.item-text')) {
            tasks[index].done = !tasks[index].done;
            void save();
            render();
        }
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