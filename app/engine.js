'use strict';
// On-device engine. Same parsing / categorizing / ad-filter code as the server, but the
// feeds are fetched through Capacitor's native HTTP plugin (no CORS, no server needed).
// Bundled to www/engine.js by scripts/build-web.js and used by app.js when running natively.

const { getNews } = require('../lib/aggregate');
const { CATEGORIES } = require('../lib/classify');
const { extractArticle } = require('../lib/article');
const { SOURCES } = require('../lib/sources');

const CACHE_KEY = 'vesti.cache.v1';
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36';

const nativeHttp = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.CapacitorHttp;

function b64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function headerOf(headers, name) {
  if (!headers) return '';
  for (const k of Object.keys(headers)) if (k.toLowerCase() === name) return String(headers[k]);
  return '';
}

function decode(bytes, contentType) {
  const cs = (contentType.match(/charset=([^;]+)/i) || [])[1];
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 200));
  const xmlEnc = (head.match(/encoding=["']([^"']+)["']/i) || [])[1];
  const enc = (cs || xmlEnc || 'utf-8').trim().toLowerCase();
  try { return new TextDecoder(enc).decode(bytes); } catch { return new TextDecoder('utf-8').decode(bytes); }
}

async function fetchText(url, { timeoutMs = 9000 } = {}) {
  const http = nativeHttp();
  if (!http) {
    // Plain browser fallback (only useful for local testing; most feeds block cross-origin reads)
    const r = await fetch(url);
    if (!r.ok) { const e = new Error('HTTP ' + r.status); e.code = 'HTTP_' + r.status; throw e; }
    return r.text();
  }
  const r = await http.get({
    url,
    responseType: 'arraybuffer',
    connectTimeout: timeoutMs,
    readTimeout: timeoutMs,
    headers: {
      'User-Agent': UA,
      Accept: 'application/rss+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5',
      'Accept-Language': 'sr,en;q=0.7',
    },
  });
  if (r.status < 200 || r.status >= 300) { const e = new Error('HTTP ' + r.status); e.code = 'HTTP_' + r.status; throw e; }
  const bytes = typeof r.data === 'string' ? b64ToBytes(r.data) : new Uint8Array(r.data);
  return decode(bytes, headerOf(r.headers, 'content-type'));
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; }
}

async function news(force) {
  const data = { ...(await getNews(fetchText, { force })), categories: CATEGORIES };
  if (data.items.length) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* storage full */ }
    return { data, fromCache: false };
  }
  const cached = readCache();
  if (cached) return { data: { ...cached, status: data.status }, fromCache: true };
  return { data, fromCache: false };
}

async function article(url) {
  let u;
  try { u = new URL(url); } catch { throw new Error('bad url'); }
  const host = u.hostname.replace(/^www\./, '');
  if (!/^https?:$/.test(u.protocol) || !SOURCES.some((s) => host === s.host || host.endsWith('.' + s.host))) {
    throw new Error('host not allowed');
  }
  const art = extractArticle(await fetchText(u.href), { latin: true, base: u.href });
  if (!art.blocks.length) throw new Error('no readable text found');
  return art;
}

window.VestiEngine = { news, article };
