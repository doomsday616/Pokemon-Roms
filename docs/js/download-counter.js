/**
 * 下载点击计数器
 * 全站共享版本：通过 /api/download-counter 调用 Cloudflare Worker + D1。
 */

(function() {
    'use strict';

    const DOWNLOAD_SELECTOR = '.list-group-item-danger .button-link[onclick*="window.open"]';
    const OPTION_CLASS = 'download-option';
    const CHECK_CLASS = 'download-check';
    const LINK_CHECK_CONCURRENCY = 6;
    const DEFAULT_API_BASE = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
        ? 'https://pokemon-roms.top/api/download-counter'
        : '/api/download-counter';
    const API_BASE = (window.DOWNLOAD_COUNTER_API || DEFAULT_API_BASE).replace(/\/$/, '');

    const counts = {};
    const keys = new Set();
    let linkChecksStarted = false;

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

    function cleanDownloadLabel(button) {
        if (button.dataset.labelCleaned === 'true') return;

        const label = button.textContent.trim().replace(/^\[(.+)\]$/, '$1');
        if (label) {
            button.textContent = label;
        }
        button.dataset.labelCleaned = 'true';
    }

    function wrapDownloadButton(button) {
        if (button.parentElement && button.parentElement.classList.contains(OPTION_CLASS)) {
            return button.parentElement;
        }

        const option = document.createElement('span');
        option.className = OPTION_CLASS;
        button.insertAdjacentElement('beforebegin', option);
        option.appendChild(button);
        return option;
    }

    function setCheckState(checkElement, state, status) {
        checkElement.classList.remove('is-checking', 'is-valid', 'is-invalid');

        if (state === 'checking') {
            checkElement.classList.add('is-checking');
            checkElement.textContent = '检测中';
            checkElement.title = '正在自动检测下载链接';
            checkElement.setAttribute('aria-label', '正在自动检测下载链接');
            return;
        }

        if (state === 'valid') {
            checkElement.classList.add('is-valid');
            checkElement.textContent = '有效';
            checkElement.title = status ? `链接有效，HTTP ${status}` : '链接有效';
            checkElement.setAttribute('aria-label', checkElement.title);
            return;
        }

        if (state === 'invalid') {
            checkElement.classList.add('is-invalid');
            checkElement.textContent = '无效';
            checkElement.title = status ? `链接无效，HTTP ${status}` : '链接无效或检测失败';
            checkElement.setAttribute('aria-label', checkElement.title);
            return;
        }

        checkElement.textContent = '待检测';
        checkElement.title = '等待自动检测下载链接';
        checkElement.setAttribute('aria-label', '等待自动检测下载链接');
    }

    function addLinkChecker(option, downloadKey) {
        let checkElement = option.querySelector(`.${CHECK_CLASS}`);
        if (!checkElement) {
            checkElement = document.createElement('span');
            checkElement.className = CHECK_CLASS;
            option.appendChild(checkElement);
        }

        checkElement.dataset.downloadUrl = downloadKey;
        setCheckState(checkElement, 'checking');
    }

    function addCounter(button) {
        const url = extractDownloadUrl(button);
        if (!url) return;

        const downloadKey = keyForUrl(url);
        button.dataset.downloadKey = downloadKey;
        keys.add(downloadKey);
        cleanDownloadLabel(button);
        const option = wrapDownloadButton(button);

        if (button.nextElementSibling && button.nextElementSibling.classList.contains('download-count')) {
            button.nextElementSibling.dataset.downloadKey = downloadKey;
            updateCounters(downloadKey);
        } else {
            const counter = document.createElement('span');
            counter.className = 'download-count is-loading';
            counter.dataset.downloadKey = downloadKey;
            counter.textContent = formatCount();
            counter.setAttribute('aria-label', counter.textContent);
            option.appendChild(counter);
        }

        addLinkChecker(option, downloadKey);
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

    async function checkDownloadLink(checkElement) {
        const downloadUrl = checkElement.dataset.downloadUrl;
        if (!downloadUrl) return;

        setCheckState(checkElement, 'checking');

        try {
            const data = await postJSON('/check', { url: downloadUrl });
            setCheckState(checkElement, data.ok ? 'valid' : 'invalid', data.status);
        } catch (error) {
            console.warn('下载链接检测失败:', error);
            setCheckState(checkElement, 'invalid');
        }
    }

    async function startAutomaticLinkChecks() {
        if (linkChecksStarted) return;
        linkChecksStarted = true;

        const checkElements = Array.from(document.querySelectorAll(`.${CHECK_CLASS}`));
        let nextIndex = 0;

        async function worker() {
            while (nextIndex < checkElements.length) {
                const checkElement = checkElements[nextIndex];
                nextIndex += 1;
                await checkDownloadLink(checkElement);
            }
        }

        const workers = Array.from(
            { length: Math.min(LINK_CHECK_CONCURRENCY, checkElements.length) },
            worker
        );
        await Promise.all(workers);
    }

    function init() {
        bindCounters();
        loadCounts();
        startAutomaticLinkChecks();
        document.addEventListener('click', handleDownloadClick, true);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
