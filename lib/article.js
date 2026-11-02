'use strict';
// Best-effort "reader mode": pull the headline, lead image and body paragraphs out of an
// article page, dropping scripts, ad blocks and "read also" teasers. Pure heuristics.

const { decodeEntities } = require('./rss');
const { toLatin } = require('./text');

const NOISE_BLOCKS = /<(script|style|noscript|iframe|svg|form|nav|header|footer|aside|ins|button|template)\b[\s\S]*?<\/\1>/gi;
const JUNK_LINE = /^(oglas|advertisement|reklama|pročitajte( i)?|procitajte( i)?|pogledajte( i)?|pratite nas|pretplatite|podelite|foto:|video:|izvor:|ceo tekst|\(foto|\[foto)/i;

function meta(html, prop) {
  const re = new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]*>', 'i');
  const tag = html.match(re);
  if (!tag) return null;
  const c = tag[0].match(/content=["']([^"']*)["']/i);
  return c ? decodeEntities(c[1]) : null;
}

function biggest(html, tagName) {
  const re = new RegExp('<' + tagName + '\\b[^>]*>([\\s\\S]*?)</' + tagName + '>', 'gi');
  let best = '';
  let m;
  while ((m = re.exec(html))) if (m[1].length > best.length) best = m[1];
  return best;
}

function extractArticle(html, { latin = true } = {}) {
  const fix = (s) => (latin ? toLatin(s) : s);
  const title = fix(meta(html, 'og:title') || (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || '');
  const image = meta(html, 'og:image');

  let region = biggest(html, 'article') || biggest(html, 'main') || (html.match(/<body[\s\S]*<\/body>/i) || [html])[0];
  region = region.replace(/<!--[\s\S]*?-->/g, ' ').replace(NOISE_BLOCKS, ' ');

  const blocks = [];
  const re = /<(p|h2|h3|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(region))) {
    const txt = fix(decodeEntities(m[2].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim());
    if (!txt || JUNK_LINE.test(txt)) continue;
    const isHead = m[1].toLowerCase() === 'h2' || m[1].toLowerCase() === 'h3';
    if (!isHead && txt.length < 40) continue; // captions, bylines, ad slogans
    if (isHead && txt.length > 120) continue;
    if (blocks.length && blocks[blocks.length - 1].text === txt) continue;
    blocks.push({ t: isHead ? 'h' : 'p', text: txt });
    if (blocks.length >= 60) break;
  }
  return { title: title.trim(), image, blocks };
}

module.exports = { extractArticle };
