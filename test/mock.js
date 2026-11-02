'use strict';
const fs = require('fs');
const path = require('path');
const FX = (f) => fs.readFileSync(path.join(__dirname, 'fixtures', f), 'utf8');

// Fake network: N1, RTS, Politika and Blic work at their primary URL; B92's primary
// candidates 404 so the server must auto-discover the feed from the home page; Nova is down.
const ROUTES = {
  'https://n1info.rs/feed/': () => FX('n1.xml'),
  'https://www.rts.rs/vesti/rss.html': () => FX('rts.xml'),
  'https://www.politika.rs/rss': () => FX('politika.xml'),
  'https://www.blic.rs/rss/danasnje-vesti': () => FX('blic.atom'),
  'https://www.b92.net/': () => FX('b92-home.html'),
  'https://www.b92.net': () => FX('b92-home.html'),
  'https://www.b92.net/info/rss/pronadjen.xml': () => FX('b92.xml'),
  'https://www.rts.rs/vesti/politika/12345/budzet.html': () => FX('article.html'),
};
async function fetchText(url) {
  const r = ROUTES[url];
  if (!r) { const e = new Error('HTTP 404'); e.code = 'HTTP_404'; throw e; }
  return r();
}

module.exports = { fetchText };
