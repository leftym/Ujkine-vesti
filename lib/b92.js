'use strict';
// B92's RSS feeds are thin: "Info" covers only world news for ~5h, "Najnovije" only the last hour,
// and neither has the stories B92 puts at the top of its homepage. So the homepage headlines are
// read as well. The homepage has no dates; they are estimated from article numbers, which grow
// with time (…/281659/…), using the feed items as reference points.

const { decodeEntities } = require('./rss');

const idOf = (url) => { const m = String(url).match(/\/(\d{5,7})\//); return m ? Number(m[1]) : null; };
const norm = (u) => String(u).split('?')[0].replace(/\/+$/, '');

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

// html: B92 homepage; known: parsed feed items (with .url/.ts). Returns items in homepage order.
function scrapeHome(html, known, nowMs = Date.now()) {
  const ref = known.map((k) => ({ id: idOf(k.url), ts: k.ts }));
  const out = [];
  const seen = new Set();
  const re = /<a\b[^>]*href=["']([^"']+\/vest)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    let url;
    try { url = new URL(decodeEntities(m[1]), 'https://www.b92.net/').href; } catch { continue; }
    const title = decodeEntities(m[2].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim().replace(/^uživo\s+/i, '');
    if (title.length < 25 || seen.has(norm(url))) continue;
    seen.add(norm(url));
    out.push({ title, url, summary: '', image: null, categories: [], ts: estimateTs(idOf(url), ref, nowMs), rank: out.length });
  }
  return out;
}

module.exports = { scrapeHome, estimateTs, idOf, norm };
