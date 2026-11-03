'use strict';
// Which small logo/icon does each outlet publish? Run in CI (GitHub's network reaches the outlets).
const fs = require('fs');
const { SOURCES } = require('../lib/sources');
const { defaultFetchText } = require('../server');
const UA = 'Mozilla/5.0 (Linux; Android 14; SM-S921B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36';

const L = ['# Outlet icons', '', 'Run: ' + new Date().toISOString(), ''];

async function getBin(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: 'image/*,*/*;q=0.5' }, redirect: 'follow', signal: AbortSignal.timeout(9000) });
  const buf = Buffer.from(await r.arrayBuffer());
  return { status: r.status, type: r.headers.get('content-type') || '', bytes: buf.length, buf, final: r.url };
}

function dims(buf, type) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) return buf.readUInt32BE(16) + 'x' + buf.readUInt32BE(20); // PNG
  if (buf.length > 6 && buf.readUInt16LE(0) === 0 && buf.readUInt16LE(2) === 1) {                                     // ICO
    const n = buf.readUInt16LE(4), sizes = [];
    for (let i = 0; i < n && 6 + i * 16 + 2 <= buf.length; i++) sizes.push((buf[6 + i * 16] || 256) + 'x' + (buf[7 + i * 16] || 256));
    return 'ico[' + sizes.join(',') + ']';
  }
  if (/svg/.test(type) || buf.slice(0, 200).toString().includes('<svg')) return 'svg';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpeg';
  return '?';
}

(async () => {
  for (const s of SOURCES) {
    L.push('## ' + s.name + '  (' + s.home + ')');
    let html = '';
    try { html = await defaultFetchText(s.home); } catch (e) { L.push('homepage failed: ' + (e.code || e.message), ''); }
    const cands = new Map();
    for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
      const tag = m[0];
      const rel = (tag.match(/\brel=["']([^"']+)["']/i) || [])[1] || '';
      if (!/icon/i.test(rel)) continue;
      const href = (tag.match(/\bhref=["']([^"']+)["']/i) || [])[1];
      if (!href) continue;
      try { cands.set(new URL(href.replace(/&amp;/g, '&'), s.home).href, rel + ' sizes=' + ((tag.match(/\bsizes=["']([^"']+)["']/i) || [])[1] || '-')); } catch { /* skip */ }
    }
    for (const p of ['/apple-touch-icon.png', '/favicon.ico', '/favicon.png']) { try { cands.set(new URL(p, s.home).href, 'guess ' + p); } catch { /* skip */ } }
    for (const [url, note] of cands) {
      try {
        const r = await getBin(url);
        const ok = r.status === 200 && /image|icon|octet/.test(r.type + '');
        L.push(`- ${ok ? 'OK ' : 'bad'} ${r.status} ${r.type.split(';')[0]} ${r.bytes}B ${ok ? dims(r.buf, r.type) : ''} | ${note} | ${url}`);
      } catch (e) { L.push(`- bad ERR ${e.message} | ${note} | ${url}`); }
    }
    L.push('');
  }
  fs.writeFileSync(process.argv[2] || 'icons.md', L.join('\n'));
  console.log(L.slice(0, 12).join('\n'));
})().catch((e) => { fs.writeFileSync(process.argv[2] || 'icons.md', L.join('\n') + '\nCRASH ' + e.stack); process.exit(1); });
