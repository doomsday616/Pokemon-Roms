/**
 * 下载点击计数器
 * 全站共享版本：通过 /api/download-counter 调用 Cloudflare Worker + D1。
 */

(function() {
    'use strict';

    const DOWNLOAD_SELECTOR = '.list-group-item-danger .button-link[onclick*="window.open"]';
    const OPTION_CLASS = 'download-option';
    const LABEL_CLASS = 'download-label';
    const CHECK_CLASS = 'download-check';
    const LINK_CHECK_CONCURRENCY = 6;
    const MIN_LABEL_FONT_SIZE = 6.5;
    const DEFAULT_API_BASE = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
        ? 'https://pokemon-roms.top/api/download-counter'
        : '/api/download-counter';
    const API_BASE = (window.DOWNLOAD_COUNTER_API || DEFAULT_API_BASE).replace(/\/$/, '');

    const counts = {};
    const keys = new Set();
    let linkChecksStarted = false;
    let fitScheduled = false;
    let measureElement = null;

    function counterText(key, fallback, replacements) {
        return window.siteI18n?.t(key, replacements) || fallback;
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
        const formattedCount = Number.isFinite(count)
            ? count.toLocaleString(window.siteI18n?.getLocale() || 'zh-CN')
            : '--';
        return counterText('download.count', `下载 ${formattedCount} 次`, { count: formattedCount });
    }

    function formatCountLabel(count) {
        const formattedCount = Number.isFinite(count)
            ? count.toLocaleString(window.siteI18n?.getLocale() || 'zh-CN')
            : '--';
        return counterText('download.countLabel', `下载 ${formattedCount} 次`, { count: formattedCount });
    }

    function updateCounters(downloadKey) {
        document.querySelectorAll('.download-count').forEach(counter => {
            if (counter.dataset.downloadKey !== downloadKey) return;

            const label = formatCount(counts[downloadKey]);
            counter.textContent = label;
            counter.setAttribute('aria-label', formatCountLabel(counts[downloadKey]));
        });

        scheduleFitDownloadLabels();
    }

    function directChildByClass(parent, className) {
        return Array.from(parent.children).find(child => child.classList.contains(className));
    }

    function getDownloadLabel(button) {
        if (button.dataset.downloadLabel) return button.dataset.downloadLabel;

        const textNodes = Array.from(button.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent)
            .join('')
            .trim();
        const rawLabel = button.dataset.i18nDownloadLabel || textNodes || button.textContent.trim();
        const translatedLabel = window.siteI18n?.translateDownloadLabel(rawLabel) || rawLabel;
        const label = translatedLabel.replace(/^\[(.+)\]$/, '$1') || '下载';
        button.dataset.downloadLabel = label;
        return label;
    }

    function applyLabelDensity(labelElement, label) {
        const compactLength = label.replace(/\s+/g, '').length;
        labelElement.classList.toggle('is-compact', compactLength >= 8 || /\b(?:GBA|GBC|CIA)\b|20\d{2}/i.test(label));
        labelElement.classList.toggle('is-tight', compactLength >= 16);
    }

    function enhanceDownloadButton(button) {
        if (button.dataset.optionEnhanced === 'true') return button;

        const label = getDownloadLabel(button);
        button.classList.add(OPTION_CLASS);
        button.textContent = '';

        const labelElement = document.createElement('span');
        labelElement.className = LABEL_CLASS;
        labelElement.textContent = label;
        labelElement.title = window.siteI18n?.describeDownloadLabel(button.dataset.i18nDownloadLabel) || label;
        applyLabelDensity(labelElement, label);
        button.appendChild(labelElement);

        button.dataset.optionEnhanced = 'true';
        return button;
    }

    function getMeasureElement() {
        if (measureElement) return measureElement;

        measureElement = document.createElement('span');
        measureElement.style.position = 'fixed';
        measureElement.style.left = '-9999px';
        measureElement.style.top = '-9999px';
        measureElement.style.visibility = 'hidden';
        measureElement.style.whiteSpace = 'nowrap';
        measureElement.style.pointerEvents = 'none';
        document.body.appendChild(measureElement);
        return measureElement;
    }

    function measureLabelWidth(label, fontSize) {
        const styles = window.getComputedStyle(label);
        const measure = getMeasureElement();
        measure.textContent = label.textContent;
        measure.style.fontFamily = styles.fontFamily;
        measure.style.fontWeight = styles.fontWeight;
        measure.style.fontStyle = styles.fontStyle;
        measure.style.letterSpacing = styles.letterSpacing;
        measure.style.fontSize = `${fontSize}px`;
        return measure.getBoundingClientRect().width;
    }

    function fitDownloadLabel(option) {
        const label = directChildByClass(option, LABEL_CLASS);
        if (!label) return;

        const defaultSize = Number(option.dataset.labelFontSize)
            || parseFloat(window.getComputedStyle(label).fontSize)
            || 12;
        option.dataset.labelFontSize = String(defaultSize);
        label.style.fontSize = `${defaultSize}px`;

        const availableWidth = label.clientWidth;
        if (availableWidth <= 0) return;

        const naturalWidth = measureLabelWidth(label, defaultSize);
        if (naturalWidth <= availableWidth + 1) return;

        const nextSize = Math.max(
            MIN_LABEL_FONT_SIZE,
            Math.floor((defaultSize * availableWidth / naturalWidth) * 10) / 10
        );
        label.style.fontSize = `${nextSize}px`;
    }

    function fitDownloadLabels() {
        document.querySelectorAll(`.${OPTION_CLASS}`).forEach(fitDownloadLabel);
    }

    function scheduleFitDownloadLabels() {
        if (fitScheduled) return;
        fitScheduled = true;

        window.requestAnimationFrame(() => {
            fitScheduled = false;
            fitDownloadLabels();
        });
    }

    function setCheckState(checkElement, state, status) {
        checkElement.classList.remove('is-checking', 'is-valid', 'is-invalid');
        checkElement.dataset.checkState = state;
        checkElement.dataset.checkStatus = status || '';

        if (state === 'checking') {
            checkElement.classList.add('is-checking');
            checkElement.textContent = counterText('link.checking', '检测中');
            checkElement.title = counterText('link.checkingLabel', '正在自动检测下载链接');
            checkElement.setAttribute('aria-label', checkElement.title);
            scheduleFitDownloadLabels();
            return;
        }

        if (state === 'valid') {
            checkElement.classList.add('is-valid');
            checkElement.textContent = counterText('link.valid', '有效');
            const validLabel = counterText('link.validLabel', '链接有效');
            checkElement.title = status ? `${validLabel}, HTTP ${status}` : validLabel;
            checkElement.setAttribute('aria-label', checkElement.title);
            scheduleFitDownloadLabels();
            return;
        }

        if (state === 'invalid') {
            checkElement.classList.add('is-invalid');
            checkElement.textContent = counterText('link.invalid', '无效');
            const invalidLabel = counterText('link.invalidLabel', '链接无效或检测失败');
            checkElement.title = status ? `${invalidLabel}, HTTP ${status}` : invalidLabel;
            checkElement.setAttribute('aria-label', checkElement.title);
            scheduleFitDownloadLabels();
            return;
        }

        checkElement.textContent = counterText('link.pending', '待检测');
        checkElement.title = counterText('link.pendingLabel', '等待自动检测下载链接');
        checkElement.setAttribute('aria-label', checkElement.title);
        scheduleFitDownloadLabels();
    }

    function addLinkChecker(option, downloadKey) {
        let checkElement = directChildByClass(option, CHECK_CLASS);
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
        const option = enhanceDownloadButton(button);
        option.dataset.downloadKey = downloadKey;
        option.dataset.downloadUrl = downloadKey;

        let counter = directChildByClass(option, 'download-count');
        if (counter) {
            counter.dataset.downloadKey = downloadKey;
            updateCounters(downloadKey);
        } else {
            counter = document.createElement('span');
            counter.className = 'download-count is-loading';
            counter.dataset.downloadKey = downloadKey;
            counter.textContent = formatCount();
            counter.setAttribute('aria-label', formatCountLabel());
            option.appendChild(counter);
        }

        addLinkChecker(option, downloadKey);
        scheduleFitDownloadLabels();
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
        scheduleFitDownloadLabels();
    }

    function markCountersError(downloadKeys) {
        downloadKeys.forEach(downloadKey => {
            document.querySelectorAll('.download-count').forEach(counter => {
                if (counter.dataset.downloadKey === downloadKey) {
                    counter.classList.remove('is-loading');
                    counter.classList.add('is-error');
                    counter.textContent = counterText('download.unavailable', '计数暂不可用');
                    counter.setAttribute('aria-label', counterText('download.unavailableLabel', '下载计数暂不可用'));
                }
            });
        });
        scheduleFitDownloadLabels();
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

    function refreshDownloadLanguage() {
        document.querySelectorAll(`.${OPTION_CLASS}`).forEach(option => {
            const sourceLabel = option.dataset.i18nDownloadLabel || option.dataset.downloadLabel || '';
            const translatedLabel = window.siteI18n?.translateDownloadLabel(sourceLabel) || sourceLabel;
            const label = directChildByClass(option, LABEL_CLASS);
            if (label) {
                label.textContent = translatedLabel.replace(/^\[(.+)\]$/, '$1');
                label.title = window.siteI18n?.describeDownloadLabel(sourceLabel) || label.textContent;
                applyLabelDensity(label, label.textContent);
            }
        });

        document.querySelectorAll('.download-count').forEach(counter => {
            const downloadKey = counter.dataset.downloadKey;
            if (counter.classList.contains('is-error')) {
                counter.textContent = counterText('download.unavailable', '计数暂不可用');
                counter.setAttribute('aria-label', counterText('download.unavailableLabel', '下载计数暂不可用'));
            } else {
                const label = formatCount(counts[downloadKey]);
                counter.textContent = label;
                counter.setAttribute('aria-label', formatCountLabel(counts[downloadKey]));
            }
        });

        document.querySelectorAll(`.${CHECK_CLASS}`).forEach(checkElement => {
            setCheckState(checkElement, checkElement.dataset.checkState || 'pending', checkElement.dataset.checkStatus);
        });
        scheduleFitDownloadLabels();
    }

    function init() {
        bindCounters();
        loadCounts();
        startAutomaticLinkChecks();
        document.addEventListener('click', handleDownloadClick, true);
        window.addEventListener('resize', scheduleFitDownloadLabels);
        window.addEventListener('sectionChanged', scheduleFitDownloadLabels);
        window.addEventListener('siteLanguageChanged', refreshDownloadLanguage);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
