// Latin -> Cyrillic for Serbian. Used by the app's "Ćirilica" setting; also loaded by the tests.
(function (root) {
  'use strict';
  var MAP = { a: 'а', b: 'б', c: 'ц', 'č': 'ч', 'ć': 'ћ', d: 'д', 'đ': 'ђ', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', 'š': 'ш', t: 'т', u: 'у', v: 'в', z: 'з', 'ž': 'ж' };
  var WORD = /[A-Za-zČĆŠŽĐčćšžđ]+/;

  // foreign brand names that look wrong in Cyrillic ("Гоогле"); everything else is converted
  var KEEP = /^(google|facebook|microsoft|apple|amazon|twitter|tiktok|whatsapp|netflix|youtube|instagram|linkedin|spotify|uber)$/i;
  // words where "nj" / "dž" are two separate letters, not one: injekcija, nadživeti, podžupanija
  function twoLetter(w, i) {
    var lo = w.toLowerCase();
    if (lo[i] === 'n' && lo[i + 1] === 'j') return /^inj/.test(lo) && i === 1;
    if (lo[i] === 'd' && lo[i + 1] === 'ž') return /^(nad|pod|od|sad)ž/.test(lo) && i === lo.indexOf('dž');
    return false;
  }

  function word(w) {
    if (KEEP.test(w)) return w;
    if (/[qwxyQWXY]/.test(w)) return w;                 // foreign word (Twitter, Maxwell)
    if (/[a-zčćšžđ][A-ZČĆŠŽĐ]/.test(w)) return w;      // brand written in camel case: YouTube, iPhone
    var out = '';
    for (var i = 0; i < w.length; i++) {
      var ch = w[i], lo = ch.toLowerCase(), nx = (w[i + 1] || '').toLowerCase(), cyr, skip = 0;
      if (lo === 'l' && nx === 'j') { cyr = 'љ'; skip = 1; }
      else if (lo === 'n' && nx === 'j' && !twoLetter(w, i)) { cyr = 'њ'; skip = 1; }
      else if (lo === 'd' && nx === 'ž' && !twoLetter(w, i)) { cyr = 'џ'; skip = 1; }
      else cyr = MAP[lo];
      if (!cyr) { out += ch; continue; }
      i += skip;
      out += ch !== lo ? cyr.toUpperCase() : cyr;
    }
    return out;
  }

  // Web addresses such as "Nova.rs" or "n1info.rs/feed" stay as they are
  var TOKEN = /([A-Za-z0-9-]+\.(?:rs|com|net|org|info|tv|me|eu)\b[^\s]*)|([A-Za-zČĆŠŽĐčćšžđ]+)/g;
  function toCyr(s) {
    return String(s).replace(/Nova\.rs\b/g, 'Нова.рс').replace(TOKEN, function (m, dom, w) { return dom ? dom : word(w); });
  }

  // For searching: Cyrillic letters -> the same folded Latin the app uses for matching (no diacritics)
  var FOLD = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'ђ': 'dj', 'е': 'e', 'ж': 'z', 'з': 'z', 'и': 'i', 'ј': 'j', 'к': 'k', 'л': 'l', 'љ': 'lj', 'м': 'm', 'н': 'n', 'њ': 'nj', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'ћ': 'c', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'c', 'џ': 'dz', 'ш': 's' };
  function cyrToFold(s) {
    return String(s).replace(/[Ѐ-ӿ]/g, function (c) { return FOLD[c.toLowerCase()] || c; });
  }

  var api = { toCyr: toCyr, cyrToFold: cyrToFold };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VestiCyr = api;
})(typeof window !== 'undefined' ? window : this);
