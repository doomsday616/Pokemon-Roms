/**
 * 下载点击计数器
 * 全站共享版本：通过 /api/download-counter 调用 Cloudflare Worker + D1。
 */

(function() {
    'use strict';

    const DOWNLOAD_SELECTOR = '.list-group-item-danger .button-link[onclick*="window.open"]';
    const DEFAULT_API_BASE = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
        ? 'https://pokemon-roms.top/api/download-counter'
        : '/api/download-counter';
    const API_BASE = (window.DOWNLOAD_COUNTER_API || DEFAULT_API_BASE).replace(/\/$/, '');

    const counts = {};
    const keys = new Set();

    function extractDownloadUrl(button) {
        const inlineHandler = button.getAttribute('onclick') || '';
        const match = inlineHandler.match(/window\.open\(['"]([^'"]+)['"]/);
        return match ? match[1] : '';
    }

    function keyForUrl(url) {
        try {
            const parsed = new URL(url, window.location.href);
            parsed.hash = '';
            return parsed.href;
        } catch (error) {
            return url;
        }
    }

    function formatCount(count) {
        return Number.isFinite(count) ? `下载 ${count} 次` : '下载 -- 次';
    }

    function updateCounters(downloadKey) {
        document.querySelectorAll('.download-count').forEach(counter => {
            if (counter.dataset.downloadKey !== downloadKey) return;

            const label = formatCount(counts[downloadKey]);
            counter.textContent = label;
            counter.setAttribute('aria-label', label);
        });
    }

    function addCounter(button) {
        const url = extractDownloadUrl(button);
        if (!url) return;

        const downloadKey = keyForUrl(url);
        button.dataset.downloadKey = downloadKey;
        keys.add(downloadKey);

        if (button.nextElementSibling && button.nextElementSibling.classList.contains('download-count')) {
            button.nextElementSibling.dataset.downloadKey = downloadKey;
            updateCounters(downloadKey);
            return;
        }

        const counter = document.createElement('span');
        counter.className = 'download-count is-loading';
        counter.dataset.downloadKey = downloadKey;
        counter.textContent = formatCount();
        counter.setAttribute('aria-label', counter.textContent);
        button.insertAdjacentElement('afterend', counter);
    }

    function bindCounters() {
        document.querySelectorAll(DOWNLOAD_SELECTOR).forEach(addCounter);
    }

    async function postJSON(path, payload) {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Counter API returned ${response.status}`);
        }

        return response.json();
    }

    function markCountersLoaded(downloadKeys) {
        downloadKeys.forEach(downloadKey => {
            document.querySelectorAll('.download-count').forEach(counter => {
                if (counter.dataset.downloadKey === downloadKey) {
                    counter.classList.remove('is-loading', 'is-error');
                }
            });
        });
    }

    function markCountersError(downloadKeys) {
        downloadKeys.forEach(downloadKey => {
            document.querySelectorAll('.download-count').forEach(counter => {
                if (counter.dataset.downloadKey === downloadKey) {
                    counter.classList.remove('is-loading');
                    counter.classList.add('is-error');
                    counter.textContent = '计数暂不可用';
                    counter.setAttribute('aria-label', '下载计数暂不可用');
                }
            });
        });
    }

    async function loadCounts() {
        const downloadKeys = Array.from(keys);
        if (!downloadKeys.length) return;

        try {
            const data = await postJSON('/counts', { keys: downloadKeys });
            Object.entries(data.counts || {}).forEach(([downloadKey, count]) => {
                counts[downloadKey] = Number(count) || 0;
                updateCounters(downloadKey);
            });
            markCountersLoaded(downloadKeys);
        } catch (error) {
            console.warn('下载计数加载失败:', error);
            markCountersError(downloadKeys);
        }
    }

    async function incrementCount(downloadKey) {
        try {
            const nextCount = Number.isFinite(counts[downloadKey]) ? counts[downloadKey] + 1 : 1;
            counts[downloadKey] = nextCount;
            updateCounters(downloadKey);
            markCountersLoaded([downloadKey]);

            const data = await postJSON('/increment', { key: downloadKey });
            counts[downloadKey] = Number(data.count) || nextCount;
            updateCounters(downloadKey);
        } catch (error) {
            console.warn('下载计数更新失败:', error);
            markCountersError([downloadKey]);
        }
    }

    function handleDownloadClick(event) {
        const button = event.target.closest(DOWNLOAD_SELECTOR);
        if (!button) return;

        const downloadKey = button.dataset.downloadKey || keyForUrl(extractDownloadUrl(button));
        if (!downloadKey) return;

        incrementCount(downloadKey);
    }

    function init() {
        bindCounters();
        loadCounts();
        document.addEventListener('click', handleDownloadClick, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
