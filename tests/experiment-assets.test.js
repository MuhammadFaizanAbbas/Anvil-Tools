const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const fs = require('node:fs');
const router = require('../backend/src/routes/experiment-assets');
let server, base;
before(async () => { server = express().use(router).listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); base = `http://127.0.0.1:${server.address().port}`; });
after(() => new Promise(resolve => server.close(resolve)));
test('public experiment fixtures serve complete observed cases and actual screenshots', async () => {
  for (const [group, count] of [['url-encoding', 15], ['sha256', 13]]) {
    const cases = await fetch(`${base}/experiment-assets/${group}/cases.json`);
    assert.equal(cases.status, 200); assert.match(cases.headers.get('content-type'), /application\/json/); assert.equal((await cases.json()).length, count);
    const response = await fetch(`${base}/experiment-assets/${group}/results.json`);
    assert.equal(response.status, 200);
    const results = await response.json(); assert.ok(results.runs.length >= 1);
    for (const run of results.runs) { assert.equal(run.cases.length, count); assert.ok(run.cases.every(item => item.passed)); }
    const image = await fetch(`${base}/experiment-assets/${group}/tool-run.png`);
    assert.equal(image.status, 200); assert.match(image.headers.get('content-type'), /image\/png/);
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), fs.readFileSync(`backend/assets/experiments/${group}/tool-run.png`));
  }
});
test('experiment asset route rejects unknown paths and private or traversal filenames', async () => {
  for (const url of ['/experiment-assets/private/cases.json', '/experiment-assets/sha256/.env', '/experiment-assets/sha256/index.html', '/experiment-assets/sha256/%2e%2e%2f%2e%2e%2fpackage.json', '/experiment-assets/sha256/unknown.json']) assert.equal((await fetch(base + url)).status, 404, url);
});
