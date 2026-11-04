'use strict';
const VERSION = 'vesti-v7';
const SHELL = ['/', '/style.css', '/app.js', '/cyr.js', '/manifest.webmanifest', '/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // News: network first, fall back to the last copy and flag it as offline
  if (url.pathname === '/api/news') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (!res.ok) throw new Error('bad status'); // 5xx falls back to the saved copy too
          const check = res.clone(), keep = res.clone(); // clone before the page reads the body
          check.json().then((j) => { if (j && j.items && j.items.length) caches.open(VERSION).then((c) => c.put('/api/news', keep)); }).catch(() => {});
          return res;
        })
        .catch(async () => {
          const hit = await caches.match('/api/news');
          if (!hit) return new Response('{}', { status: 503 });
          const headers = new Headers(hit.headers);
          headers.set('x-from-cache', '1');
          return new Response(await hit.blob(), { status: 200, headers });
        }),
    );
    return;
  }
  if (url.pathname.startsWith('/api/')) return;

  // App shell: stale-while-revalidate
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
        return res;
      });
      return hit || net;
    }),
  );
});
