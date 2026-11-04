'use strict';
// On-device engine. Same parsing / categorizing / ad-filter code as the server, but the
// feeds are fetched through Capacitor's native HTTP plugin (no CORS, no server needed).
// Bundled to www/engine.js by scripts/build-web.js and used by app.js when running natively.

const { getNews } = require('../lib/aggregate');
const { CATEGORIES } = require('../lib/classify');
const { extractArticle } = require('../lib/article');
const { SOURCES } = require('../lib/sources');
const { getVideos } = require('../lib/videos');

const CACHE_KEY = 'vesti.cache.v1';
const VIDEO_KEY = 'vesti.videos.v1';
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

async function fetchText(url, { timeoutMs = 6000 } = {}) {
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

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const WEEK = 7 * 24 * 3600 * 1000;
function validNews(d) {
  if (!isObj(d) || !Array.isArray(d.items) || !Array.isArray(d.status) || !Array.isArray(d.sources) ||
    typeof d.updatedAt !== 'string' || isNaN(Date.parse(d.updatedAt)) || Date.parse(d.updatedAt) > Date.now() + 3.6e6) return false;
  if (!d.sources.every((s) => isObj(s) && typeof s.id === 'string' && typeof s.name === 'string')) return false;
  if (d.categories !== undefined && !(Array.isArray(d.categories) && d.categories.every((c) => isObj(c) && typeof c.id === 'string'))) return false;
  if (d.top !== undefined && !(Array.isArray(d.top) && d.top.every((t) => isObj(t) && Array.isArray(t.ids)))) return false;
  const ids = new Set(d.sources.filter(isObj).map((s) => s.id));
  return d.items.every((i) => isObj(i) && typeof i.title === 'string' && typeof i.url === 'string' && ids.has(i.source) &&
    typeof i.published === 'string' && !isNaN(Date.parse(i.published)) && /^https?:\/\//.test(i.url) &&
    (i.summary === undefined || typeof i.summary === 'string') && (i.tags === undefined || Array.isArray(i.tags))) &&
    d.status.every((s) => isObj(s) && ids.has(s.id));
}
function validVideos(d) {
  return isObj(d) && Array.isArray(d.items) && Array.isArray(d.status) && typeof d.updatedAt === 'string' && !isNaN(Date.parse(d.updatedAt)) &&
    d.items.every((v) => isObj(v) && typeof v.url === 'string' && /^https?:\/\//.test(v.url) && typeof v.title === 'string' &&
      typeof v.source === 'string' && typeof v.published === 'string' && !isNaN(Date.parse(v.published))) &&
    d.status.every((s) => isObj(s) && typeof s.id === 'string');
}

// A damaged saved copy is dropped instead of breaking the screen.
function readStored(key, ok) {
  try {
    const d = JSON.parse(localStorage.getItem(key) || 'null');
    if (ok(d)) return d;
    localStorage.removeItem(key);
  } catch { try { localStorage.removeItem(key); } catch { /* ignore */ } }
  return null;
}
// Saved stories older than a week are dropped, so a long-dead outlet cannot show ancient news.
function readCache() {
  const d = readStored(CACHE_KEY, validNews);
  if (d) d.items = d.items.filter((i) => Date.now() - Date.parse(i.published) < WEEK || isNaN(Date.parse(i.published)));
  return d;
}

function store(key, data, dropOnFull) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {
    try { localStorage.removeItem(dropOnFull); localStorage.setItem(key, JSON.stringify(data)); } catch { /* storage full */ }
  }
}

async function news(force) {
  let data;
  try {
    data = { ...(await getNews(fetchText, { force })), categories: CATEGORIES };
  } catch (e) {
    const cached = readCache();
    if (cached) return { data: cached, fromCache: true };
    throw e;
  }
  const cached = readCache();
  if (data.items.length) {
    // After a restart the in-memory cache is empty. If one outlet is down now, keep its older
    // stories from the saved copy instead of silently dropping the outlet.
    const failed = data.status.filter((s) => !s.ok).map((s) => s.id);
    if (cached && failed.length) {
      const have = new Set(data.items.map((i) => i.source));
      const older = cached.items.filter((i) => failed.includes(i.source) && !have.has(i.source));
      if (older.length) data.items = data.items.concat(older);
    }
    store(CACHE_KEY, data, VIDEO_KEY);
    return { data, fromCache: false };
  }
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

async function videos(force) {
  let data;
  try { data = await getVideos(fetchText, { force }); } catch (e) {
    const c = readStored(VIDEO_KEY, validVideos);
    if (c) return { data: c, fromCache: true };
    throw e;
  }
  if (data.items.length) {
    store(VIDEO_KEY, data, 'vesti.none');
    return { data, fromCache: false };
  }
  const cached = readStored(VIDEO_KEY, validVideos);
  if (cached) return { data: cached, fromCache: true };
  return { data, fromCache: false };
}

window.VestiEngine = { news, article, videos };
