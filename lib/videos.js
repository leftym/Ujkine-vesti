'use strict';
// Latest videos from each outlet's official YouTube channel, via YouTube's public channel feeds
// (https://www.youtube.com/feeds/videos.xml?channel_id=...). No API key needed.
// None of the outlets' news feeds contain YouTube links, so this is a separate list.

const { parseFeed } = require('./rss');
const { toLatin } = require('./text');

// Channel ids verified on the outlets' own sites (homepage links) and against live feeds.
const CHANNELS = [
  { source: 'n1', channel: 'UCpglal7d5mhV4lA1b3-DsCw' },       // N1 (@N1infoTV)
  { source: 'nova', channel: 'UCloa3CgQMtGSeqjLkpQlEFg' },     // Nova
  { source: 'b92', channel: 'UCOJ46tnlQ39S11UreLtkq5Q' },      // B92 TV (@B92TV)
  { source: 'blic', channel: 'UCh8iuMWj3-8WvABLcAjWDPQ' },     // Blic (@Bliconline1)
  { source: 'politika', channel: 'UCqKJytAkssdCcbz6CHEdX7g' }, // Politika (@politika1904)
  { source: 'rts', channel: 'UCF6U1KDm7BLHWBBUwsZzKtQ' },      // RTS
];

const TTL_MS = 10 * 60 * 1000;
const MAX_AGE_MS = 14 * 24 * 3600 * 1000;
let cache = null; // { at, data }

const feedUrl = (id) => 'https://www.youtube.com/feeds/videos.xml?channel_id=' + id;

function videoId(url) {
  const m = String(url).match(/[?&]v=([\w-]{11})/) || String(url).match(/(?:youtu\.be|youtube\.com\/shorts)\/([\w-]{11})/);
  return m ? m[1] : null;
}

const isShort = (url) => /youtube\.com\/shorts\//.test(String(url));

async function getVideos(fetchText, { force = false } = {}) {
  const now = Date.now();
  if (!force && cache && now - cache.at < TTL_MS) return cache.data;

  const status = [];
  const items = [];
  await Promise.all(CHANNELS.map(async ({ source, channel }) => {
    try {
      const parsed = parseFeed(await fetchText(feedUrl(channel)));
      let n = 0;
      for (const p of parsed) {
        const vid = videoId(p.url);
        if (!vid || now - p.ts > MAX_AGE_MS) continue;
        items.push({
          id: 'yt' + vid,
          source,
          videoId: vid,
          title: toLatin(p.title),
          url: isShort(p.url) ? 'https://www.youtube.com/shorts/' + vid : 'https://www.youtube.com/watch?v=' + vid,
          short: isShort(p.url),
          image: p.image || 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg',
          published: new Date(p.ts).toISOString(),
        });
        n++;
      }
      status.push({ source, ok: true, count: n });
    } catch (e) {
      status.push({ source, ok: false, error: e.code || e.message });
    }
  }));

  items.sort((a, b) => (a.published < b.published ? 1 : -1));
  const data = { updatedAt: new Date(now).toISOString(), status, items };
  if (items.length || !cache) cache = { at: now, data };
  return items.length ? data : (cache ? cache.data : data);
}

function clearVideoCache() { cache = null; }

module.exports = { getVideos, clearVideoCache, CHANNELS, videoId };
