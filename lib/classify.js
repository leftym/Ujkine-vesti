'use strict';
// Category tagging + ad/sponsored detection. All matching is done on folded text
// (lowercase, Latin, no diacritics) so Cyrillic and Latin Serbian behave the same.

const { fold, tokens } = require('./text');

const CATEGORIES = [
  { id: 'politika', label: 'Politika' },
  { id: 'drustvo', label: 'Društvo' },
  { id: 'hronika', label: 'Hronika' },
  { id: 'ekonomija', label: 'Ekonomija' },
  { id: 'svet', label: 'Svet' },
  { id: 'region', label: 'Region' },
  { id: 'sport', label: 'Sport' },
  { id: 'kultura', label: 'Kultura' },
  { id: 'zabava', label: 'Zabava' },
  { id: 'tehnologija', label: 'Tehnologija' },
  { id: 'zdravlje', label: 'Zdravlje' },
  { id: 'zivot', label: 'Život' },
  { id: 'ostalo', label: 'Ostalo' },
];

// Section / tag names (folded tokens) that clearly identify a category
const STRONG = {};
const add = (cat, names) => names.split(',').forEach((n) => { STRONG[n.trim()] = cat; });
add('politika', 'politika,izbori,vlada,skupstina');
add('drustvo', 'pogledi,drustvo,obrazovanje,edukacija,studenti,protesti');
add('hronika', 'hronika,crna hronika,kriminal,crna hronika srbija,saobracaj');
add('ekonomija', 'biz,ekonomija,privreda,biznis,finansije,novac,berza,ekonomija i biznis,nekretnine');
add('svet', 'svet,planeta,svetske vesti,world,ukrajina,bliski istok');
add('region', 'region,balkan,regija,ex yu,hrvatska,bosna i hercegovina,crna gora,republika srpska');
add('sport', 'esports,sport,fudbal,kosarka,tenis,odbojka,rukomet,vaterpolo,formula 1,ostali sportovi,atletika,mma,nba,kvota');
add('kultura', 'kultura,film,knjige,knjizevnost,pozoriste,muzika,izlozbe,umetnost');
add('zabava', 'zivoti poznatih,zabava,showbiz,estrada,stars,zvezde,rijaliti,tv,tv sou,pop kultura,celebrity,scena');
add('tehnologija', 'tehnopolis,tehnologija,tech,nauka,internet,mobilni,igre,techvision,nauka i tehnologija,it');
add('zdravlje', 'zdravlje,medicina,zdravlje i lepota,ishrana,fitnes');
add('zivot', 'astro,ljubav i strast,veze i odnosi,slobodno vreme,sudbine,zivot,lifestyle,magazin,moda,putovanja,auto,automobili,horoskop,recepti,ljubav i seks,porodica,lepota,vremenska prognoza,vreme');

// Generic section names: only used if nothing better is found
const WEAK = {
  srbija: 'drustvo', beograd: 'drustvo', vojvodina: 'drustvo', 'novi sad': 'drustvo',
  'dijaspora': 'drustvo', vesti: null, info: null, najnovije: null, 'najnovije vesti': null,
};

