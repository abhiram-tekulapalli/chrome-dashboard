/**
 * AURA ULTRA PREMIUM - Shared Utilities
 */

export const makeId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const truncate = (value, maxLen) => value.trim().slice(0, maxLen);

export const normalizeUrl = (rawUrl) => {
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

export const isEditableTarget = (target) => {
    if (!target || typeof target.closest !== 'function') return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
};

export const animateIn = (node, index = 0) => {
    node.classList.add('reveal-item');
    node.style.setProperty('--delay', `${Math.min(index * 35, 280)}ms`);
    return node;
};

export const toCssBackgroundValue = (rawValue) => {
    if (!rawValue || typeof rawValue !== 'string') return null;
    const trimmed = rawValue.trim();
    if (!trimmed) return null;

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

    return null;
};

export const setBackgroundImage = (rawValue) => {
    const cssValue = toCssBackgroundValue(rawValue);
    if (!cssValue) return false;

    const probe = document.createElement('div');
    probe.style.backgroundImage = cssValue;
    if (!probe.style.backgroundImage) return false;

    document.documentElement.style.setProperty('--bg-image', cssValue);
    return true;
};

export const downloadFile = (filename, content, mimeType = 'application/json') => {
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

export const readFileAsText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
});