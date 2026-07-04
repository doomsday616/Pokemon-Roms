const ALLOWED_ORIGINS = new Set([
    'https://pokemon-roms.top',
    'http://pokemon-roms.top',
    'http://127.0.0.1:8787',
    'http://localhost:8787'
]);

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
    return key;
}

async function ensureSchema(env) {
    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS download_counts (
            download_key TEXT PRIMARY KEY,
            count INTEGER NOT NULL DEFAULT 0,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
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

export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(request) });
        }

        if (!env.DB) {
            return jsonResponse(request, { error: 'Counter database is not configured.' }, 500);
        }

        const url = new URL(request.url);
        if (request.method === 'POST' && url.pathname === '/api/download-counter/counts') {
            return handleCounts(request, env);
        }

        if (request.method === 'POST' && url.pathname === '/api/download-counter/increment') {
            return handleIncrement(request, env);
        }

        return jsonResponse(request, { error: 'Not found.' }, 404);
    }
};
