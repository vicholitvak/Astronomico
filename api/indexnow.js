// IndexNow API - Notifica a motores de búsqueda sobre cambios en el sitio
// Uso: POST /api/indexnow con body { urls: ["url1", "url2"] }
// o GET /api/indexnow?notify=all para notificar todas las páginas principales

const INDEXNOW_KEY = '93a095956830a057d748b0d89f1a33d3';
const HOST = 'atacamadarksky.cl';

// URLs principales del sitio
const MAIN_URLS = [
    'https://atacamadarksky.cl/',
    'https://atacamadarksky.cl/?lang=en',
    'https://atacamadarksky.cl/?lang=pt',
    'https://atacamadarksky.cl/pago.html',
    'https://atacamadarksky.cl/review-form.html',
    'https://atacamadarksky.cl/llms.txt',
    'https://atacamadarksky.cl/sitemap.xml'
];

// Motores de búsqueda que soportan IndexNow
const SEARCH_ENGINES = [
    'www.bing.com',
    'yandex.com',
    'search.seznam.cz'
];

async function notifySearchEngine(engine, urls) {
    const payload = {
        host: HOST,
        key: INDEXNOW_KEY,
        urlList: urls
    };

    try {
        const response = await fetch(`https://${engine}/indexnow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify(payload)
        });

        return {
            engine,
            status: response.status,
            ok: response.ok
        };
    } catch (error) {
        return {
            engine,
            status: 'error',
            error: error.message
        };
    }
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    let urlsToNotify = [];

    if (req.method === 'GET') {
        // GET /api/indexnow?notify=all - notifica todas las URLs principales
        if (req.query.notify === 'all') {
            urlsToNotify = MAIN_URLS;
        } else if (req.query.url) {
            // GET /api/indexnow?url=https://... - notifica una URL específica
            urlsToNotify = [req.query.url];
        } else {
            return res.status(200).json({
                message: 'IndexNow API',
                key: INDEXNOW_KEY,
                usage: {
                    notifyAll: 'GET /api/indexnow?notify=all',
                    notifyOne: 'GET /api/indexnow?url=https://atacamadarksky.cl/page',
                    notifyMultiple: 'POST /api/indexnow with body { "urls": ["url1", "url2"] }'
                },
                mainUrls: MAIN_URLS,
                searchEngines: SEARCH_ENGINES
            });
        }
    } else if (req.method === 'POST') {
        // POST /api/indexnow con body { urls: [...] }
        const { urls } = req.body || {};
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de URLs en el body' });
        }
        urlsToNotify = urls;
    } else {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // Validar que las URLs pertenezcan al dominio
    const validUrls = urlsToNotify.filter(url => url.includes(HOST));
    if (validUrls.length === 0) {
        return res.status(400).json({ error: 'Las URLs deben pertenecer a atacamadarksky.cl' });
    }

    // Notificar a todos los motores de búsqueda
    const results = await Promise.all(
        SEARCH_ENGINES.map(engine => notifySearchEngine(engine, validUrls))
    );

    const success = results.filter(r => r.ok).length;
    const failed = results.filter(r => !r.ok).length;

    return res.status(200).json({
        message: `IndexNow: ${success}/${results.length} motores notificados`,
        urlsNotified: validUrls,
        results
    });
}
