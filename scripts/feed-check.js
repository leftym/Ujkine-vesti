'use strict';
// Runs the real engine against the six live feeds and writes a markdown report.
// Used by CI (GitHub's network can reach the outlets) so feed problems show up without a phone.
const fs = require('fs');
const { defaultFetchText } = require('../server');
const { getNews } = require('../lib/aggregate');

(async () => {
  const data = await getNews(defaultFetchText, { force: true });
  const L = [];
  L.push('# Feed check', '', 'Run: ' + new Date().toISOString(), '');
  L.push('| Outlet | OK | Items | Feed used | With image | Ads flagged |', '|---|---|---|---|---|---|');
  for (const s of data.sources) {
    const st = data.status.find((x) => x.id === s.id) || {};
    const items = data.items.filter((i) => i.source === s.id);
    const img = items.filter((i) => i.image).length;
    const ads = items.filter((i) => i.ad).length;
    L.push(`| ${s.name} | ${st.ok ? 'yes' : '**NO**'} | ${items.length} | ${st.feed || '-'} | ${img} | ${ads} |`);
  }
  L.push('');
  for (const s of data.sources) {
    const st = data.status.find((x) => x.id === s.id) || {};
    const items = data.items.filter((i) => i.source === s.id);
    L.push('## ' + s.name);
    if (!st.ok) L.push('FAILED: ' + st.error, 'Tried: ' + (st.tried || []).join(' | '));
    const cats = {};
    for (const i of items) cats[i.category] = (cats[i.category] || 0) + 1;
    L.push('Categories: ' + JSON.stringify(cats));
    for (const i of items.slice(0, 6)) L.push(`- [${i.category}${i.ad ? ' / AD:' + i.ad : ''}] ${i.title}`);
    for (const i of items.filter((x) => x.ad).slice(0, 5)) L.push(`  - flagged (${i.ad}): ${i.title} ${i.url}`);
    const other = items.filter((i) => i.category === 'ostalo').slice(0, 8);
    if (other.length) {
      L.push('', 'Uncategorized sample (for tuning):');
      for (const i of other) L.push(`- ${i.title} | ${i.url} | tags: ${JSON.stringify(i.tags)}`);
    }
    if (st.ok && st.feed && items.length && items.filter((i) => i.image).length === 0) {
      try {
        const xml = await defaultFetchText(st.feed);
        const m = xml.match(/<item\b[\s\S]*?<\/item>/i);
        L.push('', 'No images found. First raw item:', '```xml', (m ? m[0] : xml).slice(0, 2500), '```');
      } catch (e) { L.push('raw fetch failed: ' + e.message); }
    }
    L.push('');
  }
  fs.writeFileSync(process.argv[2] || 'feed-check.md', L.join('\n'));
  console.log(L.slice(0, 12).join('\n'));
})().catch((e) => { fs.writeFileSync(process.argv[2] || 'feed-check.md', '# Feed check crashed\n\n' + e.stack); console.error(e); process.exit(1); });
