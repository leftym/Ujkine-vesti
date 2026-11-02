'use strict';
// One-off investigation run in CI (GitHub's network can reach the outlets):
//  1. B92: which feeds exist, what each returns, and how the feed compares with the homepage
//  2. YouTube: links inside every outlet's feed, and each outlet's YouTube channel + its video feed
const fs = require('fs');
const { defaultFetchText } = require('../server');
const { parseFeed, discoverFeeds } = require('../lib/rss');
const { SOURCES } = require('../lib/sources');

const L = [];
const out = (...a) => { if (!a.length) L.push(''); a.forEach((x) => L.push(x)); };
const safe = async (fn, fallback = null) => { try { return await fn(); } catch (e) { return fallback === null ? { __err: e.code || e.message } : fallback; } };
const short = (s, n = 110) => String(s || '').replace(/\s+/g, ' ').slice(0, n);

(async () => {
  out('# Probe', '', 'Run: ' + new Date().toISOString(), '');

  // ---- 1. B92 -------------------------------------------------------------
  out('## B92 feeds');
  const home = await safe(() => defaultFetchText('https://www.b92.net/'));
  const cands = new Set([
    'https://www.b92.net/info/rss/vesti.xml', 'https://www.b92.net/info/rss/svevesti.xml',
    'https://www.b92.net/info/rss/najnovije.xml', 'https://www.b92.net/info/rss/info.xml',
    'https://www.b92.net/info/rss/politika.xml', 'https://www.b92.net/info/rss/hronika.xml',
    'https://www.b92.net/info/rss/ekonomija.xml', 'https://www.b92.net/info/rss/drustvo.xml',
    'https://www.b92.net/rss/', 'https://www.b92.net/rss', 'https://www.b92.net/feed/',
  ]);
  if (typeof home === 'string') for (const f of discoverFeeds(home, 'https://www.b92.net/')) cands.add(f);
  // the outlet's own RSS directory page, if it exists
  for (const dir of ['https://www.b92.net/rss.php', 'https://www.b92.net/info/rss/', 'https://www.b92.net/rss-feed']) {
    const t = await safe(() => defaultFetchText(dir));
    if (typeof t === 'string') {
      for (const m of t.matchAll(/https?:\/\/[^"'\s<>]*b92\.net[^"'\s<>]*\.(?:xml|rss)[^"'\s<>]*/gi)) cands.add(m[0]);
      out(`RSS directory page ${dir}: ${t.length} bytes; feed-like links found: ${[...t.matchAll(/[^"'\s<>]*\.xml/gi)].length}`);
    }
  }
  const titlesByFeed = {};
  for (const url of cands) {
    const xml = await safe(() => defaultFetchText(url));
    if (typeof xml !== 'string') { out(`- ${url} -> ERROR ${xml.__err}`); continue; }
    const items = parseFeed(xml);
    titlesByFeed[url] = items.map((i) => i.url);
    const newest = items.length ? new Date(Math.max(...items.map((i) => i.ts))).toISOString() : '-';
    const oldest = items.length ? new Date(Math.min(...items.map((i) => i.ts))).toISOString() : '-';
    out(`- ${url} -> ${xml.length} bytes, ${items.length} items, newest ${newest}, oldest ${oldest}`);
    for (const i of items.slice(0, 6)) out(`    * ${short(i.title)} | ${i.ts ? new Date(i.ts).toISOString().slice(0, 16) : ''} | cats=${JSON.stringify(i.categories)} | ${i.url}`);
  }
  out('');
  out('### B92 homepage headlines vs feeds');
  if (typeof home === 'string') {
    const links = new Map();
    for (const m of home.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const text = m[2].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      let href = m[1];
      if (text.length < 35 || !/\/(info|sport|biz|zivot|tehnopolis|kultura|svet|hronika|politika|drustvo|region)\b|\d{4}\/\d{2}\/\d{2}|\/vesti\//i.test(href)) continue;
      try { href = new URL(href, 'https://www.b92.net/').href; } catch { continue; }
      if (!links.has(href)) links.set(href, text);
    }
    out(`homepage: ${home.length} bytes, ${links.size} headline-like links`);
    const entries = [...links.entries()].slice(0, 25);
    for (const [href, text] of entries) {
      const inFeeds = Object.entries(titlesByFeed).filter(([, urls]) => urls.some((u) => u.split('?')[0] === href.split('?')[0])).map(([f]) => f.split('/').pop());
      out(`- ${short(text, 90)} | ${href} | in feeds: ${inFeeds.join(',') || 'NONE'}`);
    }
  } else out('homepage fetch failed: ' + JSON.stringify(home));
  out('');

  out('### B92 homepage markup samples (to find where story images live)');
  if (typeof home === 'string') {
    let n = 0;
    for (const m of home.matchAll(/<a\b[^>]*href=["'][^"']+\/vest["'][^>]*>/gi)) {
      if (n++ >= 4) break;
      const start = m.index;
      const end = home.indexOf('</a>', start) + 4;
      out('```html', home.slice(Math.max(0, start - 500), Math.min(home.length, end + 100)).replace(/\s+/g, ' '), '```');
    }
    out('img tags on homepage: ' + (home.match(/<img\b/gi) || []).length + '; with data-src: ' + (home.match(/<img\b[^>]*data-src/gi) || []).length + '; picture/source: ' + (home.match(/<source\b/gi) || []).length);
  }
  out('');

  // ---- 2. YouTube ---------------------------------------------------------
  out('## YouTube');
  const YT = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/gi;
  for (const s of SOURCES) {
    out(`### ${s.name}`);
    for (const f of s.feeds) {
      const xml = await safe(() => defaultFetchText(f));
      if (typeof xml !== 'string') continue;
      const ids = [...new Set([...xml.matchAll(YT)].map((m) => m[1]))];
      out(`feed ${f}: ${ids.length} distinct YouTube video links in the raw feed${ids.length ? ' e.g. ' + ids.slice(0, 3).join(', ') : ''}`);
      break;
    }
    const h = await safe(() => defaultFetchText(s.home));
    if (typeof h !== 'string') { out('homepage failed: ' + JSON.stringify(h)); continue; }
    const chans = [...new Set([...h.matchAll(/https?:\/\/(?:www\.|m\.)?youtube\.com\/(?:channel\/UC[\w-]{22}|@[\w.\-%]+|c\/[\w.\-%]+|user\/[\w.\-%]+)/gi)].map((m) => m[0]))];
    out(`homepage YouTube channel links: ${chans.join(' ; ') || 'none found'}`);
    for (const c of chans.slice(0, 3)) {
      let id = (c.match(/channel\/(UC[\w-]{22})/) || [])[1];
      if (!id) {
        const page = await safe(() => defaultFetchText(c));
        if (typeof page === 'string') {
          id = (page.match(/"(?:channelId|externalId|browseId)":"(UC[\w-]{22})"/) || page.match(/channel\/(UC[\w-]{22})/) || [])[1];
          const nm = (page.match(/<meta property="og:title" content="([^"]+)"/) || [])[1];
          out(`  ${c} -> id ${id || '?'}  name ${nm || '?'}`);
        } else out(`  ${c} -> page fetch failed ${page.__err}`);
      } else out(`  ${c} -> id ${id}`);
      if (id) {
        const vx = await safe(() => defaultFetchText('https://www.youtube.com/feeds/videos.xml?channel_id=' + id));
        if (typeof vx === 'string') {
          const vi = parseFeed(vx);
          out(`  video feed OK: ${vi.length} videos, newest ${vi[0] ? new Date(vi[0].ts).toISOString().slice(0, 16) : '-'}: ${short(vi[0] && vi[0].title, 80)} | thumb ${vi[0] && vi[0].image ? 'yes' : 'no'}`);
        } else out('  video feed FAILED ' + vx.__err);
      }
    }
  }
  fs.writeFileSync(process.argv[2] || 'probe.md', L.join('\n'));
  console.log(L.slice(0, 20).join('\n'));
})().catch((e) => { fs.writeFileSync(process.argv[2] || 'probe.md', L.join('\n') + '\n\nCRASH ' + e.stack); console.error(e); process.exit(1); });
