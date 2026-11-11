/**
 * AURA ULTRA PREMIUM - Settings Modal
 * User preferences UI
 */

import { DOM } from '../core/dom.js';
import { Storage } from '../core/storage.js';
import { CONFIG } from '../core/config.js';
import { loadSettings, saveSettings, getSettings, applySettings, DEFAULT_SETTINGS } from '../core/settings.js';
import { showToast, closeDataPanel } from './toast.js';

let settingsModalResolver = null;

const SETTINGS_SCHEMA = [
    {
        key: 'clockFormat',
        label: 'Clock Format',
        type: 'select',
        options: [
            { value: '12h', label: '12 Hour (1:30 PM)' },
            { value: '24h', label: '24 Hour (13:30)' }
        ],
        description: 'Time display format'
    },
    {
        key: 'pomodoroFocusDuration',
        label: 'Focus Duration',
        type: 'number',
        min: 1,
        max: 120,
        step: 1,
        unit: 'min',
        description: 'Work session length'
    },
    {
        key: 'pomodoroBreakDuration',
        label: 'Break Duration',
        type: 'number',
        min: 1,
        max: 60,
        step: 1,
        unit: 'min',
        description: 'Short break length'
    },
    {
        key: 'animationsEnabled',
        label: 'Animations',
        type: 'toggle',
        description: 'Enable UI animations and transitions'
    }
];

