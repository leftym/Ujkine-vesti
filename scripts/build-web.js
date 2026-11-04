'use strict';
// Builds www/ for the Android app: copies public/, bundles the on-device engine.
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'public'), out, { recursive: true });
fs.rmSync(path.join(out, 'sw.js'), { force: true }); // service worker is for the browser version only

esbuild.buildSync({
  entryPoints: [path.join(root, 'app', 'engine.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  target: 'es2019',
  outfile: path.join(out, 'engine.js'),
  logLevel: 'info',
});

const htmlPath = path.join(out, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('<script src="/app.js"></script>')) throw new Error('index.html script tag not found');
// STORE_BUILD=1 builds the Play Store variant: no outlet logos (trademarks). The family APK keeps them.
fs.writeFileSync(path.join(out, 'build.js'), 'window.VESTI_STORE=' + (process.env.STORE_BUILD === '1') + ';');
html = html.replace('<script src="/app.js"></script>', '<script src="/build.js"></script>\n<script src="/engine.js"></script>\n<script src="/app.js"></script>');
fs.writeFileSync(htmlPath, html);
console.log('www/ ready');
