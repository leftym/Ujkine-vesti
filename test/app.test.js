'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const { fetchText } = require('./mock');

const { createServer } = require('../server');
const { clearCache } = require('../lib/aggregate');

function get(server, p) {
  return new Promise((resolve, reject) => {
    http.get({ port: server.address().port, path: p, host: '127.0.0.1' }, (res) => {
      let b = '';
      res.on('data', (d) => (b += d));
      res.on('end', () => resolve({ status: res.statusCode, body: b, headers: res.headers }));
    }).on('error', reject);
  });
}

let server;
test.before(async () => {
  clearCache();
  server = createServer({ fetchText });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
});
test.after(() => server.close());

test('aggregates, categorizes and flags ads', async () => {
  const { status, body } = await get(server, '/api/news');
  assert.equal(status, 200);
  const data = JSON.parse(body);
  const by = (src) => data.items.filter((i) => i.source === src);
  const find = (re) => data.items.find((i) => re.test(i.title));

  // per-source status
  const st = Object.fromEntries(data.status.map((s) => [s.id, s]));
  assert.ok(st.n1.ok && st.rts.ok && st.politika.ok && st.blic.ok);
  assert.ok(st.b92.ok, 'b92 should be found by auto-discovery');
  assert.match(st.b92.feed, /pronadjen\.xml$/);
  assert.equal(st.nova.ok, false, 'nova is down in this test');

  // N1 images + entity decoding
  assert.equal(by('n1').length, 4);
  assert.equal(find(/Pariz/).title, 'Tenis: Đoković igra u Parizu & osvaja set');
  assert.equal(by('n1')[0].image !== undefined, true);

  // Cyrillic -> Latin
  const budget = find(/usvojila novi/i);
  assert.match(budget.title, /Vlada usvojila novi budžet/);
  assert.equal(budget.image, 'https://www.rts.rs/upload/thumbnail/a.png');
  assert.equal(budget.category, 'politika');
  assert.equal(find(/saobraćajna nesreća/i).category, 'hronika');

  // categories
  assert.equal(find(/Đoković/).category, 'sport');       // URL path /sport/
  assert.equal(find(/Vučić o izborima/).category, 'politika'); // keywords
  assert.equal(find(/AMSS/).category, 'region');          // feed tag
  assert.equal(find(/kamatne stope/).category, 'ekonomija');
  assert.equal(find(/iPhone/).category, 'tehnologija');
  assert.equal(find(/Zvezda pobedila/).category, 'sport');

  // ads
  assert.equal(find(/SPONZORISANO/).ad, 'sponsored');
  assert.equal(find(/Kvote za derbi/).ad, 'betting');
  assert.equal(find(/Popust 30%/).ad, 'promo');
  assert.equal(find(/Kupite, slikajte/).ad, 'self');
  const clean = data.items.filter((i) => !i.ad);
  for (const re of [/Pariz/, /Vučić/, /AMSS/, /Zvezda pobedila/, /iPhone/, /kamatne/]) {
    assert.ok(clean.find((i) => re.test(i.title)), 'real news must not be flagged: ' + re);
  }

  // front page: the story covered by three outlets is first
  assert.equal(data.top[0].kind, 'multi');
  assert.deepEqual([...data.top[0].sources].sort(), ['b92', 'n1', 'politika']);

  // sorted newest first
  const ts = data.items.map((i) => i.published);
  assert.deepEqual(ts, [...ts].sort().reverse());
});

test('betting detection needs sport context', () => {
  const { detectAd } = require('../lib/classify');
  const pol = { url: 'https://n1info.rs/vesti/glasanje/', title: '"Štab", "kapilari" i kvote: Ninić tvrdi da ima dokaze o glasovima za SNS', categories: ['Vesti'] };
  assert.equal(detectAd(pol), null);
  assert.equal(detectAd({ url: 'https://x.rs/sport/a', title: 'Kvote za derbi: najbolji tiket', categories: [] }), 'betting');
  assert.equal(detectAd({ url: 'https://x.rs/a', title: 'Nova kladionica nudi bonus dobrodošlice', categories: [] }), 'betting');
});

