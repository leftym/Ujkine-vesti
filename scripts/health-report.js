'use strict';
// Daily health report for the review agent. Runs the real engine on the live feeds, applies
// rule-based checks and writes a markdown report with prioritized recommendations.
// The Claude subagent in .claude/agents/vesti-reviewer.md reads this and turns it into advice.
const fs = require('fs');
const { defaultFetchText } = require('../server');
const { getNews } = require('../lib/aggregate');
const { SOURCES } = require('../lib/sources');
const { tokens } = require('../lib/text');

const SOFT_PROMO = /\b(popust\w*|akcij[ae]|kupite|kupujte|ponuda|ponude|gratis|osvojite|nagradn\w*|rasprodaj\w*|jeftin\w*|povoljn\w*|besplatn\w*|promo\w*|sponzor\w*)\b/i;
const STOPWORDS = new Set('koji koja koje kako nakon posle zbog gde kada sada jedan jedna novi nova nove godine danas juce'.split(' '));

(async () => {
  const now = Date.now();
  const data = await getNews(defaultFetchText, { force: true });
  const recs = []; // {sev, outlet, text}
  const add = (sev, outlet, text) => recs.push({ sev, outlet, text });
  const rows = [];
  const details = [];

  for (const s of SOURCES) {
    const st = data.status.find((x) => x.id === s.id) || {};
    const items = data.items.filter((i) => i.source === s.id);
    const n = items.length;
    const newest = n ? Math.max(...items.map((i) => Date.parse(i.published))) : 0;
    const ageH = n ? (now - newest) / 3600e3 : null;
    const img = n ? Math.round((100 * items.filter((i) => i.image).length) / n) : 0;
    const other = items.filter((i) => i.category === 'ostalo');
    const otherPct = n ? Math.round((100 * other.length) / n) : 0;
    const ads = items.filter((i) => i.ad);
    const cats = {};
    for (const i of items) cats[i.category] = (cats[i.category] || 0) + 1;

    rows.push(`| ${s.name} | ${st.ok ? 'yes' : '**NO**'} | ${n} | ${ageH == null ? '-' : ageH.toFixed(1) + 'h'} | ${img}% | ${otherPct}% | ${ads.length} |`);

    if (!st.ok) add('HIGH', s.name, `No working feed. Tried: ${(st.tried || []).join(' | ')}. Find the current RSS URL (page source: link rel=alternate) and put it first in lib/sources.js.`);
    else {
      if (st.feed !== s.feeds[0]) add('LOW', s.name, `Primary feed URL is dead; fallback ${st.feed} is working. Make it the first entry in lib/sources.js so startup is faster.`);
      if (n < 10) add('MED', s.name, `Only ${n} items in the feed; the outlet may have changed or truncated its feed.`);
      if (ageH > 8) add('MED', s.name, `Newest story is ${ageH.toFixed(1)}h old: feed may be stale or cached by the outlet.`);
      if (img < 80) add('LOW', s.name, `Only ${img}% of items have an image. Check the raw feed for a non-standard image tag (as with RTS <thumb>).`);
    }

    if (otherPct > 25 && other.length >= 4) {
      const freq = new Map();
      for (const i of other) for (const w of new Set(tokens(i.title).split(' '))) if (w.length >= 5 && !STOPWORDS.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
      const top = [...freq].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w, c]) => `${w}(${c})`).join(', ');
      add('MED', s.name, `${otherPct}% of stories are uncategorized ("Ostalo"). Common words in them: ${top}. Add section names / keyword stems in lib/classify.js.`);
    }
    const biggest = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
    if (biggest && n >= 15 && biggest[1] / n > 0.45 && biggest[0] !== 'ostalo') add('LOW', s.name, `${Math.round((100 * biggest[1]) / n)}% of stories landed in "${biggest[0]}": check the classifier is not over-matching.`);
    if (n >= 15 && ads.length / n > 0.12) add('MED', s.name, `${ads.length} of ${n} stories flagged as ads/promos (${Math.round((100 * ads.length) / n)}%). Likely false positives: review the list below.`);

    const missed = items.filter((i) => !i.ad && SOFT_PROMO.test(i.title)).slice(0, 5);
    if (missed.length) add('LOW', s.name, `Possible ads NOT flagged: ${missed.map((i) => `"${i.title}"`).join('; ')}`);

    details.push(`### ${s.name}`, `Categories: ${JSON.stringify(cats)}`);
    if (ads.length) { details.push('Flagged:'); for (const i of ads.slice(0, 8)) details.push(`- (${i.ad}) ${i.title} <${i.url}>`); }
    if (other.length) { details.push('Uncategorized sample:'); for (const i of other.slice(0, 6)) details.push(`- ${i.title} <${i.url}> tags=${JSON.stringify(i.tags)}`); }
    details.push('');
  }

  // front-page ranking sanity
  const byId = new Map(data.items.map((i) => [i.id, i]));
  const top = data.top || [];
  const multi = top.filter((c) => c.kind === 'multi');
  if (!multi.length) add('MED', 'Front page', 'No story matched across outlets today. Either the news day is fragmented or the headline matching in lib/top.js is too strict.');
  if (multi.length > 7) add('LOW', 'Front page', `${multi.length} multi-outlet clusters: confirm they are real matches, not over-merged (see list).`);

  const order = { HIGH: 0, MED: 1, LOW: 2 };
  recs.sort((a, b) => order[a.sev] - order[b.sev]);

  const L = [];
  L.push('# Vesti health report', '', `Run: ${new Date(now).toISOString()}  |  items: ${data.items.length}  |  front-page clusters: ${top.length} (${multi.length} multi-outlet)`, '');
  L.push('## Recommendations (priority order)');
  if (!recs.length) L.push('- All checks passed. Nothing to do.');
  recs.forEach((r, i) => L.push(`${i + 1}. **${r.sev}** [${r.outlet}] ${r.text}`));
  L.push('', '## Outlet table', '| Outlet | OK | Items | Newest | Images | Ostalo | Ads |', '|---|---|---|---|---|---|---|', ...rows, '');
  L.push('## Front page right now');
  top.forEach((c, i) => {
    const lead = byId.get(c.lead);
    L.push(`${i + 1}. [${c.kind}, ${c.outlets} outlets, score ${c.score}] ${lead ? lead.title : c.lead}`);
    if (c.kind === 'multi') for (const id of c.ids.slice(1)) { const it = byId.get(id); if (it) L.push(`   - also (${it.source}): ${it.title}`); }
  });
  L.push('', '## Details', ...details);

  fs.writeFileSync(process.argv[2] || 'health.md', L.join('\n'));
  console.log(L.slice(0, 14).join('\n'));
})().catch((e) => { fs.writeFileSync(process.argv[2] || 'health.md', '# Health report crashed\n\n' + e.stack); console.error(e); process.exit(1); });
