(() => {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const KEY = 'vesti.settings.v1';
  const PAGE = 40;

  const SCALES = [1, 1.15, 1.3, 1.5, 1.75, 2, 2.3];
  const DEFAULTS = { view: 'news', script: 'lat', logos: !window.VESTI_STORE, images: false, summary: false, theme: 'auto', fs: 2, sources: [], cats: [], q: '', hideAds: true, hideBetting: true, reader: true, muted: '' };
  let S = loadSettings();
  let DATA = null;
  let fromCache = false;
  let shown = PAGE;
  let VIDEOS = null;
  let view = 'news';  // set from the saved choice below
  let videosFromCache = false;
  let panelOpen = false;
  let onlyShorts = false;
  let currentItem = null;

  const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && window.VestiEngine);
  const api = {
    async news(force) {
      if (NATIVE) return window.VestiEngine.news(force);
      const r = await fetch('/api/news' + (force ? '?refresh=1' : ''));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return { data: await r.json(), fromCache: r.headers.get('x-from-cache') === '1' };
    },
    async videos(force) {
      if (NATIVE) return window.VestiEngine.videos(force);
      const r = await fetch('/api/videos' + (force ? '?refresh=1' : ''));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return { data: await r.json(), fromCache: false };
    },
    async article(url) {
      if (NATIVE) return window.VestiEngine.article(url);
      const r = await fetch('/api/article?url=' + encodeURIComponent(url));
      if (!r.ok) throw new Error('no text');
      return r.json();
    },
  };

  function loadSettings() {
    let s;
    try { s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { s = { ...DEFAULTS }; }
    // damaged or old saved settings must never break the screen
    for (const k of ['sources', 'cats']) if (!Array.isArray(s[k])) s[k] = [];
    for (const k of ['q', 'muted']) s[k] = typeof s[k] === 'string' ? s[k] : '';
    if (!['news', 'video'].includes(s.view)) s.view = 'news';
    if (!['lat', 'cyr'].includes(s.script)) s.script = 'lat';
    if (!['auto', 'light', 'dark'].includes(s.theme)) s.theme = 'auto';
    if (!Number.isInteger(s.fs) || s.fs < 0 || s.fs >= SCALES.length) s.fs = DEFAULTS.fs;
    return s;
  }
  function saveSettings() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* private mode */ }
  }

  function applyTheme() {
    if (!['auto', 'light', 'dark'].includes(S.theme)) S.theme = 'auto';
    // auto = no attribute: CSS follows the phone's light/dark setting
    if (S.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', S.theme);
    // status/navigation bar icons must match the chosen theme, not only the phone's setting
    const P = window.Capacitor && window.Capacitor.Plugins;
    try {
      if (P && P.SystemBars && P.SystemBars.setStyle) Promise.resolve(P.SystemBars.setStyle({ style: S.theme === 'dark' ? 'DARK' : S.theme === 'light' ? 'LIGHT' : 'DEFAULT' })).catch(() => {});
    } catch { /* not available */ }
    const bg = S.theme === 'dark' ? '#0b0d11' : S.theme === 'light' ? '#f6f7f9' : null;
    for (const m of document.querySelectorAll('meta[name="theme-color"]')) {
      if (!m.dataset.orig) m.dataset.orig = m.content;
      m.content = bg || m.dataset.orig;
      if (bg) m.removeAttribute('media'); else if (m.dataset.orig === '#0b0d11') m.setAttribute('media', '(prefers-color-scheme: dark)'); else m.setAttribute('media', '(prefers-color-scheme: light)');
    }
  }

  function applyFs() {
    S.fs = Math.min(SCALES.length - 1, Math.max(0, Number(S.fs) || 0));
    document.documentElement.style.setProperty('--fs', SCALES[S.fs]);
    for (const id of ['#fsDown', '#rFsDown']) $(id).disabled = S.fs === 0;
    for (const id of ['#fsUp', '#rFsUp']) $(id).disabled = S.fs === SCALES.length - 1;
  }

  const fold = (s) => window.VestiCyr.cyrToFold(String(s || '').toLowerCase()).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj');

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
    if (h < 24) return 'pre ' + h + (h % 10 === 1 && h !== 11 ? ' sat' : h % 10 >= 2 && h % 10 <= 4 && (h < 10 || h > 20) ? ' sata' : ' sati');
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
  // Small mark in front of an outlet name: the outlet's own icon (loaded from its site), or a colored dot
  function mark(src) {
    const wrap = el('span', 'mark');
    const dot = el('span', 'dot');
    dot.style.setProperty('--c', src ? src.color : '#888');
    wrap.append(dot);
    if (S.logos && !window.VESTI_STORE && src && src.icon) {
      const img = el('img', 'logo');
      img.alt = ''; img.referrerPolicy = 'no-referrer'; img.loading = 'lazy'; img.src = src.icon;
      img.addEventListener('load', () => dot.remove());
      img.addEventListener('error', () => img.remove());
      wrap.append(img);
    }
    return wrap;
  }

  function chip(label, pressed, onClick, color, src) {
    const b = el('button', 'chip');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(pressed));
    if (src) b.append(mark(src));
    else if (color) { const d = el('span', 'dot'); d.style.setProperty('--c', color); b.append(d); }
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
      src.append(chip(s.name, S.sources.includes(s.id), () => { toggle(S.sources, s.id); changed(); }, s.color, s));
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
    // nothing is shown while everything is fine; he only hears about it when it matters
    const t = new Date(DATA.updatedAt).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
    const parts = [];
    if (fromCache) parts.push('Bez interneta. Prikazane su vesti sačuvane u ' + t + '.');
    else if (DATA.status.length && DATA.status.every((x) => !x.ok)) parts.push(navigator.onLine ? 'Vesti trenutno ne stižu. Prikazane su ranije.' : 'Nema interneta. Prikazane su ranije vesti.');
    else if (DATA.status.some((x) => !x.ok)) parts.push('Neki mediji trenutno ne rade.');
    st.hidden = parts.length === 0;
    if (parts.length) st.append(parts.join(' '));
  }

  function card(it) {
    const src = DATA.sources.find((s) => s.id === it.source);
    const a = el('article', 'card' + (it.ad ? ' isad' : ''));
    a.tabIndex = 0;
    a.setAttribute('role', 'link');

    const body = el('div', 'body');
    const meta = el('div', 'meta');
    const s = el('span', 'src');
    s.append(mark(src), src.name);
    meta.append(s, el('span', null, ago(it.published)));
    if (it.ad) meta.append(el('span', 'adbadge', it.ad === 'betting' ? 'KLADIONICA' : it.ad === 'self' ? 'NAJAVA' : 'REKLAMA'));
    body.append(meta, el('h2', null, it.title));
    if (S.summary && it.summary) body.append(el('p', null, it.summary));
    a.append(body);

    if (S.images && it.image) {
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

  // Open a link outside the app. On the phone this hands YouTube links to the YouTube app if installed.
  function openExternal(url) {
    const P = window.Capacitor && window.Capacitor.Plugins;
    if (NATIVE && P && P.AppLauncher && P.AppLauncher.openUrl) {
      P.AppLauncher.openUrl({ url }).then((r) => { if (!r || !r.completed) throw new Error('no app'); }).catch(() => { if (P.Browser && P.Browser.open) P.Browser.open({ url }); });
    } else if (NATIVE && P && P.Browser && P.Browser.open) {
      P.Browser.open({ url });
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  function videoCard(v) {
    const src = DATA.sources.find((s) => s.id === v.source);
    const a = el('article', 'vcard');
    a.tabIndex = 0;
    a.setAttribute('role', 'link');
    const th = el('div', 'thumb');
    const img = el('img');
    img.src = v.image; img.alt = ''; img.loading = 'lazy'; img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => img.remove());
    th.append(img, el('span', 'play', '▶'));
    const body = el('div', 'body');
    const meta = el('div', 'meta');
    const s = el('span', 'src');
    s.append(mark(src), src ? src.name : v.source);
    meta.append(s, el('span', null, ago(v.published)));
    if (v.short) meta.append(el('span', 'adbadge short', 'KRATKI'));
    body.append(meta, el('h2', null, v.title));
    const sh = el('button', 'vshare', 'Podeli');
    sh.type = 'button';
    sh.addEventListener('click', (e) => { e.stopPropagation(); shareLink(v.title, v.url); });
    body.append(sh);
    a.append(th, body);
    const open = () => openExternal(v.url);
    a.addEventListener('click', open);
    a.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    return a;
  }

  async function shareLink(title, url) {
    const data = { title, text: title, url };
    const P = window.Capacitor && window.Capacitor.Plugins;
    try {
      if (NATIVE && P && P.Share && P.Share.share) await P.Share.share({ title, text: title + '\n' + url, dialogTitle: S.script === 'cyr' ? window.VestiCyr.toCyr('Podeli') : 'Podeli' });
      else if (navigator.share) await navigator.share(data);
      else if (navigator.clipboard) await navigator.clipboard.writeText(title + ' ' + url);
    } catch { /* he closed the share sheet */ }
  }

  // Last time each outlet answered, kept between runs so the problem report can say "B92 last worked at 11:20"
  const LASTOK_KEY = 'vesti.lastok.v1';
  function lastOk() { try { const o = JSON.parse(localStorage.getItem(LASTOK_KEY) || '{}'); return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; } catch { return {}; } }
  function noteSync(status) {
    const o = lastOk();
    for (const st of status || []) if (st && st.ok && st.fetchedAt) o[st.id] = st.fetchedAt;
    try { localStorage.setItem(LASTOK_KEY, JSON.stringify(o)); } catch { /* ignore */ }
  }
  let LASTERR = '';
  const hhmm = (iso) => { const d = new Date(iso); return isNaN(d) ? '-' : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

  // One tap: opens the share sheet with a ready message. Field names are short and fixed so Dusan can read them fast.
  // No titles, links, search text or anything the uncle read is included.
  async function reportProblem() {
    const P = window.Capacitor && window.Capacitor.Plugins;
    let ver = '?', build = '?';
    try { if (P && P.App && P.App.getInfo) { const i = await P.App.getInfo(); ver = i.version; build = i.build; } } catch { /* ignore */ }
    const ok = lastOk();
    const names = {};
    for (const x of (DATA && DATA.sources) || []) names[x.id] = x.name;
    const sync = ((DATA && DATA.status) || []).map((st) => {
      const nm = names[st.id] || st.id;
      return st.ok ? nm + '=' + hhmm(st.fetchedAt) : nm + '=greška(' + (ok[st.id] ? hhmm(ok[st.id]) : '-') + ')';
    }).join(' ');
    const lines = [
      'Ujkine Vesti: imam problem.',
      '(Napiši ovde šta ne radi.)',
      '',
      '---',
      'v=' + ver + ' build=' + build,
      'ekran=' + (S.view === 'video' ? 'video' : 'vesti') + ' pismo=' + S.script + ' tema=' + S.theme,
      'slova=' + S.fs + ' (' + SCALES[S.fs] + 'x)',
      'veza=' + (navigator.onLine ? 'ima' : 'nema'),
      'sync: ' + (sync || '-'),
      'greška=' + (LASTERR || '-'),
    ];
    const text = lines.join('\n');
    try {
      if (NATIVE && P && P.Share && P.Share.share) await P.Share.share({ title: 'Problem', text, dialogTitle: S.script === 'cyr' ? window.VestiCyr.toCyr('Javi problem') : 'Javi problem' });
      else if (navigator.share) await navigator.share({ title: 'Problem', text });
      else if (navigator.clipboard) await navigator.clipboard.writeText(text);
    } catch { /* closed */ }
  }

  function renderVideos() {
    renderChips();
    const box = $('#list');
    box.replaceChildren();
    const st = $('#status');
    st.replaceChildren();
    if (!VIDEOS) { st.hidden = false; st.append(videosErr ? 'Snimci trenutno ne stižu. Proveri internet i pokušaj ponovo.' : 'Učitavanje videa…'); $('#more').hidden = true; return; }
    const q = fold(S.q.trim());
    const list = VIDEOS.items.filter((v) =>
      (!S.sources.length || S.sources.includes(v.source)) && (!onlyShorts || v.short) && (!q || fold(v.title).includes(q)));
    const t = new Date(VIDEOS.updatedAt).toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' });
    const note = videosFromCache ? 'Bez interneta. Prikazani su snimci sačuvani u ' + t + '.'
      : VIDEOS.status.some((x) => !x.ok) ? 'Neki kanali trenutno ne rade.' : '';
    st.hidden = !note;
    if (note) st.append(note);

    if (!list.length) box.append(el('div', 'empty', 'Nema snimaka za ovaj izbor.'));
    for (const v of list.slice(0, shown)) box.append(videoCard(v));
    $('#more').hidden = list.length <= shown;
  }

  let videosErr = false;
  async function loadVideos(force) {
    const btn = $('#refresh');
    btn.classList.add('spin');
    try {
      const res = await api.videos(force);
      VIDEOS = res.data;
      videosFromCache = res.fromCache;
      videosErr = false;
      if (LASTERR.startsWith('video:')) LASTERR = '';
    } catch (e) {
      videosErr = true;
      LASTERR = ('video: ' + (e.message || e)).slice(0, 80);
      if (!VIDEOS) $('#status').textContent = 'Snimci trenutno ne stižu. Proveri internet i pokušaj ponovo.';
    } finally {
      btn.classList.remove('spin');
      if (view === 'video') render();
    }
  }

  function setView(v) {
    view = v;
    S.view = v;
    saveSettings();
    $('#tabNews').setAttribute('aria-pressed', String(v === 'news'));
    $('#tabVideo').setAttribute('aria-pressed', String(v === 'video'));
    shown = PAGE;
    if (v === 'video' && !VIDEOS) loadVideos(false);
    render();
    window.scrollTo({ top: 0 });
  }

  function topSection(byId, hiddenOk) {
    const sec = el('section', 'topnews');
    sec.append(el('h3', null, 'Najvažnije danas'));
    let n = 0;
    for (const c of DATA.top || []) {
      const lead = byId.get(c.lead);
      if (!lead || !hiddenOk(lead)) continue;
      const wrap = el('div', 'tgroup' + (n === 0 ? ' hero' : ''));
      wrap.append(card(lead));
      const row = el('div', 'outlets');
      row.append(el('span', 'lbl', c.kind === 'multi' ? 'Javljaju (' + c.outlets + '):' : 'Javlja:'));
      for (const id of c.ids) {
        const it = byId.get(id);
        if (!it) continue;
        const src = DATA.sources.find((s) => s.id === it.source);
        const b = el('button', 'opill');
        b.type = 'button';
        b.append(mark(src), src.name);
        b.addEventListener('click', () => openItem(it));
        row.append(b);
      }
      wrap.append(row);
      sec.append(wrap);
      if (++n >= 8) break;
    }
    return n ? sec : null;
  }

  function showNoNews() {
    const box = $('#list');
    box.replaceChildren();
    $('#status').textContent = '';
    const wrap = el('div', 'empty');
    wrap.append(el('p', null, 'Nema interneta. Vesti će se pojaviti čim se veza vrati.'));
    const retry = el('button', 'btn big', 'Pokušaj ponovo');
    retry.type = 'button';
    retry.addEventListener('click', () => load(true));
    wrap.append(retry);
    box.append(wrap);
    $('#more').hidden = true;
  }

  // "Teme i pretraga" stays folded away unless he opens it or a topic/search is active
  function syncPanel() {
    const hasFilter = S.cats.length > 0 || S.q.trim() !== '';
    const open = view === 'news' && (panelOpen || hasFilter);
    $('#morePanel').hidden = !open;
    $('#moreBtn').hidden = view !== 'news';
    $('#moreBtn').setAttribute('aria-expanded', String(open));
    $('#moreBtn').textContent = open ? 'Zatvori ▴' : 'Teme i pretraga ▾';
    $('#ytrow').hidden = view !== 'video';
    const vc = $('#vidChips');
    vc.hidden = view !== 'video';
    if (view === 'video') {
      vc.replaceChildren(
        chip('Svi snimci', !onlyShorts, () => { onlyShorts = false; render(); }),
        chip('Kratki snimci', onlyShorts, () => { onlyShorts = true; render(); }),
      );
    }
  }

  function render() {
    if (!DATA) return;
    syncPanel();
    if (view === 'video') { renderVideos(); return; }
    renderChips();
    const box = $('#list');
    if (!DATA.items.length) { showNoNews(); return; }
    const { list: all, adsRemoved } = filtered();
    box.replaceChildren();

    // front page: most important stories first (only when no filter/search is active)
    let list = all;
    const noFilters = !S.sources.length && !S.cats.length && !S.q.trim();
    if (noFilters && DATA.top && DATA.top.length) {
      const byId = new Map(DATA.items.map((i) => [i.id, i]));
      const visible = new Set(all.map((i) => i.id));
      const sec = topSection(byId, (it) => visible.has(it.id));
      if (sec) {
        box.append(sec);
        const inTop = new Set();
        for (const c of DATA.top) for (const id of c.ids) inTop.add(id);
        list = all.filter((i) => !inTop.has(i.id));
        box.append(el('h3', 'sechead', 'Sve vesti'));
      }
    }
    renderStatus(adsRemoved, all.length);
    if (!list.length && !box.children.length) {
      box.append(el('div', 'empty', 'Nema vesti za ovaj izbor. Dodirni "Sve".'));
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
  let loading = false, again = false;
  async function load(force) {
    if (loading) { again = true; return; }
    loading = true;
    const btn = $('#refresh');
    btn.classList.add('spin');
    try {
      const res = await Promise.race([
        api.news(force),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 20000)),
      ]);
      fromCache = res.fromCache;
      DATA = res.data;
      noteSync(DATA.status);
      LASTERR = '';
      try {
        render();
        renderDiag();
      } catch (e2) {
        // a damaged saved copy: drop it and start clean instead of showing a blank screen
        LASTERR = ('render: ' + e2.message).slice(0, 80);
        try { localStorage.removeItem('vesti.cache.v1'); } catch { /* ignore */ }
        DATA = null;
        showNoNews();
      }
    } catch (e) {
      LASTERR = (e.message || String(e)).slice(0, 80) + '@' + hhmm(new Date().toISOString());
      if (!DATA) showNoNews();
      else {
        const st = $('#status');
        st.hidden = false;
        st.replaceChildren(el('span', 'warn', navigator.onLine ? 'Nove vesti nisu stigle. Prikazane su ranije.' : 'Nema interneta. Prikazane su ranije vesti.'));
      }
    } finally {
      btn.classList.remove('spin');
      loading = false;
      if (again) { again = false; setTimeout(() => load(false), 1500); }
    }
  }

  // ---- reader --------------------------------------------------------------
  // Every article in the reader says which outlet it comes from, when it was published, and links to the original.
  function attrib(it) {
    const src = DATA && DATA.sources.find((s) => s.id === it.source);
    const d = new Date(it.published);
    const when = isNaN(d) ? '' : d.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' });
    const box = el('p', 'attrib');
    const a = el('a', null, 'Izvorni članak ↗');
    a.href = it.url;
    a.rel = 'noopener noreferrer';
    a.addEventListener('click', (e) => { e.preventDefault(); openExternal(it.url); });
    box.append([src ? src.name : '', when].filter(Boolean).join(' · ') + ' · ', a);
    return box;
  }

  async function openItem(it) {
    if (!S.reader) { openExternal(it.url); return; }
    const dlg = $('#reader');
    const body = $('#readerBody');
    currentItem = it;
    $('#openOriginal').href = it.url;
    $('#openOriginal').dataset.url = it.url;
    body.replaceChildren(el('h1', null, it.title), attrib(it), el('p', 'note', 'Učitavanje…'));
    dlg.showModal();
    dlg.scrollTop = 0;
    try {
      const art = await api.article(it.url);
      body.replaceChildren(el('h1', null, art.title || it.title), attrib(it));
      if (S.images && art.image && /^https:/.test(art.image)) {
        const img = el('img');
        img.src = art.image; img.alt = ''; img.referrerPolicy = 'no-referrer';
        img.addEventListener('error', () => img.remove());
        body.append(img);
      }
      for (const b of art.blocks) {
        if (b.t === 'img') {
          if (!S.images || !/^https:/.test(b.src)) continue;
          const fig = el('figure');
          const im = el('img');
          im.src = b.src; im.alt = ''; im.loading = 'lazy'; im.referrerPolicy = 'no-referrer';
          im.addEventListener('error', () => fig.remove());
          fig.append(im);
          if (b.text) fig.append(el('figcaption', null, b.text));
          body.append(fig);
        } else if (b.t === 'video') {
          if (!/^[\w-]{11}$/.test(b.id)) continue;
          const btn = el('button', 'ytbtn', '▶  Pogledaj video na YouTube-u');
          btn.type = 'button';
          btn.addEventListener('click', () => openExternal('https://www.youtube.com/watch?v=' + b.id));
          body.append(btn);
        } else {
          body.append(el(b.t === 'h' ? 'h3' : 'p', null, b.text));
        }
      }
    } catch {
      body.replaceChildren(
        el('h1', null, it.title),
        attrib(it),
        el('p', 'note', 'Tekst nije moguće prikazati (sajt možda traži pretplatu). Dodirni „Otvori original na sajtu“ ispod.'),
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
      li.append(el('span', st.ok ? 'ok' : 'bad', st.ok ? 'radi (' + st.count + ' vesti)' : st.stale ? 'ne radi (stare vesti)' : 'ne radi'));
      for (const txt of [st.ok && st.feed, !st.ok && st.tried && st.tried.length && st.tried.join('  •  ')]) {
        if (!txt) continue;
        const sm = el('small', null, txt);
        sm.dataset.keep = '1';
        li.append(sm);
      }
      ul.append(li);
    }
  }

  function bindSettings() {
    const ads = $('#optAds'), bet = $('#optBetting'), rd = $('#optReader'), mu = $('#optMuted');
    for (const r of document.querySelectorAll('input[name="script"]')) {
      r.checked = r.value === S.script;
      r.addEventListener('change', () => { if (r.checked) { S.script = r.value; saveSettings(); applyScript(); } });
    }
    const im = $('#optImages'), sm = $('#optSummary'), lg = $('#optLogos');
    im.checked = S.images; sm.checked = S.summary; lg.checked = S.logos;
    lg.addEventListener('change', () => { S.logos = lg.checked; changed(); });
    if (window.VESTI_STORE) lg.closest('label').hidden = true; // the store build never shows outlet logos
    im.addEventListener('change', () => { S.images = im.checked; changed(); });
    sm.addEventListener('change', () => { S.summary = sm.checked; changed(); });
    for (const r of document.querySelectorAll('input[name="theme"]')) {
      r.checked = r.value === S.theme;
      r.addEventListener('change', () => { if (r.checked) { S.theme = r.value; applyTheme(); saveSettings(); } });
    }
    ads.checked = S.hideAds; bet.checked = S.hideBetting; rd.checked = S.reader; mu.value = S.muted;
    ads.addEventListener('change', () => { S.hideAds = ads.checked; changed(); });
    bet.addEventListener('change', () => { S.hideBetting = bet.checked; changed(); });
    rd.addEventListener('change', () => { S.reader = rd.checked; saveSettings(); });
    mu.addEventListener('input', () => { S.muted = mu.value; changed(); });
    $('#openSettings').addEventListener('click', () => $('#settings').showModal());
    $('#closeSettings').addEventListener('click', () => $('#settings').close());
    $('#closeReader').addEventListener('click', () => $('#reader').close());
    // On the phone, "original" opens as an in-app overlay (Chrome Custom Tab) instead of switching apps
    $('#openOriginal').addEventListener('click', (e) => {
      const B = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser;
      if (NATIVE && B && B.open) { e.preventDefault(); B.open({ url: e.currentTarget.dataset.url }); }
    });
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
  $('#refresh').addEventListener('click', () => (view === 'video' ? loadVideos(true) : load(true)));
  $('#moreBtn').addEventListener('click', () => { panelOpen = !panelOpen; syncPanel(); applyScript(); });
  $('#reportBtn').addEventListener('click', reportProblem);
  $('#shareBtn').addEventListener('click', () => { if (currentItem) shareLink(currentItem.title, currentItem.url); });
  $('#ytOpen').addEventListener('click', () => openExternal('https://www.youtube.com/'));
  $('#tabNews').addEventListener('click', () => setView('news'));
  $('#tabVideo').addEventListener('click', () => setView('video'));
  $('#more').addEventListener('click', () => { shown += PAGE; render(); });
  // Coming back to the app, or the signal returning after a tunnel: refresh by itself if the news is old
  function refreshIfStale() {
    if (document.hidden) return;
    const stale = (iso) => !iso || Date.now() - Date.parse(iso) > 5 * 60 * 1000;
    if (view === 'video') { if (!VIDEOS || stale(VIDEOS.updatedAt)) loadVideos(false); } else if (!DATA || stale(DATA.updatedAt)) load(false);
  }
  document.addEventListener('visibilitychange', refreshIfStale);
  window.addEventListener('online', () => { if (!document.hidden) { if (view === 'video') loadVideos(false); else load(false); } });

  const bumpFs = (d) => { S.fs += d; applyFs(); saveSettings(); };
  for (const id of ['#fsDown', '#rFsDown']) $(id).addEventListener('click', () => bumpFs(-1));
  for (const id of ['#fsUp', '#rFsUp']) $(id).addEventListener('click', () => bumpFs(1));
  applyFs();
  applyTheme();
  if (S.view === 'video') { view = 'video'; $('#tabNews').setAttribute('aria-pressed', 'false'); $('#tabVideo').setAttribute('aria-pressed', 'true'); loadVideos(false); }

  // ---- Cyrillic: convert every visible text on the page (and keep converting what the app adds) ----
  const latinOf = new WeakMap();       // text node -> its Latin original
  const phOf = new WeakMap();          // element -> Latin placeholder
  let scriptTimer = null;
  const scriptObserver = new MutationObserver(() => {
    if (scriptTimer) return;
    scriptTimer = requestAnimationFrame(() => { scriptTimer = null; applyScript(); });
  });
  const attrOf = new WeakMap();
  let docTitleLat = null;
  function applyScript() {
    scriptObserver.disconnect();
    const cyr = S.script === 'cyr';
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = tw.nextNode())) {
      const p = n.parentElement;
      if (!p || p.closest('script, style, textarea, [data-keep]')) continue;
      const orig = latinOf.get(n);
      if (cyr) {
        const base = orig !== undefined && n.nodeValue === window.VestiCyr.toCyr(orig) ? orig : n.nodeValue;
        const out = window.VestiCyr.toCyr(base);
        if (out !== n.nodeValue) { latinOf.set(n, base); n.nodeValue = out; }
      } else if (orig !== undefined) {
        n.nodeValue = orig;
        latinOf.delete(n);
      }
    }
    for (const e of document.querySelectorAll('[placeholder],[aria-label],[title]')) {
      for (const a of ['placeholder', 'aria-label', 'title']) {
        if (!e.hasAttribute(a)) continue;
        let m = attrOf.get(e);
        if (!m) attrOf.set(e, (m = {}));
        if (cyr) { if (!(a in m)) m[a] = e.getAttribute(a); e.setAttribute(a, window.VestiCyr.toCyr(m[a])); }
        else if (a in m) { e.setAttribute(a, m[a]); delete m[a]; }
      }
    }
    if (docTitleLat === null) docTitleLat = document.title;
    document.title = cyr ? window.VestiCyr.toCyr(docTitleLat) : docTitleLat;
    document.documentElement.lang = cyr ? 'sr-Cyrl' : 'sr-Latn';
    if (cyr) scriptObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  bindSettings();
  load(false);
  applyScript();

  if (NATIVE) {
    // Android back button: close an open sheet first, otherwise send the app to the background
    const App = window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (App && App.addListener) {
      App.addListener('resume', refreshIfStale);
      App.addListener('backButton', () => {
        const open = document.querySelector('dialog[open]');
        if (open) open.close();
        else if (panelOpen) { panelOpen = false; syncPanel(); }
        else if (view === 'video') setView('news');
        else if (S.sources.length || S.cats.length || S.q) { S.sources = []; S.cats = []; S.q = ''; q.value = ''; changed(); }
        else if (window.scrollY > 50) window.scrollTo({ top: 0, behavior: 'smooth' });
        else if (App.minimizeApp) App.minimizeApp(); else App.exitApp();
      });
    }
  } else if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
