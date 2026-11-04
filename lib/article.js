'use strict';
// Best-effort "reader mode": pull the headline, lead image, body text and photos out of an
// article page, dropping scripts, ad blocks and "read also" teasers. Pure heuristics.

const { decodeEntities } = require('./rss');
const { toLatin } = require('./text');

const NOISE_BLOCKS = /<(script|style|noscript|iframe|svg|form|nav|header|footer|aside|ins|button|template)\b[\s\S]*?<\/\1>/gi;
const JUNK_LINE = /^(oglas|advertisement|reklama|pročitajte( i)?|procitajte( i)?|pogledajte( i)?|pratite nas|pretplatite|podelite|foto:|video:|izvor:|ceo tekst|\(foto|\[foto)/i;
const BAD_IMG = /(logo|icon|sprite|pixel|avatar|banner|emoji|placeholder|spacer|blank|doubleclick|adserver|tracking|\/ads?\/|\/reklam|share|social|\.svg|\.gif)/i;
const MAX_IMAGES = 8;

function noComments(s) {
  let o = '', i = 0;
  for (;;) {
    const a = s.indexOf('<!--', i);
    if (a < 0) return o + s.slice(i);
    const b = s.indexOf('-->', a + 4);
    if (b < 0) return o + s.slice(i, a);
    o += s.slice(i, a) + ' '; i = b + 3;
  }
}
function meta(html, prop) {
  const head = html.slice(0, 150000), low = head.toLowerCase();
  const re = new RegExp('(?:property|name)=["\']' + prop + '["\']', 'i');
  for (let q = 0, n = 0; n < 200; n++) {
    const a = low.indexOf('<meta', q);
    if (a < 0) return null;
    const e = low.indexOf('>', a);
    q = a + 5; n++;
    if (e < 0) return null;
    const tag = head.slice(a, Math.min(e + 1, a + 2000));
    if (!re.test(tag)) continue;
    const c = tag.match(/content=["']([^"']*)["']/i);
    return c ? decodeEntities(c[1]) : null;
  }
  return null;
}

function biggest(html, tagName) {
  const re = new RegExp('<' + tagName + '\\b[^>]*>([\\s\\S]*?)</' + tagName + '>', 'gi');
  let best = '';
  let m;
  while ((m = re.exec(html))) if (m[1].length > best.length) best = m[1];
  return best;
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp('\\b' + name + '\\s*=\\s*("([^"]*)"|\'([^\']*)\')', 'i'));
  return m ? decodeEntities(m[2] ?? m[3]) : null;
};

function absUrl(src, base) {
  try { return new URL(src, base || undefined).href; } catch { return null; }
}

// Returns {src, alt} for a usable content photo, or null (icons, trackers, ad banners, tiny images)
function pickImage(tag, base) {
  const raw = attr(tag, 'data-src') || attr(tag, 'data-lazy-src') || attr(tag, 'data-original') || attr(tag, 'src');
  if (!raw || /^data:/i.test(raw)) return null;
  const src = absUrl(raw, base);
  if (!src || !/^https:/i.test(src) || BAD_IMG.test(src)) return null;
  const w = parseInt(attr(tag, 'width') || '', 10);
  const h = parseInt(attr(tag, 'height') || '', 10);
  if ((w && w < 150) || (h && h < 100)) return null;
  if (BAD_IMG.test(attr(tag, 'class') || '')) return null;
  return { src, alt: (attr(tag, 'alt') || '').trim() };
}

// The regexes below scan to the end of the page for every unclosed tag, which is quadratic.
// A real page is balanced; a broken or hostile one is refused before any regex runs.
const BALANCE_TAGS = ['figcaption', 'body', 'p', 'figure', 'article', 'main', 'h2', 'h3', 'blockquote', 'title', 'script', 'style', 'noscript',
  'iframe', 'svg', 'form', 'nav', 'header', 'footer', 'aside', 'ins', 'button', 'template'];
function looksHostile(html) {
  const low = html.toLowerCase();
  const count = (needle) => { let n = 0, i = -1; while ((i = low.indexOf(needle, i + 1)) >= 0) n++; return n; };
  if (count('<') - count('>') > 100) return true; // many tags that never end
  for (const t of BALANCE_TAGS) {
    const opens = count('<' + t + '>') + count('<' + t + ' ') + count('<' + t + '/') + count('<' + t + '\n');
    if (opens - count('</' + t + '>') > 40) return true;
  }
  return false;
}

function bodyOf(html) {
  const low = html.toLowerCase();
  const a = low.indexOf('<body');
  if (a < 0) return html;
  const e = low.lastIndexOf('</body>');
  return e > a ? html.slice(a, e + 7) : html.slice(a);
}

function extractArticle(html, { latin = true, base = null } = {}) {
  html = String(html == null ? '' : html).slice(0, 400000);
  if (looksHostile(html)) return { title: '', image: null, blocks: [] };
  const fix = (s) => (latin ? toLatin(s) : s);
  const title = fix(meta(html, 'og:title') || (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const lead = meta(html, 'og:image');

  let region = biggest(html, 'article') || biggest(html, 'main') || bodyOf(html);
  // YouTube embeds would be dropped with the other iframes; keep them as video links instead
  region = region.replace(/<iframe\b[\s\S]*?<\/iframe>|<iframe\b[^>]*\/>/gi, (m) => {
    const src = attr(m, 'src') || attr(m, 'data-src') || '';
    const id = (src.match(/(?:youtube(?:-nocookie)?\.com\/embed\/|youtu\.be\/)([\w-]{11})/) || [])[1];
    return id ? `<p>[[YT:${id}]]</p>` : ' ';
  });
  region = noComments(region).replace(NOISE_BLOCKS, ' ');

  const blocks = [];
  const seenImg = new Set();
  const seenVid = new Set();
  if (lead) { const a = absUrl(lead, base); if (a) seenImg.add(a); }
  let images = 0;

  const pushImg = (tag, caption) => {
    if (images >= MAX_IMAGES) return;
    const im = pickImage(tag, base);
    if (!im || seenImg.has(im.src)) return;
    seenImg.add(im.src);
    images++;
    const cap = fix((caption || im.alt || '').replace(/\s+/g, ' ').trim());
    blocks.push({ t: 'img', src: im.src, text: cap.length > 4 && cap.length < 220 ? cap : '' });
  };

  // one pass in document order: text blocks, figures and loose images
  const re = /<(p|h2|h3|blockquote)\b[^>]*>[\s\S]*?<\/\1>|<figure\b[\s\S]*?<\/figure>|<img\b[^>]*>/gi;
  let m;
  while ((m = re.exec(region)) && blocks.length < 80) {
    const chunk = m[0];
    const kind = (m[1] || (chunk.startsWith('<figure') ? 'figure' : 'img')).toLowerCase();

    if (kind === 'img') { pushImg(chunk); continue; }
    if (kind === 'figure') {
      const img = chunk.match(/<img\b[^>]*>/i);
      const cap = (chunk.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i) || [])[1];
      if (img) pushImg(img[0], cap ? decodeEntities(cap.replace(/<[^>]*>/g, ' ')) : '');
      continue;
    }
    for (const im of chunk.match(/<img\b[^>]*>/gi) || []) pushImg(im);
    const txt = fix(decodeEntities(chunk.replace(/<img\b[^>]*>/gi, ' ').replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim());
    const yt = txt.match(/^\[\[YT:([\w-]{11})\]\]$/);
    if (yt) {
      if (!seenVid.has(yt[1])) { seenVid.add(yt[1]); blocks.push({ t: 'video', id: yt[1], text: '' }); }
      continue;
    }
    if (!txt || JUNK_LINE.test(txt)) continue;
    const isHead = kind === 'h2' || kind === 'h3';
    if (!isHead && txt.length < 40) continue; // captions, bylines, ad slogans
    if (isHead && txt.length > 120) continue;
    const last = blocks[blocks.length - 1];
    if (last && last.text === txt) continue;
    blocks.push({ t: isHead ? 'h' : 'p', text: txt });
  }
  return { title: title.trim(), image: lead && /^https:\/\//i.test(lead) ? lead : null, blocks };
}

module.exports = { extractArticle };
