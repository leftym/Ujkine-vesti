'use strict';
const { SOURCES } = require('./sources');
const { parseFeed, discoverFeeds } = require('./rss');
const { classify, detectAd } = require('./classify');
const { toLatin } = require('./text');
const { computeTop } = require('./top');
const b92 = require('./b92');

const ENV = typeof process !== 'undefined' && process.env ? process.env : {};
const TTL_MS = Number(ENV.CACHE_TTL_MS || 5 * 60 * 1000);
const MAX_AGE_MS = 7 * 24 * 3600 * 1000;
const PER_SOURCE = 80;

const cache = new Map(); // source.id -> { at, items, status }

// Small stable hash (two FNV-1a variants) so the same code runs in Node and in the phone WebView
function mkId(url) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < url.length; i++) {
    const c = url.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + c, 0x85ebca6b) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0').slice(0, 4);
}

async function loadSource(src, fetchText) {
  const tried = [];
  let items = [];
  const used = [];

  // parse one feed; rank = position in that feed (0 = top), flipped if the feed lists oldest first
  const tryFeed = async (url) => {
    try {
      const parsed = parseFeed(await fetchText(url));
      tried.push(url + (parsed.length ? '' : ' (0 items)'));
      if (!parsed.length) return [];
      const asc = parsed.length > 1 && parsed[0].ts < parsed[parsed.length - 1].ts;
      parsed.forEach((p, i) => { p.rank = asc ? parsed.length - 1 - i : i; });
      used.push(url);
      return parsed;
    } catch (e) {
      tried.push(url + ' (' + (e.code || e.message) + ')');
      return [];
    }
  };

  if (src.merge) {
    // use every feed, keep the best (lowest) rank when the same story is in several
    const byUrl = new Map();
    for (const f of src.feeds) {
      for (const p of await tryFeed(f)) {
        const k = b92.norm(p.url);
        const have = byUrl.get(k);
        if (!have) byUrl.set(k, p); else have.rank = Math.min(have.rank, p.rank);
      }
    }
    items = [...byUrl.values()];
  } else {
    for (const f of src.feeds) {
      items = await tryFeed(f);
      if (items.length) break;
    }
    if (!items.length) {
      try {
        const home = await fetchText(src.home);
        for (const f of discoverFeeds(home, src.home).slice(0, 3)) {
          if (src.feeds.includes(f)) continue;
          items = await tryFeed(f);
          if (items.length) break;
        }
      } catch (e) {
        tried.push(src.home + ' (' + (e.code || e.message) + ')');
      }
    }
  }

  if (src.homeScrape === 'b92') {
    try {
      const extra = b92.scrapeHome(await fetchText(src.home), items, Date.now());
      const byUrl = new Map(items.map((p) => [b92.norm(p.url), p]));
      let added = 0;
      for (const e of extra) {
        const have = byUrl.get(b92.norm(e.url));
        if (have) have.rank = Math.min(have.rank, e.rank); // on B92's homepage = editors rate it higher
        else { items.push(e); added++; }
      }
      if (extra.length) used.push(src.home + ' (homepage, +' + added + ')');
      tried.push(src.home + ' (homepage: ' + extra.length + ' headlines)');
    } catch (e) {
      tried.push(src.home + ' (homepage ' + (e.code || e.message) + ')');
    }
  }

  if (!items.length) {
    const err = new Error('no working feed');
    err.tried = tried;
    throw err;
  }

  const cutoff = Date.now() - MAX_AGE_MS;
  const seen = new Set();
  const out = [];
  items.sort((x, y) => y.ts - x.ts);
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    if (it.ts < cutoff || seen.has(it.url)) continue;
    seen.add(it.url);
    const title = toLatin(it.title);
    const summary = toLatin(it.summary).slice(0, 260);
    const categories = it.categories.map(toLatin);
    out.push({
      id: mkId(it.url),
      source: src.id,
      title,
      url: it.url,
      summary,
      image: it.image,
      published: new Date(it.ts).toISOString(),
      rank: it.rank ?? idx,
      tags: categories.slice(0, 6),
      category: classify({ url: it.url, categories, title, summary }),
      ad: detectAd({ url: it.url, title, categories }),
    });
    if (out.length >= PER_SOURCE) break;
  }
  return { items: out, feed: used.join(' + ') };
}

async function getNews(fetchText, { force = false } = {}) {
  const now = Date.now();
  await Promise.all(SOURCES.map(async (src) => {
    const c = cache.get(src.id);
    if (!force && c && now - c.at < TTL_MS) return;
    try {
      const { items, feed } = await loadSource(src, fetchText);
      cache.set(src.id, {
        at: now, items,
        status: { id: src.id, ok: true, count: items.length, feed, fetchedAt: new Date(now).toISOString() },
      });
    } catch (e) {
      // keep serving the last good copy, but report the failure
      const prev = cache.get(src.id);
      cache.set(src.id, {
        at: prev ? prev.at : 0,
        items: prev ? prev.items : [],
        status: {
          id: src.id, ok: false, count: prev ? prev.items.length : 0, stale: !!prev,
          error: e.message, tried: e.tried || [], fetchedAt: new Date(now).toISOString(),
        },
      });
    }
  }));

  const items = [];
  const status = [];
  for (const src of SOURCES) {
    const c = cache.get(src.id);
    if (c) { items.push(...c.items); status.push(c.status); }
  }
  items.sort((a, b) => (a.published < b.published ? 1 : -1));
  return {
    updatedAt: new Date().toISOString(),
    sources: SOURCES.map((s) => ({ id: s.id, name: s.name, color: s.color, home: s.home })),
    status,
    top: computeTop(items),
    items,
  };
}

function clearCache() { cache.clear(); }

module.exports = { getNews, clearCache, loadSource };
