/**
 * AURA ULTRA PREMIUM - Internet Speed Test
 * Minimal, info-based speed indicator in sidebar
 */

import { DOM } from '../core/dom.js';
import { showToast } from '../ui/toast.js';

// Test configuration
const TEST_CONFIG = {
    // Small test files for quick measurement
    downloadUrl: 'https://speed.cloudflare.com/__down?bytes=100000', // 100KB
    uploadUrl: 'https://speed.cloudflare.com/__up',
    uploadSize: 50000, // 50KB
    timeout: 15000, // 15s max per test
    // Fallback to a simple latency test if main test fails
    latencyUrl: 'https://www.google.com/favicon.ico'
};

let speedTestState = {
    isRunning: false,
    lastResult: null,
    lastTestTime: null
};

const formatSpeed = (bytesPerSec) => {
    const mbps = (bytesPerSec * 8) / 1_000_000;
    if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
    if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`;
    return `${(mbps * 1000).toFixed(0)} Kbps`;
};

const formatLatency = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
};

const measureLatency = async () => {
    const start = performance.now();
    try {
        await fetch(TEST_CONFIG.latencyUrl, { method: 'HEAD', cache: 'no-cache', mode: 'no-cors' });
        return performance.now() - start;
    } catch {
        // no-cors mode doesn't give accurate timing, try with cors
        try {
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 5000);
            await fetch(TEST_CONFIG.latencyUrl, { method: 'HEAD', cache: 'no-cache', signal: ctrl.signal });
            clearTimeout(timeout);
            return performance.now() - start;
        } catch {
            return null;
        }
    }
};

const measureDownload = async () => {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), TEST_CONFIG.timeout);

    try {
        const start = performance.now();
        const response = await fetch(TEST_CONFIG.downloadUrl, {
            method: 'GET',
            cache: 'no-cache',
            signal: ctrl.signal
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error('Download test failed');

        const data = await response.blob();
        const elapsed = (performance.now() - start) / 1000; // seconds
        const bytesPerSec = data.size / elapsed;
        return bytesPerSec;
    } catch (e) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') throw new Error('Download test timed out');
        throw e;
    }
};

const measureUpload = async () => {
    // Generate random data for upload
    const data = new Uint8Array(TEST_CONFIG.uploadSize);
    crypto.getRandomValues(data);
    const blob = new Blob([data]);

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), TEST_CONFIG.timeout);

    try {
        const start = performance.now();
        const response = await fetch(TEST_CONFIG.uploadUrl, {
            method: 'POST',
            body: blob,
            cache: 'no-cache',
            signal: ctrl.signal
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error('Upload test failed');

        const elapsed = (performance.now() - start) / 1000; // seconds
        const bytesPerSec = TEST_CONFIG.uploadSize / elapsed;
        return bytesPerSec;
    } catch (e) {
        clearTimeout(timeout);
        if (e.name === 'AbortError') throw new Error('Upload test timed out');
        throw e;
    }
};

const createSpeedTestModule = () => {
    const container = document.createElement('div');
    container.className = 'speedtest-module';
    container.style.cssText = `
        padding: 1rem;
        text-align: center;
        min-height: 100px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
    `;

    container.innerHTML = `
        <div class="speedtest-header" style="display: flex; align-items: center; gap: 0.5rem; width: 100%; justify-content: center;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--text-muted);">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                <path d="M21 3v7h-7"></path>
                <path d="M3 21v-7h7"></path>
            </svg>
            <span style="font-weight: 600; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted);">Speed</span>
        </div>
        <div class="speedtest-results" style="display: flex; flex-direction: column; gap: 0.4rem; width: 100%;">
            <div class="speedtest-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid var(--glass-border);">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Download</span>
                <span class="speedtest-download" style="font-size: 0.9rem; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--text-main);">--</span>
            </div>
            <div class="speedtest-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid var(--glass-border);">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Upload</span>
                <span class="speedtest-upload" style="font-size: 0.9rem; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--text-main);">--</span>
            </div>
            <div class="speedtest-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0;">
                <span style="font-size: 0.8rem; color: var(--text-muted);">Latency</span>
                <span class="speedtest-latency" style="font-size: 0.9rem; font-weight: 600; font-variant-numeric: tabular-nums; color: var(--text-main);">--</span>
            </div>
        </div>
        <button class="speedtest-btn" type="button" style="
            margin-top: 0.5rem;
            padding: 0.5rem 1rem;
            background: var(--glass-highlight);
            border: 1px solid var(--glass-border);
            color: var(--text-main);
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: all 0.2s;
            width: 100%;
            max-width: 200px;
        ">Run Speed Test</button>
        <div class="speedtest-status" style="font-size: 0.7rem; color: var(--text-muted); height: 1rem; min-height: 1rem;"></div>
    `;

    const btn = container.querySelector('.speedtest-btn');
    const status = container.querySelector('.speedtest-status');
    const downloadEl = container.querySelector('.speedtest-download');
    const uploadEl = container.querySelector('.speedtest-upload');
    const latencyEl = container.querySelector('.speedtest-latency');

    btn.addEventListener('mouseenter', () => {
        btn.style.background = 'var(--text-main)';
        btn.style.color = 'var(--bg-overlay)';
    });
    btn.addEventListener('mouseleave', () => {
        if (!speedTestState.isRunning) {
            btn.style.background = 'var(--glass-highlight)';
            btn.style.color = 'var(--text-main)';
        }
    });

    btn.addEventListener('click', async () => {
        if (speedTestState.isRunning) return;

        speedTestState.isRunning = true;
        btn.disabled = true;
        btn.textContent = 'Testing...';
        btn.style.background = 'var(--glass-border)';
        btn.style.color = 'var(--text-muted)';
        status.textContent = 'Measuring latency...';

        try {
            // Latency test
            const latency = await measureLatency();
            if (latency !== null) {
                latencyEl.textContent = formatLatency(latency);
            } else {
                latencyEl.textContent = 'N/A';
            }
            status.textContent = 'Testing download...';

            // Download test
            const downloadSpeed = await measureDownload();
            downloadEl.textContent = formatSpeed(downloadSpeed);
            status.textContent = 'Testing upload...';

            // Upload test
            const uploadSpeed = await measureUpload();
            uploadEl.textContent = formatSpeed(uploadSpeed);

            speedTestState.lastResult = {
                download: downloadSpeed,
                upload: uploadSpeed,
                latency: latency,
                timestamp: Date.now()
            };
            speedTestState.lastTestTime = Date.now();

            status.textContent = `Last test: ${new Date().toLocaleTimeString()}`;
            showToast('Speed test complete', 'success');
        } catch (error) {
            status.textContent = `Error: ${error.message}`;
            showToast(`Speed test failed: ${error.message}`, 'error');
        } finally {
            speedTestState.isRunning = false;
            btn.disabled = false;
            btn.textContent = 'Run Speed Test';
            btn.style.background = 'var(--glass-highlight)';
            btn.style.color = 'var(--text-main)';
        }
    });

    // Load last result if available
    if (speedTestState.lastResult) {
        downloadEl.textContent = formatSpeed(speedTestState.lastResult.download);
        uploadEl.textContent = formatSpeed(speedTestState.lastResult.upload);
        if (speedTestState.lastResult.latency) {
            latencyEl.textContent = formatLatency(speedTestState.lastResult.latency);
        }
        if (speedTestState.lastTestTime) {
            status.textContent = `Last test: ${new Date(speedTestState.lastTestTime).toLocaleTimeString()}`;
        }
    }

    return container;
};

export const initSpeedTest = () => {
    // Add speed test module to sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const module = createSpeedTestModule();
        const wrapper = document.createElement('div');
        wrapper.className = 'bento side-module';
        wrapper.style.padding = '1.25rem';
        wrapper.appendChild(module);
        sidebar.appendChild(wrapper);
    }
};