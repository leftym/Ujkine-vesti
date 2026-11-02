'use strict';
// Vesti: zero-dependency Node server. Serves the PWA and two JSON endpoints:
//   GET /api/news[?refresh=1]      merged, categorized feed from all six outlets
//   GET /api/article?url=...       reader-mode text for an article (allow-listed hosts only)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { SOURCES } = require('./lib/sources');
const { getNews } = require('./lib/aggregate');
const { CATEGORIES } = require('./lib/classify');
const { extractArticle } = require('./lib/article');

const PUBLIC_DIR = path.join(__dirname, 'public');
const UA = 'Mozilla/5.0 (Linux; Android 15; Pixel 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36';

async function defaultFetchText(url, { timeoutMs = 9000, maxBytes = 3 * 1024 * 1024 } = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctl.signal,
      redirect: 'follow',
      headers: {
        'user-agent': UA,
        accept: 'application/rss+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5',
        'accept-language': 'sr,en;q=0.7',
      },
    });
    if (!res.ok) { const e = new Error('HTTP ' + res.status); e.code = 'HTTP_' + res.status; throw e; }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > maxBytes) throw new Error('too large');
    const ct = res.headers.get('content-type') || '';
    const cs = (ct.match(/charset=([^;]+)/i) || [])[1];
    const head = buf.subarray(0, 200).toString('latin1');
    const xmlEnc = (head.match(/encoding=["']([^"']+)["']/i) || [])[1];
    const enc = (cs || xmlEnc || 'utf-8').trim().toLowerCase();
    try { return new TextDecoder(enc).decode(buf); } catch { return buf.toString('utf8'); }
  } finally {
    clearTimeout(timer);
  }
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
};

const SECURITY = {
  'content-security-policy':
    "default-src 'self'; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
};

function send(res, code, body, headers = {}) {
  res.writeHead(code, { ...SECURITY, ...headers });
  res.end(body);
}
const sendJson = (res, code, obj, extra = {}) =>
  send(res, code, JSON.stringify(obj), { 'content-type': MIME['.json'], 'cache-control': 'no-store', ...extra });

function allowedArticleHost(u) {
  const host = u.hostname.replace(/^www\./, '');
  return SOURCES.some((s) => host === s.host || host.endsWith('.' + s.host));
}

function createServer({ fetchText = defaultFetchText } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://x');
      if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

      if (url.pathname === '/api/news') {
        const data = await getNews(fetchText, { force: url.searchParams.get('refresh') === '1' });
        return sendJson(res, 200, { ...data, categories: CATEGORIES });
      }

      if (url.pathname === '/api/article') {
        let target;
        try { target = new URL(url.searchParams.get('url') || ''); } catch { return sendJson(res, 400, { error: 'bad url' }); }
        if (!/^https?:$/.test(target.protocol) || !allowedArticleHost(target)) {
          return sendJson(res, 400, { error: 'host not allowed' });
        }
        const html = await fetchText(target.href, { timeoutMs: 9000 });
        const art = extractArticle(html, { latin: url.searchParams.get('latin') !== '0' });
        if (!art.blocks.length) return sendJson(res, 422, { error: 'no readable text found' });
        return sendJson(res, 200, art, { 'cache-control': 'public, max-age=300' });
      }

      // static files
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/') rel = '/index.html';
      const file = path.normalize(path.join(PUBLIC_DIR, rel));
      if (!file.startsWith(PUBLIC_DIR + path.sep)) return send(res, 403, 'Forbidden');
      fs.readFile(file, (err, buf) => {
        if (err) return send(res, 404, 'Not found');
        const ext = path.extname(file);
        send(res, 200, buf, {
          'content-type': MIME[ext] || 'application/octet-stream',
          'cache-control': file.endsWith('sw.js') ? 'no-cache' : 'public, max-age=3600',
        });
      });
    } catch (e) {
      sendJson(res, 502, { error: e.message || 'upstream error' });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 8080);
  createServer().listen(port, '0.0.0.0', () => console.log('Vesti listening on :' + port));
}

module.exports = { createServer };
