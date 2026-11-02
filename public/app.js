(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const KEY = 'vesti.settings.v1';
  const PAGE = 40;

  const SCALES = [1, 1.15, 1.3, 1.5, 1.75, 2];
  const DEFAULTS = { fs: 2, sources: [], cats: [], q: '', hideAds: true, hideBetting: true, reader: true, muted: '' };
  let S = loadSettings();
  let DATA = null;
  let fromCache = false;
  let shown = PAGE;

  const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.VestiEngine);
  const api = {
    async news(force) {
      if (NATIVE) return window.VestiEngine.news(force);
      const r = await fetch('/api/news' + (force ? '?refresh=1' : ''));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return { data: await r.json(), fromCache: r.headers.get('x-from-cache') === '1' };
    },
    async article(url) {
      if (NATIVE) return window.VestiEngine.article(url);
      const r = await fetch('/api/article?url=' + encodeURIComponent(url));
      if (!r.ok) throw new Error('no text');
      return r.json();
    },
  };

  function loadSettings() {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { ...DEFAULTS }; }
  }
  function saveSettings() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* private mode */ }
  }

  function applyFs() {
    S.fs = Math.min(SCALES.length - 1, Math.max(0, Number(S.fs) || 0));
    document.documentElement.style.setProperty('--fs', SCALES[S.fs]);
    $('#fsDown').disabled = S.fs === 0;
    $('#fsUp').disabled = S.fs === SCALES.length - 1;
  }

  const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj');

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function ago(iso) {
    const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
    if (m < 1) return 'upravo';
    if (m < 60) return 'pre ' + m + ' min';
    const h = Math.round(m / 60);
    if (h < 24) return 'pre ' + h + ' h';
    const d = Math.round(h / 24);
    return d === 1 ? 'juče' : 'pre ' + d + ' dana';
  }

  // ---- filtering -----------------------------------------------------------
  function mutedWords() {
    return S.muted.split(/[,\n]/).map((w) => fold(w.trim())).filter(Boolean);
  }

  function isHiddenAd(it) {
    if (!it.ad) return false;
    if (it.ad === 'betting') return S.hideBetting;
    return S.hideAds;
  }

  function filtered() {
    const muted = mutedWords();
    const q = fold(S.q.trim());
    let adsRemoved = 0;
    const list = [];
    for (const it of DATA.items) {
      if (S.sources.length && !S.sources.includes(it.source)) continue;
      if (S.cats.length && !S.cats.includes(it.category)) continue;
      if (isHiddenAd(it)) { adsRemoved++; continue; }
      const hay = fold(it.title + ' ' + it.summary);
      if (muted.length && muted.some((w) => hay.includes(w))) { adsRemoved++; continue; }
      if (q && !hay.includes(q)) continue;
      list.push(it);
    }
    return { list, adsRemoved };
  }

  // ---- rendering -----------------------------------------------------------
  function chip(label, pressed, onClick, color) {
    const b = el('button', 'chip');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(pressed));
    if (color) { const d = el('span', 'dot'); d.style.setProperty('--c', color); b.append(d); }
    b.append(label);
    b.addEventListener('click', onClick);
    return b;
  }

  function toggle(arr, v) {
    const i = arr.indexOf(v);
    if (i >= 0) arr.splice(i, 1); else arr.push(v);
  }

  function renderChips() {
    const src = $('#srcChips');
    src.replaceChildren(chip('Svi', S.sources.length === 0, () => { S.sources = []; changed(); }));
    for (const s of DATA.sources) {
      src.append(chip(s.name, S.sources.includes(s.id), () => { toggle(S.sources, s.id); changed(); }, s.color));
    }

    const present = new Set(DATA.items.map((i) => i.category));
    const cat = $('#catChips');
    cat.className = 'chips cats';
    cat.replaceChildren(chip('Sve', S.cats.length === 0, () => { S.cats = []; changed(); }));
    for (const c of DATA.categories) {
      if (!present.has(c.id)) continue;
      cat.append(chip(c.label, S.cats.includes(c.id), () => { toggle(S.cats, c.id); changed(); }));
    }
  }

  function renderStatus(adsRemoved, count) {
    const st = $('#status');
    st.replaceChildren();
    const t = new Date(DATA.updatedAt).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
    const parts = [(fromCache ? 'Offline · sačuvano ' : 'Ažurirano ') + t, count + ' vesti'];
    if (adsRemoved) parts.push('uklonjeno ' + adsRemoved);
    st.append(parts.join(' · '));
    const bad = DATA.status.filter((x) => !x.ok).map((x) => DATA.sources.find((s) => s.id === x.id).name);
    if (bad.length) {
      const w = el('span', 'warn', ' · nedostupno: ' + bad.join(', '));
      st.append(w);
    }
  }

  function card(it) {
    const src = DATA.sources.find((s) => s.id === it.source);
    const cat = DATA.categories.find((c) => c.id === it.category);
    const a = el('article', 'card' + (it.ad ? ' isad' : ''));
    a.tabIndex = 0;
    a.setAttribute('role', 'link');

    const body = el('div', 'body');
    const meta = el('div', 'meta');
    const s = el('span', 'src');
    const dot = el('span', 'dot');
    dot.style.setProperty('--c', src.color);
    s.append(dot, src.name);
    meta.append(s, el('span', null, ago(it.published)));
    if (cat && cat.id !== 'ostalo') meta.append(el('span', 'tag', cat.label));
    if (it.ad) meta.append(el('span', 'adbadge', it.ad === 'betting' ? 'KLADIONICA' : it.ad === 'self' ? 'NAJAVA' : 'OGLAS'));
    body.append(meta, el('h2', null, it.title));
    if (it.summary) body.append(el('p', null, it.summary));
    a.append(body);

    if (it.image) {
      const img = el('img');
      img.src = it.image;
      img.alt = '';
      img.loading = 'lazy';
      img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => img.remove());
      a.append(img);
    }
    const open = () => openItem(it);
    a.addEventListener('click', open);
    a.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    return a;
  }

  function render() {
    if (!DATA) return;
    renderChips();
    const { list, adsRemoved } = filtered();
    renderStatus(adsRemoved, list.length);
    const box = $('#list');
    box.replaceChildren();
    if (!list.length) {
      box.append(el('div', 'empty', 'Nema vesti za izabrane filtere.'));
    } else {
      for (const it of list.slice(0, shown)) box.append(card(it));
    }
    $('#more').hidden = list.length <= shown;
  }

  function changed() {
    shown = PAGE;
    saveSettings();
    render();
    window.scrollTo({ top: 0 });
  }

  // ---- data ----------------------------------------------------------------
  async function load(force) {
    const btn = $('#refresh');
    btn.classList.add('spin');
    try {
      const res = await api.news(force);
      fromCache = res.fromCache;
      DATA = res.data;
      render();
      renderDiag();
    } catch (e) {
      if (!DATA) $('#status').textContent = 'Ne mogu da učitam vesti. Proveri vezu i pokušaj ponovo.';
    } finally {
      btn.classList.remove('spin');
    }
  }

  // ---- reader --------------------------------------------------------------
  async function openItem(it) {
    if (!S.reader) { window.open(it.url, '_blank', 'noopener,noreferrer'); return; }
    const dlg = $('#reader');
    const body = $('#readerBody');
    $('#openOriginal').href = it.url;
    body.replaceChildren(el('h1', null, it.title), el('p', 'note', 'Učitavanje…'));
    dlg.showModal();
    dlg.scrollTop = 0;
    try {
      const art = await api.article(it.url);
      body.replaceChildren(el('h1', null, art.title || it.title));
      if (art.image && /^https:/.test(art.image)) {
        const img = el('img');
        img.src = art.image; img.alt = ''; img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', () => img.remove());
        body.append(img);
      }
      for (const b of art.blocks) body.append(el(b.t === 'h' ? 'h3' : 'p', null, b.text));
    } catch {
      body.replaceChildren(
        el('h1', null, it.title),
        el('p', 'note', 'Tekst nije moguće izdvojiti (sajt možda traži pretplatu). Otvori original gore.'),
      );
    }
  }

  // ---- settings ------------------------------------------------------------
  function renderDiag() {
    const ul = $('#diag');
    ul.replaceChildren();
    for (const st of DATA.status) {
      const name = DATA.sources.find((s) => s.id === st.id).name;
      const li = el('li');
      li.append(el('strong', null, name + ' '));
      li.append(el('span', st.ok ? 'ok' : 'bad', st.ok ? 'radi · ' + st.count : st.stale ? 'greška (stari podaci)' : 'ne radi'));
      if (st.ok && st.feed) li.append(el('small', null, st.feed));
      if (!st.ok && st.tried && st.tried.length) li.append(el('small', null, st.tried.join('  •  ')));
      ul.append(li);
    }
  }

  function bindSettings() {
    const ads = $('#optAds'), bet = $('#optBetting'), rd = $('#optReader'), mu = $('#optMuted');
    ads.checked = S.hideAds; bet.checked = S.hideBetting; rd.checked = S.reader; mu.value = S.muted;
    ads.addEventListener('change', () => { S.hideAds = ads.checked; changed(); });
    bet.addEventListener('change', () => { S.hideBetting = bet.checked; changed(); });
    rd.addEventListener('change', () => { S.reader = rd.checked; saveSettings(); });
    mu.addEventListener('input', () => { S.muted = mu.value; changed(); });
    $('#openSettings').addEventListener('click', () => $('#settings').showModal());
    $('#closeSettings').addEventListener('click', () => $('#settings').close());
    $('#closeReader').addEventListener('click', () => $('#reader').close());
    for (const d of document.querySelectorAll('dialog')) {
      d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
    }
  }

  // ---- boot ----------------------------------------------------------------
  const q = $('#q');
  q.value = S.q;
  let qTimer;
  q.addEventListener('input', () => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { S.q = q.value; changed(); }, 180);
  });
  $('#refresh').addEventListener('click', () => load(true));
  $('#more').addEventListener('click', () => { shown += PAGE; render(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && DATA && Date.now() - Date.parse(DATA.updatedAt) > 5 * 60 * 1000) load(false);
  });

  $('#fsDown').addEventListener('click', () => { S.fs--; applyFs(); saveSettings(); });
  $('#fsUp').addEventListener('click', () => { S.fs++; applyFs(); saveSettings(); });
  applyFs();

  bindSettings();
  load(false);

  if (NATIVE) {
    // Android back button: close an open sheet first, otherwise send the app to the background
    const App = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (App && App.addListener) {
      App.addListener('backButton', () => {
        const open = document.querySelector('dialog[open]');
        if (open) open.close(); else if (App.minimizeApp) App.minimizeApp(); else App.exitApp();
      });
    }
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
