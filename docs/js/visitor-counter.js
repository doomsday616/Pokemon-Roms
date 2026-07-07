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
    const locale = 'zh-CN';
    const today = new Date();
    let visibleYear = today.getFullYear();
    let visibleMonth = today.getMonth();
    let latestVisitData = null;

    function formatNumber(value) {
        const number = Number(value) || 0;
        return number.toLocaleString(locale);
    }

    function monthKey(year, monthIndex) {
        return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    }

    function dateKey(year, monthIndex, day) {
        return `${monthKey(year, monthIndex)}-${String(day).padStart(2, '0')}`;
    }

    function monthLabel(year, monthIndex) {
        return new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long'
        }).format(new Date(year, monthIndex, 1));
    }

    function weekdayLabels() {
        const monday = new Date(2026, 0, 5);
        return Array.from({ length: 7 }, (_, index) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + index);
            return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date);
        });
    }

    async function postJSON(path, payload) {
        const response = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload || {}),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`Visit API returned ${response.status}`);
        }

        return response.json();
    }

    function createCounter() {
        const counter = document.createElement('aside');
        counter.id = 'siteVisitCounter';
        counter.className = 'site-visit-counter is-loading';
        counter.setAttribute('aria-label', '网站访问量');
        counter.innerHTML = `
            <button id="visitCounterSummary" class="visit-counter-summary" type="button" aria-expanded="false" aria-controls="visitDashboard">
                <span class="visit-counter-header">
                    <span class="visit-counter-dot" aria-hidden="true"></span>
                    <span>实时访问量</span>
                </span>
                <span class="visit-counter-grid">
                    <span class="visit-counter-item">
                        <span class="visit-counter-label">今日</span>
                        <strong id="visitTodayCount">--</strong>
                    </span>
                    <span class="visit-counter-item">
                        <span class="visit-counter-label">累计</span>
                        <strong id="visitTotalCount">--</strong>
                    </span>
                </span>
            </button>
            <section id="visitDashboard" class="visit-dashboard" aria-label="每日访问量日历">
                <div class="visit-dashboard-top">
                    <button id="visitPrevMonth" class="visit-month-button" type="button" aria-label="上个月">‹</button>
                    <div class="visit-month-copy">
                        <span>每日访问量</span>
                        <strong id="visitMonthLabel"></strong>
                    </div>
                    <button id="visitNextMonth" class="visit-month-button" type="button" aria-label="下个月">›</button>
                </div>
                <div id="visitWeekdays" class="visit-weekdays"></div>
                <div id="visitCalendarGrid" class="visit-calendar-grid" aria-live="polite"></div>
            </section>
        `;
        document.body.appendChild(counter);
        return counter;
    }

    function updateSummary(data) {
        const todayElement = document.getElementById('visitTodayCount');
        const totalElement = document.getElementById('visitTotalCount');
        todayElement.textContent = formatNumber(data.today);
        totalElement.textContent = formatNumber(data.total);
    }

    function renderWeekdays() {
        const weekdaysElement = document.getElementById('visitWeekdays');
        weekdaysElement.innerHTML = weekdayLabels()
            .map(day => `<span>${day}</span>`)
            .join('');
    }

    function renderCalendar(history) {
        const grid = document.getElementById('visitCalendarGrid');
        const monthElement = document.getElementById('visitMonthLabel');
        const firstDay = new Date(visibleYear, visibleMonth, 1);
        const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
        const leadingBlanks = (firstDay.getDay() + 6) % 7;
        const cells = [];

        monthElement.textContent = monthLabel(visibleYear, visibleMonth);

        for (let index = 0; index < leadingBlanks; index += 1) {
            cells.push('<span class="visit-day is-empty" aria-hidden="true"></span>');
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const key = dateKey(visibleYear, visibleMonth, day);
            const count = Number(history.days?.[key]) || 0;
            const isToday = key === history.today;
            cells.push(`
                <span class="visit-day${isToday ? ' is-today' : ''}${count ? ' has-visits' : ''}" title="${key} 访问量 ${formatNumber(count)}">
                    <span class="visit-day-number">${day}</span>
                    <strong>${formatNumber(count)}</strong>
                </span>
            `);
        }

        grid.innerHTML = cells.join('');
    }

    async function loadCalendar() {
        const counter = document.getElementById('siteVisitCounter');
        counter.classList.add('is-calendar-loading');

        try {
            const history = await postJSON('/visits/history', {
                month: monthKey(visibleYear, visibleMonth)
            });
            renderCalendar(history);
            counter.classList.remove('is-calendar-error');
        } catch (error) {
            console.warn('访问量日历加载失败:', error);
            counter.classList.add('is-calendar-error');
            document.getElementById('visitCalendarGrid').innerHTML = '<span class="visit-calendar-error">日历暂不可用</span>';
        } finally {
            counter.classList.remove('is-calendar-loading');
        }
    }

    function setExpanded(expanded) {
        const counter = document.getElementById('siteVisitCounter');
        const summary = document.getElementById('visitCounterSummary');
        counter.classList.toggle('is-expanded', expanded);
        summary.setAttribute('aria-expanded', String(expanded));

        if (expanded) {
            loadCalendar();
        }
    }

    async function recordVisit() {
        return postJSON('/visits', { path: window.location.pathname || '/' });
    }

    async function init() {
        const counter = createCounter();
        renderWeekdays();

        document.getElementById('visitCounterSummary').addEventListener('click', () => {
            setExpanded(!counter.classList.contains('is-expanded'));
        });
        document.getElementById('visitPrevMonth').addEventListener('click', event => {
            event.stopPropagation();
            visibleMonth -= 1;
            if (visibleMonth < 0) {
                visibleMonth = 11;
                visibleYear -= 1;
            }
            loadCalendar();
        });
        document.getElementById('visitNextMonth').addEventListener('click', event => {
            event.stopPropagation();
            visibleMonth += 1;
            if (visibleMonth > 11) {
                visibleMonth = 0;
                visibleYear += 1;
            }
            loadCalendar();
        });

        try {
            latestVisitData = await recordVisit();
            updateSummary(latestVisitData);
            counter.classList.remove('is-loading', 'is-error');
            counter.title = `今日访问量 ${formatNumber(latestVisitData.today)}，累计访问量 ${formatNumber(latestVisitData.total)}`;
        } catch (error) {
            console.warn('访问量计数加载失败:', error);
            counter.classList.remove('is-loading');
            counter.classList.add('is-error');
            document.getElementById('visitTodayCount').textContent = '暂不可用';
            document.getElementById('visitTotalCount').textContent = '暂不可用';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
