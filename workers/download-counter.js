const ALLOWED_ORIGINS = new Set([
    'https://pokemon-roms.top',
    'http://pokemon-roms.top',
    'http://127.0.0.1:8787',
    'http://localhost:8787',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    'http://127.0.0.1:8000',
    'http://localhost:8000'
]);

const ALLOWED_KEY_PREFIXES = [
    'https://exp-games.github.io/Pokemon-Roms/',
    'https://pan.baidu.com/'
];

const LINK_CHECK_TIMEOUT_MS = 7000;

function corsHeaders(request) {
    const origin = request.headers.get('Origin');
    const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://pokemon-roms.top';

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-store',
        'Vary': 'Origin'
    };
}

function jsonResponse(request, body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders(request),
            'Content-Type': 'application/json; charset=utf-8'
        }
    });
}

async function readJSON(request) {
    try {
        return await request.json();
    } catch (error) {
        return null;
    }
}

function cleanKey(value) {
    if (typeof value !== 'string') return '';

    const key = value.trim();
    if (!key || key.length > 2048) return '';
    if (!ALLOWED_KEY_PREFIXES.some(prefix => key.startsWith(prefix))) return '';
    return key;
}

async function fetchWithTimeout(url, init) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS);

    try {
        return await fetch(url, {
            redirect: 'follow',
            ...init,
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeout);
    }
}

async function probeDownloadUrl(downloadUrl) {
    let response;

    try {
        response = await fetchWithTimeout(downloadUrl, { method: 'HEAD' });
        if ([403, 405, 501].includes(response.status)) {
            response = await fetchWithTimeout(downloadUrl, {
                method: 'GET',
                headers: { Range: 'bytes=0-0' }
            });
        }
    } catch (error) {
        response = await fetchWithTimeout(downloadUrl, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' }
        });
    }

    if (response.body) {
        await response.body.cancel();
    }

    return {
        ok: response.status >= 200 && response.status < 400,
        status: response.status,
        finalUrl: response.url
    };
}

async function ensureSchema(env) {
    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS download_counts (
            download_key TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `).run();

    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS site_visit_counts (
            visit_key TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
}

function shanghaiDateKey(date = new Date()) {
    return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function getCounts(env, keys) {
    const counts = Object.fromEntries(keys.map(key => [key, 0]));
    const chunkSize = 90;

    for (let index = 0; index < keys.length; index += chunkSize) {
        const chunk = keys.slice(index, index + chunkSize);
        const placeholders = chunk.map(() => '?').join(',');
        const statement = env.DB.prepare(
            `SELECT download_key, count FROM download_counts WHERE download_key IN (${placeholders})`
        ).bind(...chunk);
        const result = await statement.all();

        (result.results || []).forEach(row => {
            counts[row.download_key] = Number(row.count) || 0;
        });
    }

    return counts;
}

async function handleCounts(request, env) {
    const body = await readJSON(request);
    const keys = Array.isArray(body?.keys)
        ? [...new Set(body.keys.map(cleanKey).filter(Boolean))]
        : [];

    if (!keys.length || keys.length > 500) {
        return jsonResponse(request, { error: 'Expected 1-500 download keys.' }, 400);
    }

    await ensureSchema(env);
    return jsonResponse(request, { counts: await getCounts(env, keys) });
}

async function handleIncrement(request, env) {
    const body = await readJSON(request);
    const key = cleanKey(body?.key);

    if (!key) {
        return jsonResponse(request, { error: 'Expected a download key.' }, 400);
    }

    await ensureSchema(env);
    await env.DB.prepare(`
        INSERT INTO download_counts (download_key, count, updated_at)
        VALUES (?, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(download_key) DO UPDATE SET
            count = count + 1,
            updated_at = CURRENT_TIMESTAMP
    `).bind(key).run();

    const row = await env.DB.prepare(
        'SELECT count FROM download_counts WHERE download_key = ?'
    ).bind(key).first();

    return jsonResponse(request, { key, count: Number(row?.count) || 1 });
}

async function handleVisit(request, env) {
    await ensureSchema(env);

    const todayKey = `day:${shanghaiDateKey()}`;
    const totalKey = 'total';

    await env.DB.batch([
        env.DB.prepare(`
            INSERT INTO site_visit_counts (visit_key, count, updated_at)
            VALUES (?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(visit_key) DO UPDATE SET
                count = count + 1,
                updated_at = CURRENT_TIMESTAMP
        `).bind(totalKey),
        env.DB.prepare(`
            INSERT INTO site_visit_counts (visit_key, count, updated_at)
            VALUES (?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(visit_key) DO UPDATE SET
                count = count + 1,
                updated_at = CURRENT_TIMESTAMP
        `).bind(todayKey)
    ]);

    const result = await env.DB.prepare(`
        SELECT visit_key, count
        FROM site_visit_counts
        WHERE visit_key IN (?, ?)
    `).bind(totalKey, todayKey).all();

    const counts = Object.fromEntries(
        (result.results || []).map(row => [row.visit_key, Number(row.count) || 0])
    );

    return jsonResponse(request, {
        today: counts[todayKey] || 0,
        total: counts[totalKey] || 0,
        date: todayKey.slice(4),
        timezone: 'Asia/Shanghai'
    });
}

async function handleCheck(request) {
    const body = await readJSON(request);
    const downloadUrl = cleanKey(body?.url);

    if (!downloadUrl) {
        return jsonResponse(request, { error: 'Expected an allowed download URL.' }, 400);
    }

    try {
        const result = await probeDownloadUrl(downloadUrl);
        return jsonResponse(request, {
            url: downloadUrl,
            ok: result.ok,
            status: result.status,
            finalUrl: result.finalUrl,
            checkedAt: new Date().toISOString()
        });
    } catch (error) {
        return jsonResponse(request, {
            url: downloadUrl,
            ok: false,
            status: 0,
            error: error?.name === 'AbortError' ? 'Request timed out.' : 'Link check failed.',
            checkedAt: new Date().toISOString()
        });
    }
}

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(request) });
        }

        const url = new URL(request.url);
        if (request.method === 'POST' && url.pathname === '/api/download-counter/check') {
            return handleCheck(request);
        }

        if (!env.DB) {
            return jsonResponse(request, { error: 'Counter database is not configured.' }, 500);
        }

        if (request.method === 'POST' && url.pathname === '/api/download-counter/counts') {
            return handleCounts(request, env);
        }

        if (request.method === 'POST' && url.pathname === '/api/download-counter/visits') {
            return handleVisit(request, env);
        }

        if (request.method === 'POST' && url.pathname === '/api/download-counter/increment') {
            return handleIncrement(request, env);
        }

        return jsonResponse(request, { error: 'Not found.' }, 404);
    }
};
