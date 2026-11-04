'use strict';
// B92's RSS feeds are thin: "Info" covers only world news for ~5h, "Najnovije" only the last hour,
// and neither has the stories B92 puts at the top of its homepage. So the homepage headlines are
// read as well. The homepage has no dates; they are estimated from article numbers, which grow
// with time (…/281659/…), using the feed items as reference points.

const { decodeEntities } = require('./rss');

const idOf = (url) => { const m = String(url).match(/\/(\d{5,7})\//); return m ? Number(m[1]) : null; };
const norm = (u) => String(u).split('?')[0].replace(/\/+$/, '');

function tagText(blk, cls, close) { // text after the first tag carrying `cls`, up to `close` (linear)
  const low = blk.toLowerCase(), c = low.indexOf(cls);
  if (c < 0) return '';
  const gt = low.indexOf('>', c);
  if (gt < 0) return '';
  const e = low.indexOf(close, gt);
  return e < 0 ? '' : blk.slice(gt + 1, e);
}

function estimateTs(id, known, nowMs) {
  const pts = known.filter((k) => k.id != null).sort((a, b) => a.id - b.id);
  if (id == null || pts.length < 2) return nowMs;
  const first = pts[0], last = pts[pts.length - 1];
  const rate = last.id > first.id ? Math.max(30e3, (last.ts - first.ts) / (last.id - first.id)) : 180e3; // ms per article number
  let lo = null, hi = null;
  for (const p of pts) { if (p.id <= id) lo = p; if (p.id >= id && !hi) hi = p; }
  let ts;
  if (lo && hi && hi.id > lo.id) ts = lo.ts + ((id - lo.id) / (hi.id - lo.id)) * (hi.ts - lo.ts);
  else if (lo && lo.id === id) ts = lo.ts;
  else if (!lo) ts = hi.ts - (hi.id - id) * rate;
  else ts = lo.ts + (id - lo.id) * rate;
  return Math.min(nowMs, Math.max(nowMs - 7 * 24 * 3600e3, ts));
}

const strip = (h) => decodeEntities(String(h).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
const cleanTitle = (t) => t.replace(/^uživo\s+/i, '');

// "45" + "min" -> ms ago; null when the unit is unknown (caller falls back to article numbers)
function agoMs(num, unit) {
  const n = Number(num);
  if (!Number.isFinite(n)) return null;
  const u = String(unit || '').toLowerCase();
  if (/^min/.test(u)) return n * 60e3;
  if (/^(h|sat|čas|cas)/.test(u)) return n * 3600e3;
  if (/^(d|dan)/.test(u)) return n * 86400e3;
  return null;
}

// html: B92 homepage; known: parsed feed items (with .url/.ts). Returns items in homepage order.
// Preferred source: the <article class="news-item"> blocks, which carry photo, description and a
// relative time ("45 min"). Any other headline link on the page is picked up as a fallback.
function scrapeHome(html, known, nowMs = Date.now()) {
  html = String(html == null ? '' : html).slice(0, 1500000);
  const ref = known.map((k) => ({ id: idOf(k.url), ts: k.ts }));
  const out = [];
  const seen = new Set();
  const add = (it) => {
    if (it.title.length < 25 || seen.has(norm(it.url))) return;
    seen.add(norm(it.url));
    out.push({ ...it, rank: out.length });
  };
  const abs = (u) => { try { return new URL(decodeEntities(u), 'https://www.b92.net/').href; } catch { return null; } };

  const lowA = html.toLowerCase();
  const blocksA = [];
  for (let q = 0, n = 0; n < 150; n++) {
    const a = lowA.indexOf('<article', q);
    if (a < 0) break;
    const e = lowA.indexOf('</article>', a);
    if (e < 0) break;
    q = e + 10;
    const blk = html.slice(a, Math.min(e + 10, a + 20000));
    if (/^<article\b[^>]{0,1000}class="[^"]*news-item/i.test(blk)) blocksA.push(blk);
  }
  for (const block of blocksA) {
    const href = (block.match(/<a\b[^>]*href=["']([^"']+\/vest)["']/i) || [])[1];
    const url = href && abs(href);
    const title = cleanTitle(strip(tagText(block, 'news-item-title', '</h2>')));
    if (!url || !title) continue;
    const desc = strip(tagText(block, 'news-item-description', '</p>'));
    const img = (block.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i) || [])[1];
    const num = tagText(block, 'before-time-number', '</span>');
    const unit = tagText(block, 'before-time-text', '</span>');
    const ago = agoMs(strip(num || ''), strip(unit || ''));
    const ts = ago != null ? nowMs - ago : estimateTs(idOf(url), ref, nowMs);
    add({ title, url, summary: desc, image: img ? abs(img) : null, categories: [], ts });
  }

  const low = html.toLowerCase();
  let p = 0, closeAt = -2;
  while (out.length < 300) {
    const a = low.indexOf('<a ', p);
    if (a < 0) break;
    const gt = low.indexOf('>', a);
    if (gt < 0) break;
    p = gt + 1;
    const hm = /\bhref=["']([^"']+\/vest)["']/i.exec(html.slice(a, Math.min(gt, a + 1500)));
    if (!hm) continue;
    if (closeAt !== -1 && closeAt < gt) closeAt = low.indexOf('</a>', gt); // monotone cache: never rescans
    if (closeAt < 0) break;
    const url = abs(hm[1]);
    const title = cleanTitle(strip(html.slice(gt + 1, Math.min(closeAt, gt + 3000))));
    if (url) add({ title, url, summary: '', image: null, categories: [], ts: estimateTs(idOf(url), ref, nowMs) });
  }
  return out;
}

module.exports = { scrapeHome, estimateTs, idOf, norm };