// Keyword stems (folded) for title/summary fallback. A stem matches at a word start.
const KEYWORDS = {
  politika: ['vucic', 'skupstin', 'izbor', 'opozicij', 'ministar', 'vlad(?!imir|ik|avin)', 'sns', 'napredn', 'predsednik', 'poslanik', 'koalicij', 'premijer', 'ministarstv', 'stranka', 'stranke', 'lista', 'gradonacelnik', 'pravosudj', 'vojsk', 'dacic', 'sankcij', 'brnabic', 'parlament', 'zakon'],
  drustvo: ['student', 'djak', 'profesor', 'gimnazij', 'roditelj', 'protest', 'skol', 'univerzitet', 'penzij', 'blokad', 'prosvet', 'nastavnik', 'gradjan', 'opstin', 'crkv', 'patrijarh'],
  hronika: ['uhapsen', 'hapsenj', 'pritvor', 'nestao', 'potrag', 'ubijen', 'ubistv', 'policij', 'nesrec', 'pozar', 'saobracajn', 'krivicn', 'tuzilastv', 'osudjen', 'nasilj', 'pljack', 'optuzn', 'sudjenj', 'presud', 'poginu', 'povredjen', 'zemljotres', 'oluj', 'nevrem', 'poplav', 'pucnjav', 'ranjen', 'droga', 'kradj', 'lopov', 'udes'],
  ekonomija: ['inflacij', 'kurs(?!k| engl)', 'evro(?!p|lig|basket|vizij|kup)', 'dinar', 'banka', 'bank', 'kredit', 'cene', 'privred', 'izvoz', 'uvoz', 'bdp', 'berza', 'investicij', 'porez', 'nbs', 'gorivo', 'kompanij'],
  svet: ['amerik', 'vasington', 'tramp', 'putin', 'ukrajin', 'rusij', 'kina', 'kine', 'evropska unij', 'nato', 'izrael', 'gaz(?!d)', 'nemack', 'francusk', 'london', 'brisel', 'bela kuca', 'iran', 'merc', 'norve', 'oslo', 'italij', 'spanij', 'britan', 'japan', 'turs', 'sojgu', 'peking', 'hamas', 'bajden', 'tajvan', 'severn\\w* korej', 'indij', 'moskv', 'kijev', 'odes', 'netanjahu', 'dzinping', 'evropsk\\w* (komisij|parlament)', 'grcka', 'poljsk', 'madjarsk', 'meloni', 'makron', 'zelenski'],
  region: ['hrvatsk', 'bosn', 'crna gora', 'crnogor', 'sarajev', 'zagreb', 'podgoric', 'skopl', 'kosov', 'pristin', 'republika srpska', 'makedonij', 'sloven', 'albanij'],
  sport: ['fudbal', 'kosark', 'tenis', 'utakmic', 'crvena zvezda', 'partizan', 'djokovic', 'liga', 'nba', 'uefa', 'fifa', 'golman', 'trener', 'reprezentacij', 'olimp', 'atp', 'rukomet', 'odbojk', 'vaterpol', 'formula', 'turnir', 'jokic', 'evrolig'],
  kultura: ['film', 'pozoris', 'knjig', 'festival', 'izlozb', 'muzej', 'pisac', 'roman', 'bioskop', 'premijera'],
  zabava: ['pevac', 'pevacic', 'estrad', 'rijaliti', 'zadruga', 'glumic', 'glumac', 'serij', 'holivud', 'vencanj', 'razvod', 'instagram', 'spot', 'album', 'evrovizij'],
  tehnologija: ['iphone', 'android', 'google', 'apple', 'microsoft', 'vestacka inteligencij', 'aplikacij', 'softver', 'telefon', 'procesor', 'tesla', 'kompjuter', 'samsung', 'nvidia'],
  zdravlje: ['bolest', 'lekar', 'bolnic', 'virus', 'grip', 'vakcin', 'terapij', 'simptom', 'dijabet', 'kancer', 'zdrav', 'doktor', 'klinick'],
  zivot: ['recept', 'horoskop', 'putovanj', 'moda', 'vremenska prognoza', 'automobil', 'odmor', 'dekor'],
};

const KW_RES = {};
for (const [cat, list] of Object.entries(KEYWORDS)) {
  KW_RES[cat] = list.map((k) => new RegExp('(^| )' + k.replace(/ /g, ' ')));
}

function pathSegments(url) {
  try {
    return new URL(url).pathname.split('/').filter((s) => s && !/^\d+$/.test(s)).slice(0, 6).map(tokens);
  } catch {
    return [];
  }
}

function classify({ url, categories = [], title = '', summary = '' }) {
  // 1) URL path or feed tags that clearly name a section
  const segs = pathSegments(url);
  const tags = categories.map(tokens);
  for (const t of [...segs, ...tags]) {
    if (STRONG[t]) return STRONG[t];
  }
  // 2) keyword scoring (title counts double)
  const t = tokens(title);
  const s = tokens(summary + ' ' + categories.join(' ')).slice(0, 500);
  let best = null;
  let bestScore = 0;
  for (const [cat, res] of Object.entries(KW_RES)) {
    let score = 0;
    for (const re of res) {
      if (re.test(t)) score += 2;
      if (re.test(s)) score += 1;
    }
    if (score > bestScore) { best = cat; bestScore = score; }
  }
  if (best && bestScore >= 2) return best;
  // 3) generic section names
  for (const t2 of [...segs, ...tags]) {
    if (WEAK[t2]) return WEAK[t2];
  }
  return 'ostalo';
}

// ---- ad / sponsored detection ------------------------------------------------

