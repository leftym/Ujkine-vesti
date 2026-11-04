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
const stripTags = (h) => h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]*>/g, ' ');
const clean = (s) => decodeEntities(s).replace(/^\s*<!\[CDATA\[/, '').replace(/\s+/g, ' ').trim();

function inner(block, name) {
  const re = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'i');
  const m = block.match(re);
  return m ? m[1] : null;
}

function innerAll(block, name) {
  const re = new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'gi');
  const out = [];
  let m;
  while ((m = re.exec(block))) out.push(m[1]);
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
  const m = html.match(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i);
  return m ? decodeEntities(m[1]) : null;
}

function parseFeed(xml) {
  xml = String(xml == null ? '' : xml).slice(0, 1500000); // cap: hostile/oversized input must not freeze the phone
  const isAtom = /<feed\b/i.test(xml) && !/<rss\b/i.test(xml);
  const itemRe = isAtom ? /<entry\b[\s\S]*?<\/entry>/gi : /<item\b[\s\S]*?<\/item>/gi;
  const blocks = xml.match(itemRe) || [];
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
    if (!Number.isFinite(ts)) ts = Date.now();

    items.push({ title, url: link, summary, image: image && /^https:\/\//i.test(image) ? image : null, categories: [...new Set(cats)], ts });
  }
  return items;
}

// Find feed URLs advertised in a page's <head>
function discoverFeeds(html, base) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    if (!/type\s*=\s*["']application\/(rss|atom)\+xml["']/i.test(tag)) continue;
    const h = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!h) continue;
    try { out.push(new URL(decodeEntities(h[1]), base).href); } catch { /* skip */ }
  }
  return out;
}

module.exports = { parseFeed, discoverFeeds, decodeEntities };
