'use strict';
// "Najvažnije danas": no outlet publishes a most-read feed, so importance is estimated from
//   1. how many of the six outlets cover the same story (strongest signal),
//   2. how prominently each outlet places it (position in its own feed),
//   3. recency.
// Same story = headlines sharing several distinctive words.

const { tokens } = require('./text');

const STOP = new Set((
  'koji koja koje kojim kako nakon posle pred izmedju zbog gde kada sada jedan jedna jedno ovaj ovo tako nije ' +
  'biti bice rekao rekla rekli tvrdi kaze novi nova nove godine godina danas juce sutra vesti video foto uzivo ' +
  'sve svi sva ima imaju bila bilo bili sebe njegov njena njihov kroz preko iznad ispod protiv'
).split(' '));

function signature(title) {
  const out = new Set();
  for (const w of tokens(title).split(' ')) {
    if (w.length >= 4 && !STOP.has(w)) out.add(w.slice(0, 5)); // crude stem: "tuzilastvu" ~ "tuzilastvo"
  }
  return out;
}

function computeTop(items, { now = Date.now(), limit = 10, maxAgeH = 36 } = {}) {
  const cand = items.filter((i) => !i.ad && now - Date.parse(i.published) <= maxAgeH * 3600e3);
  const N = cand.length;
  if (!N) return [];

  const sigs = cand.map((i) => signature(i.title));
  // words that appear everywhere ("vucic", "srbij") say nothing about whether two headlines match
  const df = new Map();
  for (const s of sigs) for (const w of s) df.set(w, (df.get(w) || 0) + 1);
  const common = Math.max(6, Math.round(N * 0.05));
  const srcOf = new Map(); // word -> set of outlets using it
  sigs.forEach((s, i) => { for (const w of s) { if (!srcOf.has(w)) srcOf.set(w, new Set()); srcOf.get(w).add(cand[i].source); } });
  // a story word shows up about once or twice per outlet; "vucic"/"srbij" show up many times per outlet
  const ubiquitous = (w) => df.get(w) > common && df.get(w) / srcOf.get(w).size > 3;
  for (const s of sigs) for (const w of [...s]) if (ubiquitous(w)) s.delete(w);

  const parent = cand.map((_, i) => i);
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  for (let a = 0; a < N; a++) {
    if (sigs[a].size < 2) continue;
    for (let b = a + 1; b < N; b++) {
      if (cand[a].source === cand[b].source || sigs[b].size < 2) continue;
      if (Math.abs(Date.parse(cand[a].published) - Date.parse(cand[b].published)) > 24 * 3600e3) continue;
      let shared = 0;
      let sharedRare = 0; // a name or unusual word, not "evropa" / "razgovor"
      for (const w of sigs[a]) if (sigs[b].has(w)) { shared++; if (df.get(w) <= 6) sharedRare++; }
      // the shared words must make up a real share of the SHORTER headline, otherwise two long
      // headlines that merely both mention "Evropa ... nastavlja ... razgovor" get glued together
      const ratio = shared / Math.min(sigs[a].size, sigs[b].size);
      // topical gate: stories in different (non-"ostalo") categories need the strict rule; sport never merges with non-sport
      const sameTopic = cand[a].category === cand[b].category || cand[a].category === 'ostalo' || cand[b].category === 'ostalo';
      const sportClash = (cand[a].category === 'sport') !== (cand[b].category === 'sport') && !sameTopic;
      const strict = !sportClash && shared >= 3 && ratio >= 0.5;
      const loose = (shared >= 4 && ratio >= 0.4) || (shared >= 3 && sharedRare >= 1 && ratio >= 0.4) || (shared >= 2 && sharedRare >= 1 && ratio >= 0.5);
      if (sameTopic ? loose : strict) {
        parent[find(a)] = find(b);
      }
    }
  }

  const groups = new Map();
  cand.forEach((it, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r).push(it);
  });

  const clusters = [];
  for (const g of groups.values()) {
    const sources = [...new Set(g.map((i) => i.source))];
    const placement = Math.max(...g.map((i) => Math.max(0, 10 - (i.rank ?? 99)) / 2)); // 0..5
    const freshest = Math.max(...g.map((i) => Date.parse(i.published)));
    const ageH = (now - freshest) / 3600e3;
    const score = 10 * sources.length + placement + Math.max(0, 4 - ageH / 6);
    const sorted = [...g].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    const lead = sorted.find((i) => i.image) || sorted[0];
    clusters.push({
      lead: lead.id,
      ids: [lead.id, ...sorted.filter((i) => i.id !== lead.id).map((i) => i.id)],
      sources,
      outlets: sources.length,
      kind: sources.length > 1 ? 'multi' : 'single',
      placement,
      score: Math.round(score * 10) / 10,
    });
  }

  const multi = clusters.filter((c) => c.kind === 'multi').sort((a, b) => b.score - a.score);
  const single = clusters.filter((c) => c.kind === 'single' && c.placement >= 3).sort((a, b) => b.score - a.score);
  return [...multi, ...single].slice(0, limit);
}

module.exports = { computeTop, signature };
