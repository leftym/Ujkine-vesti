'use strict';
// Small tolerant RSS 2.0 / Atom parser (no dependencies).

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      try { return Number.isFinite(n) ? String.fromCodePoint(n) : m; } catch { return m; }
    }
    return ENT[e.toLowerCase()] ?? m;
  });
}

const unCdata = (s) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
// Element body -> HTML string (CDATA is raw HTML; otherwise it is entity-escaped HTML)
const htmlOf = (raw) => (/<!\[CDATA\[/.test(raw) ? unCdata(raw) : decodeEntities(raw));
// Linear: every '<' jumps to the next '>' once; an unterminated tag ends the scan (no regex rescans).
function stripTags(h) {
  h = h.length > 60000 ? h.slice(0, 60000) : h;
  const low = h.toLowerCase();
  let out = '', i = 0;
  for (;;) {
    const a = h.indexOf('<', i);
    if (a < 0) { out += h.slice(i); break; }
    out += h.slice(i, a) + ' ';
    const b = h.indexOf('>', a);
    if (b < 0) break;
    i = b + 1;
    const m = /^<(script|style)\b/.exec(low.slice(a, a + 8));
    if (m) { const e = low.indexOf('</' + m[1], i); if (e < 0) break; const g = h.indexOf('>', e); if (g < 0) break; i = g + 1; }
  }
  return out;
}
const clean = (s) => decodeEntities(s).replace(/^\s*<!\[CDATA\[/, '').replace(/\s+/g, ' ').trim();

// Linear-time: find the opener, then the closer with indexOf (a lazy regex rescans to the end of
// the input for every unclosed opener, which froze the phone on hostile feeds).
function inner(block, name) {
  const open = new RegExp('<' + name + '(?:\\s[^>]*)?>', 'i').exec(block);
  if (!open) return null;
  const from = open.index + open[0].length;
  const end = block.toLowerCase().indexOf('</' + name.toLowerCase() + '>', from);
  return end < 0 ? null : block.slice(from, end);
}

// Split into <item>/<entry> blocks without a backtracking regex; unclosed ones end the scan.
function splitBlocks(xml, tag, max) {
  const low = xml.toLowerCase();
  const out = [];
  let pos = 0;
  while (out.length < max) {
    const a = low.indexOf('<' + tag, pos);
    if (a < 0) break;
    const c = low[a + tag.length + 1];
    if (c !== '>' && c !== ' ' && c !== '\n' && c !== '\t' && c !== '\r') { pos = a + 1; continue; }
    const e = low.indexOf('</' + tag + '>', a);
    if (e < 0) break;
    out.push(xml.slice(a, e + tag.length + 3));
    pos = e + 1;
  }
  return out;
}

function innerAll(block, name) {
  const out = [];
  const open = new RegExp('<' + name + '(?:\\s[^>]*)?>', 'gi');
  const closer = '</' + name.toLowerCase() + '>';
  const low = block.toLowerCase();
  let m;
  while ((m = open.exec(block))) {
    const from = m.index + m[0].length;
    const end = low.indexOf(closer, from);
    if (end < 0) break;
    out.push(block.slice(from, end));
    open.lastIndex = end + closer.length;
  }
  return out;
}

function attrOf(block, name, attr, filter) {
  const re = new RegExp('<' + name + '\\b([^>]*)>', 'gi');
  let m;
  while ((m = re.exec(block))) {
    if (filter && !filter.test(m[1])) continue;
    const a = m[1].match(new RegExp('\\b' + attr + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'));
    if (a) return decodeEntities(a[2] ?? a[3]);
  }
  return null;
}

function firstImg(html) {
  const low = html.toLowerCase();
  let p = 0;
  for (let n = 0; n < 20; n++) {            // look at the first 20 <img> only
    const a = low.indexOf('<img', p);
    if (a < 0) return null;
    const b = low.indexOf('>', a);
    if (b < 0) return null;
    p = b + 1;
    const m = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(html.slice(a, Math.min(b, a + 2000)));
    if (m) return decodeEntities(m[1]);
  }
  return null;
}

function parseFeed(xml) {
  xml = String(xml == null ? '' : xml).slice(0, 800000); // cap: hostile/oversized input must not freeze the phone
  const isAtom = /<feed\b/i.test(xml) && !/<rss\b/i.test(xml);
  const blocks = splitBlocks(xml, isAtom ? 'entry' : 'item', 200);
  const items = [];

  for (const b of blocks) {
    const titleRaw = inner(b, 'title');
    if (!titleRaw) continue;
    const title = clean(stripTags(htmlOf(titleRaw)));

    let link = null;
    if (isAtom) {
      link = attrOf(b, 'link', 'href', /rel\s*=\s*["']alternate["']/i) || attrOf(b, 'link', 'href');
    } else {
      const l = inner(b, 'link');
      link = l ? clean(unCdata(l)) : attrOf(b, 'link', 'href');
    }
    if (!link) {
      const g = inner(b, 'guid');
      if (g && /^https?:/i.test(clean(unCdata(g)))) link = clean(unCdata(g));
    }
    if (!title || !link) continue;
    if (!/^https?:\/\//i.test(link)) continue; // no javascript:, intent:, relative links

    const descRaw = inner(b, 'description') ?? inner(b, 'summary') ?? '';
    const encRaw = inner(b, 'content:encoded') ?? inner(b, 'content') ?? '';
    const descHtml = htmlOf(descRaw);
    const encHtml = htmlOf(encRaw);
    const summary = clean(stripTags(descHtml || encHtml));

    const image =
      attrOf(b, 'media:content', 'url', /(medium\s*=\s*["']image|type\s*=\s*["']image|\.(jpe?g|png|webp)\b)/i) ||
      attrOf(b, 'media:content', 'url') ||
      attrOf(b, 'media:thumbnail', 'url') ||
      attrOf(b, 'enclosure', 'url', /type\s*=\s*["']image/i) ||
      firstImg(inner(b, 'thumb') || '') || // RTS puts <img> inside a custom <thumb> tag
      firstImg(encHtml) ||
      firstImg(descHtml);

    const cats = innerAll(b, 'category').map((c) => clean(stripTags(htmlOf(c)))).filter(Boolean);
    if (isAtom) {
      for (const m of b.matchAll(/<category\b[^>]*\bterm\s*=\s*"([^"]+)"/gi)) cats.push(clean(m[1]));
    }

    const dateRaw =
      inner(b, 'pubDate') ?? inner(b, 'published') ?? inner(b, 'updated') ?? inner(b, 'dc:date');
    let ts = dateRaw ? Date.parse(clean(unCdata(dateRaw))) : NaN;
    // undated items are not "just now" (they would pin themselves to the top); a future date is clamped
    if (!Number.isFinite(ts)) ts = Date.now() - 12 * 3600 * 1000;
    ts = Math.min(ts, Date.now() + 3600 * 1000);

    items.push({ title, url: link, summary, image: image && /^https:\/\//i.test(image) ? image : null, categories: [...new Set(cats)], ts });
  }
  return items;
}

// Find feed URLs advertised in a page's <head>
function discoverFeeds(html, base) {
  html = String(html == null ? '' : html).slice(0, 300000); // only the <head> matters
  const low = html.toLowerCase();
  const out = [];
  let p = 0;
  while (out.length < 10) {
    const a = low.indexOf('<link', p);
    if (a < 0) break;
    const b = low.indexOf('>', a);
    if (b < 0) break;
    p = b + 1;
    const tag = html.slice(a, Math.min(b + 1, a + 2000));
    if (!/type\s*=\s*["']application\/(rss|atom)\+xml["']/i.test(tag)) continue;
    const h = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!h) continue;
    try { out.push(new URL(decodeEntities(h[1]), base).href); } catch { /* skip */ }
  }
  return out;
}

module.exports = { parseFeed, discoverFeeds, decodeEntities };