const AD_URL = /\/(promo|oglas|oglasi|advertorial|sponzor\w*|sponsored|partner\w*|reklama|pr-tekst|brand-content)(\/|$)/;
const AD_TAG = /^(sponzorisano|sponzorisani|sponzorisani sadrzaj|sponsored|promo|promocija|oglas|reklama|advertorial|pr|pr tekst|pr clanak|partnerski sadrzaj|placeni sadrzaj|komercijalni sadrzaj)$/;
const AD_TITLE = [
  /^(promo|oglas|reklama|sponzorisano|advertorial)\b/,
  /\b(sponzorisan\w*|advertorial|placeni (tekst|sadrzaj)|u saradnji sa (partnerom|kompanijom|brendom)|partnerski (tekst|sadrzaj))\b/,
  /\b(promo kod|promotivn\w+ (ponud|cen)\w*|kupon\w* (za|uz) (popust|kupovin\w*)|black friday|samo danas|akcijski popust\w*)\b/,
  /\bpopust\w*\b.*\d+ ?%|\d+ ?% .*\bpopust\w*/,
];
// A discount headline is news when it is about the state, bills, pensions...
const NEWS_DISCOUNT = /\b(vlad\w*|drzav\w*|ministar\w*|struj\w*|racun\w*|penzion\w*|sindikat\w*|gradon\w*|opstin\w*|kazn\w*)\b/;

const SELF_PROMO = [
  /^gledajte (emisij\w*|program\w*|ceo program)\b/, /^(pratite|uzivo)\b.*\b(program|emisij\w*)\b/,
  /\bpretplat\w+ (na|za) (nas|n1|nova|novin\w*|list|portal|sajt)\b|\bpostanite pretplatnik/, /\bkupite\b.*\bnovin\w*/, /\bpreuzmite (nasu )?aplikacij\w*/,
  /\bprijavite se na (nas )?(njuzleter|newsletter)/, /\bpodrzite (nas|n1|nova)\b/,
];
// "kladionica", "betting" are unambiguous. "kvote"/"tiket" also mean political quotas / concert tickets,
// so they only count in a sport/betting context.
const BETTING_STRONG = [/\b(betting|bonus\w* (dobrodoslic\w*|za registraciju)|maxbet|mozzart|bet365|soccerbet|admiral bet)\b/];
// "kladionica" is also the subject of real crime / law news ("policija zatvorila kladionicu")
const BETTING_WORD = /\b(kladionic\w*|kladjenj\w*)\b/;
const BETTING_NEWS_CTX = /\b(policij\w*|uhapsen\w*|tuzilast\w*|tuzilac|sud\w*|zatvor\w*|namestan\w*|zakon\w*|inspekcij\w*|kazn\w*|pljack\w*|ilegaln\w*|istrag\w*)\b/;
// "kvote"/"tiket" also mean political quotas / concert tickets: they count only next to real betting words
const BETTING_WEAK = [/\b(kvot\w*|tiket\w*)\b/];
const BETTING_CO = /\b(ulog\w*|uloz\w*|dobitn\w*|kladi\w*|favorit\w*|kombinacij\w*|ishod\w*|pobedu|tip(ovi|ster\w*)?)\b/;
const SPORT_CTX_URL = /(^|\/)(sport|kvota|kvote|kladjenje|kladionice)(\/|$|-)/;

// returns null, or one of: 'sponsored' | 'promo' | 'self' | 'betting'
function detectAd({ url = '', title = '', categories = [] }) {
  const u = fold(url).replace(/\?.*$/, '');
  const t = fold(title);
  const tags = categories.map(tokens);
  if (/\/najave-emisija\//.test(u)) return 'self';
  if (AD_URL.test(u) || tags.some((x) => AD_TAG.test(x))) return 'sponsored';
  if (AD_TITLE[0].test(t) || AD_TITLE[1].test(t)) return 'sponsored';
  if (AD_TITLE[2].test(t) || (AD_TITLE[3].test(t) && !NEWS_DISCOUNT.test(t))) return 'promo';
  if (SELF_PROMO.some((re) => re.test(t))) return 'self';
  if (tags.some((x) => x === 'kvota' || x === 'kladjenje' || x === 'kladionice')) return 'betting';
  if (BETTING_STRONG.some((re) => re.test(t))) return 'betting';
  if (BETTING_WORD.test(t) && !BETTING_NEWS_CTX.test(t)) return 'betting';
  if (BETTING_WEAK.some((re) => re.test(t)) && (BETTING_CO.test(t) || SPORT_CTX_URL.test(u))) return 'betting';
  return null;
}

module.exports = { classify, detectAd, CATEGORIES };