const createSettingControl = (setting, value) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'modal-field';
    wrapper.style.marginBottom = '1rem';

    const label = document.createElement('label');
    label.textContent = setting.label;
    label.style.fontSize = '0.78rem';
    label.style.color = 'var(--text-muted)';
    label.style.fontWeight = '600';
    label.style.letterSpacing = '0.3px';
    label.style.textTransform = 'uppercase';

    let input;

    if (setting.type === 'select') {
        input = document.createElement('select');
        input.style.cssText = `
            appearance: none;
            -webkit-appearance: none;
            background: rgba(255,255,255,0.06);
            color: var(--text-main);
            border: 1px solid var(--glass-border);
            border-radius: 999px;
            padding: 0.5rem 2rem 0.5rem 0.75rem;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            min-width: 180px;
            background-image: linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%);
            background-position: calc(100% - 14px) calc(50% - 1px), calc(100% - 9px) calc(50% - 1px);
            background-size: 5px 5px, 5px 5px;
            background-repeat: no-repeat;
        `;
        setting.options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            input.appendChild(option);
        });
        input.value = value;
    } else if (setting.type === 'number') {
        input = document.createElement('input');
        input.type = 'number';
        input.min = setting.min;
        input.max = setting.max;
        input.step = setting.step;
        input.value = value;
        input.style.cssText = `
            background: rgba(0,0,0,0.18);
            border: 1px solid transparent;
            border-radius: 10px;
            padding: 0.6rem 0.75rem;
            color: var(--text-main);
            outline: none;
            font-size: 0.9rem;
            width: 100px;
            transition: all 0.3s;
        `;
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--glass-border)';
            input.style.background = 'rgba(0,0,0,0.28)';
        });
        input.addEventListener('blur', () => {
            input.style.borderColor = 'transparent';
            input.style.background = 'rgba(0,0,0,0.18)';
        });
    } else if (setting.type === 'toggle') {
        const toggleWrapper = document.createElement('label');
        toggleWrapper.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
        `;
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = value;
        input.style.cssText = `
            width: 44px;
            height: 24px;
            appearance: none;
            -webkit-appearance: none;
            background: var(--glass-border);
            border-radius: 999px;
            position: relative;
            cursor: pointer;
            transition: background 0.2s;
        `;
        // Add custom thumb via pseudo-element approach using box-shadow
        const updateToggleStyle = () => {
            if (input.checked) {
                input.style.background = 'var(--text-main)';
            } else {
                input.style.background = 'var(--glass-border)';
            }
        };
        updateToggleStyle();
        input.addEventListener('change', updateToggleStyle);
        toggleWrapper.appendChild(input);

        const toggleLabel = document.createElement('span');
        toggleLabel.textContent = value ? 'Enabled' : 'Disabled';
        toggleLabel.style.fontSize = '0.85rem';
        toggleLabel.style.fontWeight = '500';
        input.addEventListener('change', () => {
            toggleLabel.textContent = input.checked ? 'Enabled' : 'Disabled';
        });
        toggleWrapper.appendChild(toggleLabel);
        input = toggleWrapper;
    }

    if (setting.description) {
        const desc = document.createElement('p');
        desc.textContent = setting.description;
        desc.style.fontSize = '0.7rem';
        desc.style.color = 'var(--text-muted)';
        desc.style.marginTop = '0.25rem';
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        wrapper.appendChild(desc);
    } else {
        wrapper.appendChild(label);
        wrapper.appendChild(input);
    }

    // Store reference to extract value later
    wrapper.dataset.settingKey = setting.key;
    wrapper._input = input;
    wrapper._getValue = () => {
        if (setting.type === 'toggle') {
            return input.querySelector('input').checked;
        }
        return setting.type === 'number' ? parseInt(input.value, 10) : input.value;
    };

    return wrapper;
};

export const openSettingsModal = () => {
    if (settingsModalResolver) return Promise.resolve(null);

    // Create modal if not exists
    let modal = document.getElementById('settings-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'settings-modal';
        modal.className = 'modal';
        modal.hidden = true;
        modal.innerHTML = `
            <div class="bento modal-card" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" style="max-width: 480px;">
                <h2 id="settings-modal-title" class="modal-title">Settings</h2>
                <div id="settings-fields" style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
                <div class="modal-row" style="margin-top: 1rem;">
                    <button id="settings-cancel-btn" class="modal-btn" type="button">Cancel</button>
                    <button id="settings-save-btn" class="modal-btn primary" type="button">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const fieldsContainer = modal.querySelector('#settings-fields');
    const currentSettings = getSettings();

    fieldsContainer.innerHTML = '';
    SETTINGS_SCHEMA.forEach(setting => {
        const value = currentSettings[setting.key] ?? DEFAULT_SETTINGS[setting.key];
        const control = createSettingControl(setting, value);
        fieldsContainer.appendChild(control);
    });

    return new Promise((resolve) => {
        settingsModalResolver = resolve;

        modal.hidden = false;
        document.body.classList.add('modal-open');
        requestAnimationFrame(() => {
            modal.querySelector('#settings-cancel-btn').focus();
        });

        // Save handler
        const saveHandler = async () => {
            const updates = {};
            fieldsContainer.querySelectorAll('[data-setting-key]').forEach(wrapper => {
                updates[wrapper.dataset.settingKey] = wrapper._getValue();
            });

            await saveSettings(updates);
            applySettings();
            showToast('Settings saved.', 'success');
            closeSettingsModal(true);
        };

        // Cleanup function
        const cleanup = () => {
            modal.querySelector('#settings-save-btn').removeEventListener('click', saveHandler);
            modal.querySelector('#settings-cancel-btn').removeEventListener('click', cancelHandler);
            modal.removeEventListener('click', backdropHandler);
            modal.removeEventListener('keydown', keydownHandler);
        };

        const cancelHandler = () => {
            cleanup();
            closeSettingsModal(false);
        };

        const backdropHandler = (e) => {
            if (e.target === modal) {
                cleanup();
                closeSettingsModal(false);
            }
        };

        const keydownHandler = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                cleanup();
                closeSettingsModal(false);
            }
        };

        modal.querySelector('#settings-save-btn').addEventListener('click', saveHandler);
        modal.querySelector('#settings-cancel-btn').addEventListener('click', cancelHandler);
        modal.addEventListener('click', backdropHandler);
        modal.addEventListener('keydown', keydownHandler);
    });
};

const closeSettingsModal = (saved) => {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.hidden = true;
        document.body.classList.remove('modal-open');
    }
    const resolver = settingsModalResolver;
    settingsModalResolver = null;
    if (resolver) resolver(saved);
};

export const initSettingsButton = () => {
    // Add settings button to data panel
    const dataPanel = document.getElementById('data-panel');
    if (dataPanel && !document.getElementById('btn-settings')) {
        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'btn-settings';
        settingsBtn.className = 'data-btn';
        settingsBtn.type = 'button';
        settingsBtn.textContent = 'Settings';
        settingsBtn.addEventListener('click', () => {
            closeDataPanel();
            void openSettingsModal();
        });
        // Insert before export button
        const exportBtn = document.getElementById('btn-export');
        if (exportBtn) {
            dataPanel.insertBefore(settingsBtn, exportBtn);
        }
    }
};