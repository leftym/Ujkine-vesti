'use strict';
// The six outlets. `icon` is each outlet's own small icon, loaded from its site at runtime (never bundled);
// the app falls back to a colored dot when it cannot be loaded. Checked daily by scripts/health-report.js.
// `feeds` are tried in order until one returns items; if all fail,
// the server falls back to auto-discovery (<link rel="alternate" type="application/rss+xml">
// on the home page). Override the first candidate with an env var, e.g.
//   FEED_B92=https://www.b92.net/info/rss/vesti.xml

const SOURCES = [
  {
    id: 'n1', icon: 'https://n1info.rs/media/images/n1_fav_icon.2e16d0ba.fill-32x32.png', name: 'N1', home: 'https://n1info.rs', color: '#d71920',
    feeds: ['https://n1info.rs/feed/'],
  },
  {
    id: 'nova', icon: 'https://nova.rs/media/images/2025/11/1763720629_16.2e16d0ba.fill-48x48.svg', name: 'Nova.rs', home: 'https://nova.rs', color: '#0a5bd3',
    feeds: ['https://nova.rs/feed/'],
  },
  {
    id: 'b92', icon: 'https://www.b92.net/files/b92/img/icons/apple-icon-144x144.png', name: 'B92', home: 'https://www.b92.net', color: '#f28c00',
    // "Najnovije" (all sections, last hour) + "Info" (world news, ~5h), merged, plus the homepage
    // headlines (lib/b92.js): see that file for why none of them is enough on its own.
    feeds: [
      'https://www.b92.net/feed/',
      'https://www.b92.net/info/rss/vesti.xml',
    ],
    merge: true,
    homeScrape: 'b92',
  },
  {
    id: 'blic', icon: 'https://www.blic.rs/apple-touch-icon.png', name: 'Blic', home: 'https://www.blic.rs', color: '#e30613',
    feeds: [
      'https://www.blic.rs/rss/danasnje-vesti',
      'https://www.blic.rs/rss/vesti',
    ],
  },
  {
    id: 'politika', icon: 'https://www.politika.rs/themed/politika/img/favicon/apple-icon-120x120.png', name: 'Politika', home: 'https://www.politika.rs', color: '#6b3fa0',
    feeds: [
      'https://www.politika.rs/rss',
      'https://www.politika.rs/rss/',
    ],
  },
  {
    id: 'rts', icon: 'https://www.rts.rs/assets/front/img/favicon/favicon.ico', name: 'RTS', home: 'https://www.rts.rs', color: '#00875a',
    feeds: [
      'https://www.rts.rs/vesti/rss.html',
      'https://www.rts.rs/page/stories/sr/rss.html',
    ],
  },
];

for (const s of SOURCES) {
  const env = typeof process !== 'undefined' && process.env ? process.env['FEED_' + s.id.toUpperCase()] : null;
  if (env) s.feeds.unshift(env);
  s.host = new URL(s.home).hostname.replace(/^www\./, '');
}

module.exports = { SOURCES };
