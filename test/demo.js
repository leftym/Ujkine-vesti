'use strict';
// Run the full UI against the sample feeds (no internet needed): node test/demo.js
const { createServer } = require('../server');
const { fetchText } = require('./mock');
const port = Number(process.env.PORT || 8099);
createServer({ fetchText }).listen(port, '127.0.0.1', () => console.log('demo on http://127.0.0.1:' + port));
