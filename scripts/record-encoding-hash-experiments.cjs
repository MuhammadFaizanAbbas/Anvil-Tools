// Record real browser controls and independently compare SHA-256 with Node crypto.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const express = require('express');
const { securityHeadersForPath } = require('../backend/src/lib/public-security');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('../deployment/browser-check/node_modules/playwright'); }
const directory = 'backend/assets/experiments';
for (const group of ['url-encoding', 'sha256']) fs.mkdirSync(`${directory}/${group}`, { recursive: true });
const urlCases = [
  ['space-plus-unicode', 'component', 'encode', 'red shoes + café', 'red%20shoes%20%2B%20caf%C3%A9'],
  ['decode-literal-plus', 'component', 'decode', 'a+b%20c', 'a+b c'],
  ['decode-encoded-plus', 'component', 'decode', 'a%2Bb%20c', 'a+b c'],
  ['encode-percent-again', 'component', 'encode', '%20', '%2520'],
  ['decode-once', 'component', 'decode', '%2520', '%20'],
  ['path-segment', 'component', 'encode', 'reports/2026 #1', 'reports%2F2026%20%231'],
  ['full-url', 'url', 'encode', 'https://example.com/search?q=red shoes&tag=a+b#section 1', 'https://example.com/search?q=red%20shoes&tag=a+b#section%201'],
  ['value-reserved', 'component', 'encode', 'tea & coffee=2', 'tea%20%26%20coffee%3D2'],
  ['full-url-ampersand-trap', 'url', 'encode', 'https://example.com/search?q=tea & coffee', 'https://example.com/search?q=tea%20&%20coffee'],
  ['decode-reserved-component', 'component', 'decode', '%2F%3F%26%3D%23', '/?&=#'],
  ['decode-reserved-full-url', 'url', 'decode', '%2F%3F%26%3D%23', '%2F%3F%26%3D%23'],
  ['punctuation', 'component', 'encode', "!~*'()", "!~*'()"],
  ['malformed-percent', 'component', 'decode', '%ZZ', null],
  ['incomplete-utf8', 'component', 'decode', '%C3', null],
  ['unicode-emoji', 'component', 'encode', '你好 🙂', '%E4%BD%A0%E5%A5%BD%20%F0%9F%99%82']
].map(([id, mode, action, input, expected]) => ({ id, mode, action, input, expected }));
const hashCases = [
  ['empty', ''], ['abc', 'abc'], ['trailing-lf', 'abc\n'], ['trailing-space', 'abc '],
  ['requested-crlf', 'abc\r\n', 'abc\n'], ['composed-accent', 'café'], ['decomposed-accent', 'cafe\u0301'],
  ['nfc-prepared', 'café'], ['json-compact', '{"id":"001","active":true}'],
  ['json-pretty', '{\n  "id": "001",\n  "active": true\n}'],
  ['json-key-order', '{"active":true,"id":"001"}'], ['ordinary-space', 'a b'], ['nonbreaking-space', 'a\u00a0b']
].map(([id, input, expectedBrowserInput = input]) => ({ id, input, expectedBrowserInput,
  expectedHex: createHash('sha256').update(expectedBrowserInput, 'utf8').digest('hex'),
  expectedBase64: createHash('sha256').update(expectedBrowserInput, 'utf8').digest('base64'),
  expectedUtf8Bytes: Buffer.byteLength(expectedBrowserInput, 'utf8') }));
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
write(`${directory}/url-encoding/cases.json`, urlCases); write(`${directory}/sha256/cases.json`, hashCases);
const report = { checkedAt: new Date().toISOString(), timezone: 'Asia/Karachi', method: 'Actual Anvil browser controls; synthetic inputs; independent Node crypto digest comparison.', runs: [] };
let server, browser;
(async () => {
  const app = express(); app.use((req, res, next) => { res.set(securityHeadersForPath(req.path)); next(); });
  app.get('/api/public/recommendations', (req, res) => res.json([])); app.use(express.static('frontend'));
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const live = process.argv.find(value => /^https?:\/\//.test(value));
  const executables = [process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(file => fs.existsSync(file));
  assert.ok(executables.length, 'Provide CHROME_PATH for an installed Chromium browser.');
  for (const executablePath of executables) {
    browser = await playwright.chromium.launch({ executablePath, headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const run = { browser: path.basename(executablePath), version: browser.version(), origin: live || origin, urlEncoding: [], sha256: [] };
    await page.goto(`${live || origin}/tools/url-encoder-decoder.html`, { waitUntil: 'domcontentloaded' });
    for (const item of urlCases) {
      await page.selectOption('#url-mode', item.mode); await page.fill('#url-input', item.input);
      // Seed a successful result to verify a failure clears previous output.
      if (item.expected === null) { await page.fill('#url-input', 'valid'); await page.click('#url-encode'); await page.fill('#url-input', item.input); }
      await page.click(`#url-${item.action}`);
      const output = await page.locator('#url-output').textContent(), status = await page.locator('#url-status').textContent();
      if (item.expected === null) { assert.equal(output, ''); assert.equal(status, 'This value contains malformed percent encoding or invalid UTF-8.'); }
      else { assert.equal(output, item.expected, item.id); assert.match(status, /successfully/); }
      run.urlEncoding.push({ ...item, output, status, passed: true });
    }
    run.queryParsing = await page.evaluate(() => {
      const params = new URLSearchParams(); params.set('q', 'red shoes + café');
      const bad = new URL('https://example.com/search?q=tea%20&%20coffee');
      return { formPlus: new URLSearchParams('q=a+b%20c').get('q'), encodedPlus: new URLSearchParams('q=a%2Bb%20c').get('q'), serialized: params.toString(), parsedSerialized: new URLSearchParams(params.toString()).get('q'), extraParameters: [...bad.searchParams] };
    });
    assert.equal(run.queryParsing.formPlus, 'a b c'); assert.equal(run.queryParsing.encodedPlus, 'a+b c');
    assert.equal(run.queryParsing.serialized, 'q=red+shoes+%2B+caf%C3%A9'); assert.equal(run.queryParsing.parsedSerialized, 'red shoes + café');
    assert.deepEqual(run.queryParsing.extraParameters, [['q', 'tea '], [' coffee', '']]);
    if (report.runs.length === 0) {
      await page.selectOption('#url-mode', 'component'); await page.fill('#url-input', 'red shoes + café'); await page.click('#url-encode');
      await page.locator('.tool-app').screenshot({ path: `${directory}/url-encoding/tool-run.png` });
    }
    await page.goto(`${live || origin}/tools/hash-generator.html`, { waitUntil: 'domcontentloaded' });
    await page.selectOption('#hash-algorithm', 'SHA-256');
    for (const item of hashCases) {
      await page.fill('#hash-input', item.input);
      await page.evaluate(() => { document.getElementById('hash-hex').textContent = ''; document.getElementById('hash-status').textContent = ''; });
      await page.click('#hash-generate'); await page.waitForFunction(() => document.getElementById('hash-hex').textContent.length === 64);
      const actualInput = await page.locator('#hash-input').inputValue();
      const hex = await page.locator('#hash-hex').textContent(), base64 = await page.locator('#hash-base64').textContent(), status = await page.locator('#hash-status').textContent();
      assert.equal(actualInput, item.expectedBrowserInput, item.id); assert.equal(hex, item.expectedHex, item.id); assert.equal(base64, item.expectedBase64, item.id);
      assert.equal(status, `SHA-256 generated from ${item.expectedUtf8Bytes} UTF-8 bytes.`);
      run.sha256.push({ ...item, actualInput, hex, base64, status, passed: true });
      if (report.runs.length === 0 && item.id === 'decomposed-accent') await page.locator('.tool-app').screenshot({ path: `${directory}/sha256/tool-run.png` });
    }
    assert.deepEqual(errors, []); report.runs.push(run); await browser.close(); browser = null;
    console.log(`${run.browser} ${run.version}: 15 URL cases, 13 SHA-256 cases, and query-parser checks passed.`);
  }
  report.passed = true;
  const output = process.argv.includes('--live') ? 'deployment/editorial-expansion-2026-10-07/experiments-live.json' : 'docs/audits/encoding-hash-experiments-2026-10-07.json';
  write(output, report);
  for (const [group, key] of [['url-encoding', 'urlEncoding'], ['sha256', 'sha256']]) write(`${directory}/${group}/results.json`, { checkedAt: report.checkedAt, method: report.method, runs: report.runs.map(run => ({ browser: run.browser, version: run.version, cases: run[key], ...(group === 'url-encoding' ? { queryParsing: run.queryParsing } : {}) })) });
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); } });