test('deep URL sections and promos', () => {
  const { classify, detectAd } = require('../lib/classify');
  assert.equal(classify({ url: 'https://www.politika.rs/scc/clanak/799150/sport/tenis/sasa-zverev', title: 'Saša Zverev srećan', categories: [] }), 'sport');
  assert.equal(classify({ url: 'https://www.blic.rs/slobodno-vreme/x/abc', title: 'Islanđani se greju noću', categories: [] }), 'zivot');
  assert.equal(detectAd({ url: 'https://n1info.rs/najave-emisija/gledajte-uzivo-dnevnik/', title: 'Gledajte Dnevnik u 19h', categories: [] }), 'self');
});

test('reader mode keeps body text, drops ads/teasers/nav', async () => {
  const u = 'https://www.rts.rs/vesti/politika/12345/budzet.html';
  const { status, body } = await get(server, '/api/article?url=' + encodeURIComponent(u));
  assert.equal(status, 200);
  const art = JSON.parse(body);
  const texts = art.blocks.map((b) => b.text).join('\n');
  assert.match(art.title, /Vlada usvojila budžet/);
  assert.match(texts, /usvojila predlog budžeta/);
  assert.match(texts, /deficit/);
  assert.doesNotMatch(texts, /Pročitajte i/);
  assert.doesNotMatch(texts, /Reklama reklama/);
  assert.doesNotMatch(texts, /Meni stavka/);
  const imgs = art.blocks.filter((b) => b.t === 'img');
  assert.deepEqual(imgs.map((b) => b.src), ['https://www.rts.rs/media/sednica.jpg', 'https://www.rts.rs/media/second.jpg']);
  assert.match(imgs[0].text, /Sednica Vlade Srbije/);
});

test('article proxy only fetches the six outlets (no SSRF)', async () => {
  for (const u of ['http://169.254.169.254/latest/meta-data', 'https://evil.example/x', 'file:///etc/passwd', 'https://n1info.rs.evil.example/a']) {
    const { status } = await get(server, '/api/article?url=' + encodeURIComponent(u));
    assert.equal(status, 400, u);
  }
});

test('static files + path traversal guard', async () => {
  assert.equal((await get(server, '/')).status, 200);
  assert.equal((await get(server, '/manifest.webmanifest')).status, 200);
  assert.notEqual((await get(server, '/..%2f..%2fserver.js')).status, 200);
  assert.ok((await get(server, '/')).headers['content-security-policy']);
});

test('top stories: same story across outlets outranks single-outlet items', () => {
  const { computeTop } = require('../lib/top');
  const now = Date.parse('2026-11-02T12:00:00Z');
  const mk = (id, source, title, rank, hoursAgo = 2, image = null) => ({
    id, source, title, rank, image, ad: null, published: new Date(now - hoursAgo * 3600e3).toISOString(),
  });
  const items = [
    mk('a1', 'n1', 'Sekulović saslušan u tužilaštvu, predložen pritvor', 4),
    mk('a2', 'b92', 'Sekulović saslušan u tužilaštvu, predložen pritvor', 1, 2, 'https://img/x.jpg'),
    mk('a3', 'politika', 'Sekulović saslušan u tužilaštvu; tužilac predlaže pritvor', 7),
    mk('b1', 'blic', 'Zvezda dočekuje Partizan u večitom derbiju', 0),
    mk('c1', 'rts', 'Vremenska prognoza za utorak: sunčano i hladno', 12),
    mk('d1', 'nova', 'Stari tekst o nečemu sasvim drugom i nevažnom', 0, 60),
    { ...mk('e1', 'n1', 'Sponzorisano: kupite sada jeftino', 0), ad: 'sponsored' },
  ];
  for (let i = 0; i < 10; i++) items.push(mk('f' + i, i % 2 ? 'nova' : 'rts', 'Nasumična vest broj ' + i + ' o različitim stvarima ' + 'x'.repeat(i + 3), 20 + i));
  const top = computeTop(items, { now });
  assert.equal(top[0].kind, 'multi');
  assert.deepEqual([...top[0].sources].sort(), ['b92', 'n1', 'politika']);
  assert.equal(top[0].lead, 'a2', 'lead prefers the item with an image and best feed position');
  assert.equal(top[0].ids.length, 3);
  const all = top.flatMap((c) => c.ids);
  assert.ok(!all.includes('e1'), 'ads never make the front page');
  assert.ok(!all.includes('d1'), 'items older than 36h are ignored');
  assert.ok(!all.includes('c1'), 'low-placed single-outlet items are not "important"');
});
