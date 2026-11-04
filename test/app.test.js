'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');

const { fetchText } = require('./mock');

// Freeze the clock: fixtures are dated 2026-11-02 and the engine drops items older than 7 days,
// so without this the tests would start failing a week after they were written.
const FIXED_NOW = Date.parse('2026-11-02T21:30:00Z');
Date.now = () => FIXED_NOW;

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
  assert.ok(st.b92.ok);
  assert.match(st.b92.feed, /b92\.net\/feed\/.*vesti\.xml.*homepage/, 'b92 uses both feeds and the homepage');
  assert.ok(st.nova.ok && /alt\.xml$/.test(st.nova.feed), 'nova feed is found by auto-discovery');

  // B92 homepage headlines that are in no feed are added, with section from the URL and an estimated time
  const macura = find(/Priveden Davor Macura/);
  assert.ok(macura, 'homepage-only story is present');
  assert.equal(macura.title.startsWith('Priveden'), true, '"uživo" prefix removed');
  assert.equal(macura.category, 'hronika');
  assert.ok(Math.abs(Date.parse(macura.published) - Date.parse('2026-11-02T20:45:00Z')) < 60e3, 'time from B92\'s own "45 min" label');
  assert.equal(macura.image, 'https://www.b92.net/data/images/2026-11-02/1_kf.jpg?timestamp=1', 'photo taken from the homepage block');
  assert.match(macura.summary, /detalje hapšenja/);
  const nbs = find(/NBS izdala obaveštenje/);
  assert.equal(nbs.category, 'ekonomija');
  assert.ok(Math.abs(Date.parse(nbs.published) - Date.parse('2026-11-02T12:18:00Z')) < 5 * 60e3, 'plain-link fallback: time interpolated between article numbers');
  assert.equal(data.items.filter((i) => /referentni tekst o politici/.test(i.title)).length, 1, 'same story in feed and homepage is not duplicated');
  assert.ok(find(/referentni tekst o politici/).rank <= 2, 'rank is the best of feed position and homepage position');

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

  assert.ok(!data.items.some((i) => /\/english\//.test(i.url)), "N1's English edition is excluded");

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
  const vids = art.blocks.filter((b) => b.t === 'video');
  assert.deepEqual(vids.map((b) => b.id), ['dQw4w9WgXcQ'], 'YouTube embed kept, ad iframe dropped');
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

test('top stories: three generic word-roots are not enough to merge different stories', () => {
  const { computeTop } = require('../lib/top');
  const now = Date.parse('2026-11-02T12:00:00Z');
  const mk = (id, source, title, rank) => ({ id, source, title, rank, image: null, ad: null, published: new Date(now - 3600e3).toISOString() });
  const items = [
    mk('m1', 'n1', 'Makron razgovarao sa Srdanovićem: čestitam Studentskoj listi, nastavljamo da pratimo Srbiju na evropskom putu', 0),
    mk('m2', 'b92', 'Makron čestitao Srdanoviću na izbornoj pobedi i potvrdio podršku evropskom putu', 1),
    // shares "evrop", "nasta", "razgo" with m1 but is a different story
    mk('g1', 'blic', 'Amerika poziva Evropu da nastavi kupovinu ruskog gasa: otkriveni detalji razgovora u Moskvi i Kijevu', 0),
  ];
  for (let i = 0; i < 3; i++) items.push(mk('e' + i, ['nova', 'rts', 'politika'][i], `Evropska komisija o drugoj temi broj ${i} ${'q'.repeat(i + 4)}`, 30 + i));
  for (let i = 0; i < 6; i++) items.push(mk('x' + i, ['nova', 'rts', 'politika'][i % 3], `Sasvim nepovezana vest broj ${i} ${'z'.repeat(i + 4)}`, 40 + i));
  const top = computeTop(items, { now });
  const macron = top.find((c) => c.ids.includes('m1'));
  assert.ok(macron && macron.ids.includes('m2'), 'real match still merges');
  assert.ok(!macron.ids.includes('g1'), 'gas story must stay separate');
});

test('video tab data: channel feeds, tolerant of one channel being down', async () => {
  const { clearVideoCache } = require('../lib/videos');
  clearVideoCache();
  const { status, body } = await get(server, '/api/videos');
  assert.equal(status, 200);
  const v = JSON.parse(body);
  const st = Object.fromEntries(v.status.map((s) => [s.source, s]));
  assert.equal(st.blic.ok, false);
  assert.ok(st.n1.ok && st.rts.ok && st.b92.ok);
  const n1 = v.items.filter((i) => i.source === 'n1');
  assert.equal(n1.length, 2, 'the 2-month-old video is dropped, the Short is kept');
  const normal = n1.find((i) => !i.short);
  assert.equal(normal.title, 'Dnevnik 02.11.2026.', 'Cyrillic title transliterated');
  assert.equal(normal.url, 'https://www.youtube.com/watch?v=AAAAAAAAAAA');
  assert.match(normal.image, /^https:\/\/i1\.ytimg\.com\//);
  const short = n1.find((i) => i.short);
  assert.equal(short.url, 'https://www.youtube.com/shorts/CCCCCCCCCCC');
  assert.equal(short.videoId, 'CCCCCCCCCCC');
});

test('B92 article numbers give time estimates', () => {
  const { estimateTs, idOf } = require('../lib/b92');
  assert.equal(idOf('https://www.b92.net/info/svet/281687/x/vest'), 281687);
  assert.equal(idOf('https://www.b92.net/info/vesti/5/x'), null);
  const known = [{ id: 100000, ts: 1000e3 }, { id: 100100, ts: 1000e3 + 6000e3 }];
  assert.equal(estimateTs(100050, known, 8000e3), 1000e3 + 3000e3);
  assert.ok(estimateTs(99900, known, 8000e3) < 1000e3, 'older ids extrapolate backwards');
  assert.equal(estimateTs(100050, [], 777), 777, 'no reference points: now');
});

test('Latin to Cyrillic', () => {
  const { toCyr, cyrToFold } = require('../public/cyr.js');
  const cases = {
    'Vlada usvojila budžet': 'Влада усвојила буџет',
    'Ljubljana': 'Љубљана', 'Njegoš': 'Његош', 'Đoković': 'Ђоковић', 'džep': 'џеп', 'Džon': 'Џон',
    'LJUBAV': 'ЉУБАВ', 'RTS': 'РТС', 'N1': 'Н1', 'FOTO/VIDEO': 'ФОТО/ВИДЕО',
    'pre 2 sata': 'пре 2 сата', '2.11.2026.': '2.11.2026.',
  };
  for (const [lat, cyr] of Object.entries(cases)) assert.equal(toCyr(lat), cyr, lat);
  // brands, web addresses and foreign words are left alone
  for (const keep of ['YouTube', 'iPhone', 'n1info.rs/feed/', 'Maxwell', 'Twitter']) assert.equal(toCyr(keep), keep, keep);
  assert.equal(toCyr(toCyr('Vesti')), 'Вести', 'running it twice changes nothing');
  assert.equal(toCyr('Nova.rs'), 'Нова.рс', 'outlet names convert too');
  assert.equal(toCyr('injekcija'), 'инјекција');
  assert.equal(toCyr('nadživeti'), 'надживети');
  assert.equal(toCyr('Google i Facebook'), 'Google и Facebook');
  assert.equal(toCyr('Njegoš'), 'Његош', 'ordinary nj is still one letter');
  // searching in Cyrillic finds Latin headlines
  assert.equal(cyrToFold('Ђоковић шампион'), 'djokovic sampion');
});

test('every outlet has an https icon address and the API passes it on', async () => {
  const { SOURCES } = require('../lib/sources');
  for (const s of SOURCES) assert.match(s.icon || '', /^https:\/\//, s.id);
  const data = JSON.parse((await get(server, '/api/news')).body);
  assert.ok(data.sources.every((s) => /^https:/.test(s.icon)), 'icons reach the app');
});

test('Cyrillic leaves addresses, handles, units and brand models alone', () => {
  const { toCyr } = require('../public/cyr.js');
  assert.equal(toCyr('vesti@nova.rs'), 'vesti@nova.rs');
  assert.equal(toCyr('https://www.blic.rs/vesti/x'), 'https://www.blic.rs/vesti/x');
  assert.equal(toCyr('25°C i 12h'), '25°C и 12h');
  assert.equal(toCyr('@vucicsrb'), '@vucicsrb');
  assert.equal(toCyr('konjugacija'), 'конјугација');
  assert.equal(toCyr('Samsung Galaxy S24'), 'Samsung Galaxy S24');
});

test('classifier: Politika-style headlines without a section, and no false ad hits', () => {
  const { classify, detectAd } = require('../lib/classify');
  const cat = (title) => classify({ url: 'https://www.politika.rs/scc/clanak/1/x', title });
  assert.equal(cat('Zemljotres pogodio Tursku'), 'hronika');
  assert.equal(cat('Šojgu stigao u Peking'), 'svet');
  assert.notEqual(cat('Evropski parlament usvojio rezoluciju'), 'ekonomija');
  assert.equal(detectAd({ title: 'Vlada daje popust na račune za struju 30%' }), null);
  assert.equal(detectAd({ title: 'Gledajte: sednica Vlade' }), null);
  assert.equal(detectAd({ title: 'Samo danas popust 50% na sve' }), 'promo');
});

test('feed parser refuses unsafe links and survives junk input', () => {
  const { parseFeed } = require('../lib/rss');
  const xml = '<rss><channel><item><title>A</title><link>javascript:alert(1)</link></item>' +
    '<item><title>B</title><link>https://x.rs/b</link><enclosure url="file:///etc/passwd" type="image/jpeg"/></item></channel></rss>';
  const items = parseFeed(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].image, null);
  assert.equal(parseFeed(null).length, 0);
});

test('Cyrillic round 2: units, inflected brands, foreign letters, quotes', () => {
  const { toCyr } = require('../public/cyr.js');
  assert.equal(toCyr('90km/h'), '90km/h');
  assert.equal(toCyr('Samsungov telefon'), 'Samsungov телефон');
  assert.equal(toCyr('Müller u Zürichu'), 'Müller у Zürichu');
  assert.equal(toCyr('Xi Đinping'), 'Си Ђинпинг');
  assert.equal(toCyr('Šta ’Zvezda’ radi'), 'Шта ’Звезда’ ради');
  assert.equal(toCyr('Inje na granama'), 'Иње на гранама');
  assert.equal(toCyr('N1 javlja'), 'Н1 јавља');
});

test('classifier round 2: real news is not hidden, real ads still are', () => {
  const { classify, detectAd } = require('../lib/classify');
  assert.equal(detectAd({ title: 'Tiketi za meč Srbija-Engleska u prodaji' }), null);
  assert.equal(detectAd({ title: 'Policija zatvorila ilegalnu kladionicu u Nišu' }), null);
  assert.equal(detectAd({ title: 'Ko je favorit prema kvotama' }), 'betting');
  assert.equal(detectAd({ title: 'Popust 50% na sve' }), 'promo');
  assert.equal(detectAd({ title: 'Kod nas nema popusta, kaže ministar' }), null);
  const cat = (t) => classify({ url: 'https://www.politika.rs/scc/clanak/1/x', title: t });
  assert.equal(cat('Zvezda savladala Real u Evroligi'), 'sport');
  assert.notEqual(cat('Kurs engleskog jezika'), 'ekonomija');
});

test('feed parser stays fast on hostile input and clamps dates', () => {
  const { parseFeed } = require('../lib/rss');
  const t = Date.now();
  parseFeed('<rss>' + '<item><title>x</title>'.repeat(40000));
  parseFeed('<rss><item>' + '<title>x'.repeat(100000) + '</item></rss>');
  assert.ok(Date.now() - t < 1500);
  const r = parseFeed('<rss><item><title>A</title><link>https://x.rs/a</link><pubDate>Wed, 01 Jan 2040 10:00:00 GMT</pubDate></item></rss>');
  assert.ok(r[0].ts <= Date.now() + 3700 * 1000);
});
