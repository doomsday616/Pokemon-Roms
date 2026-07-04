/**
 * 下载点击计数器
 * 静态站点版本：按浏览器本地 localStorage 记录每个下载链接的点击次数。
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'pokemon-roms-download-counts';
    const DOWNLOAD_SELECTOR = '.list-group-item-danger .button-link[onclick*="window.open"]';

    let memoryCounts = {};

    function loadCounts() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            memoryCounts = raw ? JSON.parse(raw) : {};
        } catch (error) {
            memoryCounts = {};
        }
    }

    function saveCounts() {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCounts));
        } catch (error) {
            // localStorage 不可用时保留本页内存计数。
        }
    }

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
        return `下载 ${count} 次`;
    }

    function updateCounters(downloadKey) {
        document
            .querySelectorAll('.download-count')
            .forEach(counter => {
                if (counter.dataset.downloadKey !== downloadKey) return;

                const label = formatCount(memoryCounts[downloadKey] || 0);
                counter.textContent = label;
                counter.setAttribute('aria-label', label);
            });
    }

    function addCounter(button) {
        const url = extractDownloadUrl(button);
        if (!url) return;

        const downloadKey = keyForUrl(url);
        button.dataset.downloadKey = downloadKey;

        if (button.nextElementSibling && button.nextElementSibling.classList.contains('download-count')) {
            button.nextElementSibling.dataset.downloadKey = downloadKey;
            updateCounters(downloadKey);
            return;
        }

        const counter = document.createElement('span');
        counter.className = 'download-count';
        counter.dataset.downloadKey = downloadKey;
        counter.textContent = formatCount(memoryCounts[downloadKey] || 0);
        counter.setAttribute('aria-label', counter.textContent);
        button.insertAdjacentElement('afterend', counter);
    }

    function bindCounters() {
        document.querySelectorAll(DOWNLOAD_SELECTOR).forEach(addCounter);
    }

    function handleDownloadClick(event) {
        const button = event.target.closest(DOWNLOAD_SELECTOR);
        if (!button) return;

        const downloadKey = button.dataset.downloadKey || keyForUrl(extractDownloadUrl(button));
        if (!downloadKey) return;

        memoryCounts[downloadKey] = (memoryCounts[downloadKey] || 0) + 1;
        saveCounts();
        updateCounters(downloadKey);
    }

    function init() {
        loadCounts();
        bindCounters();
        document.addEventListener('click', handleDownloadClick, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
