'use strict';
const fs = require('fs');
const path = require('path');
const FX = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');

// Fake network: N1, RTS, Politika and Blic work at their primary URL. B92 has two feeds that are
// merged plus a homepage that is scraped. Nova's primary feed 404s, so the server must discover
// the feed from the home page. YouTube channel feeds work except Blic's.
const ROUTES = {
  'https://n1info.rs/feed/': () => FX('n1.xml'),
  'https://www.rts.rs/vesti/rss.html': () => FX('rts.xml'),
  'https://www.politika.rs/rss': () => FX('politika.xml'),
  'https://www.blic.rs/rss/danasnje-vesti': () => FX('blic.atom'),
  'https://www.b92.net/': () => FX('b92-home.html'),
  'https://www.b92.net': () => FX('b92-home.html'),
  'https://www.b92.net/feed/': () => FX('b92.xml'),
  'https://www.b92.net/info/rss/vesti.xml': () => FX('b92-info.xml'),
  'https://nova.rs': () => FX('nova-home.html'),
  'https://nova.rs/alt.xml': () => FX('nova.xml'),
  'https://www.rts.rs/vesti/politika/12345/budzet.html': () => FX('article.html'),
};
async function fetchText(url) {
  if (url.startsWith('https://www.youtube.com/feeds/videos.xml?channel_id=')) {
    if (url.endsWith('UCh8iuMWj3-8WvABLcAjWDPQ')) { const e = new Error('HTTP 404'); e.code = 'HTTP_404'; throw e; } // Blic channel down
    return FX('yt.xml');
  }
  const r = ROUTES[url];
  if (!r) { const e = new Error('HTTP 404'); e.code = 'HTTP_404'; throw e; }
  return r();
}

module.exports = { fetchText };
