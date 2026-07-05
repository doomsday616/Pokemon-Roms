/**
 * 全站访问量计数器
 * 通过 Cloudflare Worker + D1 记录所有用户共享的页面访问 PV。
 */

(function() {
    'use strict';

    const DEFAULT_API_BASE = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
        ? 'https://pokemon-roms.top/api/download-counter'
        : '/api/download-counter';
    const API_BASE = (window.DOWNLOAD_COUNTER_API || DEFAULT_API_BASE).replace(/\/$/, '');

    function formatNumber(value) {
        const number = Number(value) || 0;
        return number.toLocaleString('zh-CN');
    }

    function createCounter() {
        const counter = document.createElement('aside');
        counter.id = 'siteVisitCounter';
        counter.className = 'site-visit-counter is-loading';
        counter.setAttribute('aria-label', '网站访问量');
        counter.innerHTML = `
            <div class="visit-counter-header">
                <span class="visit-counter-dot" aria-hidden="true"></span>
                <span>实时访问量</span>
            </div>
            <div class="visit-counter-grid">
                <div class="visit-counter-item">
                    <span class="visit-counter-label">今日</span>
                    <strong id="visitTodayCount">--</strong>
                </div>
                <div class="visit-counter-item">
                    <span class="visit-counter-label">累计</span>
                    <strong id="visitTotalCount">--</strong>
                </div>
            </div>
        `;
        document.body.appendChild(counter);
        return counter;
    }

    async function recordVisit() {
        const response = await fetch(`${API_BASE}/visits`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: window.location.pathname || '/' }),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Visit API returned ${response.status}`);
        }

        return response.json();
    }

    async function init() {
        const counter = createCounter();
        const todayElement = document.getElementById('visitTodayCount');
        const totalElement = document.getElementById('visitTotalCount');

        try {
            const data = await recordVisit();
            todayElement.textContent = formatNumber(data.today);
            totalElement.textContent = formatNumber(data.total);
            counter.classList.remove('is-loading', 'is-error');
            counter.title = `今日访问量 ${formatNumber(data.today)}，累计访问量 ${formatNumber(data.total)}`;
        } catch (error) {
            console.warn('访问量计数加载失败:', error);
            counter.classList.remove('is-loading');
            counter.classList.add('is-error');
            todayElement.textContent = '暂不可用';
            totalElement.textContent = '暂不可用';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
