// Record actual browser behavior. Fixed expected values are separate from output.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const express = require('express');
const sharp = require('sharp');
const { createHash } = require('node:crypto');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('../deployment/browser-check/node_modules/playwright'); }
const out = 'frontend/assets/examples/experiments';
const images = 'frontend/assets/images/editorial';
fs.mkdirSync(out, { recursive: true });
fs.mkdirSync(images, { recursive: true });
const jsonCases = [
  ['trailing-comma', '{"a":1,}', null],
  ['single-quotes', "{'a':1}", null],
  ['unquoted-key', '{a:1}', null],
  ['comment', '{"a":1/* note */}', null],
  ['unterminated-string', '{"a":"unfinished}', null],
  ['leading-zero', '{"a":01}', null],
  ['nan', '{"a":NaN}', null],
  ['undefined', '{"a":undefined}', null],
  ['extra-brace', '{"a":1}}', null],
  ['missing-colon', '{"a" 1}', null],
  ['valid-nested', '{"items":[1,true,null],"name":"café"}', '{"items":[1,true,null],"name":"café"}'],
  ['duplicate-key', '{"role":"reader","role":"editor"}', '{"role":"editor"}'],
  ['unsafe-integer', '{"id":9007199254740993}', '{"id":9007199254740992}'],
  ['string-id', '{"id":"9007199254740993"}', '{"id":"9007199254740993"}']
].map(([id, input, expected]) => ({ id, input, expected }));
const csvCases = [
  ['quoted-comma', 'name,note\nAda,"red, blue"', true, [{ name: 'Ada', note: 'red, blue' }]],
  ['escaped-quote', 'name,note\nAda,"She said ""hello"""', true, [{ name: 'Ada', note: 'She said "hello"' }]],
  ['quoted-newline', 'name,note\nAda,"first\nsecond"', true, [{ name: 'Ada', note: 'first\nsecond' }]],
  ['unicode', 'name,note\nZoë,你好 🙂', true, [{ name: 'Zoë', note: '你好 🙂' }]],
  ['blank-fields', 'name,note\nAda,\n,empty name', true, [{ name: 'Ada', note: '' }, { name: '', note: 'empty name' }]],
  ['numeric-strings', 'id,enabled\n0012,false', true, [{ id: '0012', enabled: 'false' }]],
  ['utf8-bom', '\uFEFFname,note\nAda,ok', true, [{ name: 'Ada', note: 'ok' }]],
  ['headers-off', 'a,b\n1,2', false, [['a', 'b'], ['1', '2']]],
  ['duplicate-header', 'name,name\nAda,Lee', true, null, 'Header names must be unique.'],
  ['short-row', 'name,note\nAda', true, null, 'Row 2 has 1 columns; expected 2.'],
  ['extra-column', 'name,note\nAda,ok,extra', true, null, 'Row 2 has 3 columns; expected 2.'],
  ['unclosed-quote', 'name,note\nAda,"unfinished', true, null, 'The CSV ends inside a quoted field.'],
  ['semicolon-input', 'name;note\nAda;ok', true, [{ 'name;note': 'Ada;ok' }]]
].map(([id, input, headers, expected, error]) => ({ id, input, headers, expected, ...(error ? { error } : {}) }));
// columns: words, UTF-16 characters, characters without whitespace, sentences,
// paragraphs, estimated reading minutes. This is a fixture, not a tokenizer.
const wordCases = [
  ['empty', '', [0,0,0,0,0,0]],
  ['ordinary', 'Hello world.', [2,12,11,1,1,1]],
  ['emoji', '🙂 🙂', [2,5,4,1,1,1]],
  ['family-emoji', '👨‍👩‍👧‍👦', [1,11,11,1,1,1]],
  ['composed-accent', 'café', [1,4,4,1,1,1]],
  ['combining-accent', 'cafe\u0301', [1,5,5,1,1,1]],
  ['chinese', '你好世界', [1,4,4,1,1,1]],
  ['zero-width-space', 'one\u200Btwo', [1,7,7,1,1,1]],
  ['nonbreaking-space', 'one\u00A0two', [2,7,6,1,1,1]],
  ['hyphen', 'well-known fact', [2,15,14,1,1,1]],
  ['punctuation', 'Hi...there?', [1,11,11,2,1,1]],
  ['paragraphs', 'One.\n\nTwo!', [2,10,8,2,2,1]]
].map(([id, input, expected]) => ({ id, input, expected }));
for (const [name, cases] of [['json',jsonCases],['csv',csvCases],['word-counter',wordCases]]) fs.writeFileSync(`${out}/${name}-cases.json`, JSON.stringify(cases, null, 2) + '\n');
const report = { checkedAt: new Date().toISOString(), timezone: 'Asia/Karachi', source: 'Actual local browser tools; synthetic public fixtures.', runs: [] };
let browser, server;
(async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect x="40" y="40" width="560" height="320" rx="24" fill="#174d80"/><circle cx="500" cy="130" r="45" fill="#ffd166"/><path d="M80 300L230 140L340 260L410 190L560 300Z" fill="#8ddac7"/><text x="70" y="100" font-family="sans-serif" font-size="26" fill="white">ANVIL FORMAT TEST</text><text x="80" y="338" font-family="sans-serif" font-size="18" fill="white">640 × 400 pixels · transparent margin</text></svg>';
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  fs.writeFileSync(`${out}/format-sample.png`, png);
  await sharp(png).flatten({ background: '#ffffff' }).jpeg({ quality: 85 }).toFile(`${out}/format-sample.jpg`);
  await sharp(png).webp({ lossless: true }).toFile(`${out}/format-sample.webp`);
  const pdfLibrary = process.env.PDF_LIB_PATH || 'deployment/adsense-followup-2026-10-05/pdf-lib.min.js';
  assert.ok(fs.existsSync(pdfLibrary), 'Supply PDF_LIB_PATH pointing to pdf-lib 1.17.1 browser bundle.');
  const app = express(); app.use(express.static('frontend'));
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const executables = [process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(file => fs.existsSync(file));
  assert.ok(executables.length, 'Supply CHROME_PATH for an installed Chromium browser.');
  for (const executablePath of executables) {
    browser = await playwright.chromium.launch({ executablePath, headless: true });
    const context = await browser.newContext({ viewport: { width: 1100, height: 850 } });
    await context.route('**/pdf-lib.min.js', route => route.fulfill({ path: pdfLibrary, contentType: 'text/javascript' }));
    const page = await context.newPage();
    const run = { browser: executablePath.includes('Edge') ? 'Edge' : 'Chrome', version: browser.version(), viewport: { width: 1100, height: 850 }, json: [], csv: [], wordCounter: [], pdf: [] };
    const screenshot = async name => { if (!report.runs.length) await page.locator('.tool-app').screenshot({ path: `${images}/${name}.png` }); };
    await page.goto(`${origin}/tools/json-formatter.html`);
    for (const test of jsonCases) {
      await page.locator('#jf-input').fill(test.input);
      await page.locator('#jf-minify').click();
      const output = await page.locator('#jf-output').textContent();
      const status = await page.locator('#jf-status').textContent();
      assert.equal(output, test.expected ?? '', test.id);
      assert.equal(status === 'JSON is valid.', test.expected !== null, test.id);
      run.json.push({ id: test.id, input: test.input, output, status, passed: true });
      if (test.id === 'unsafe-integer') await screenshot('json-precision-experiment');
    }
    await page.locator('#jf-input').fill('{"a":1,}'); await page.locator('#jf-format').click();
    assert.equal(await page.locator('#jf-output').textContent(), '');
    run.clearsStaleJsonOutput = true;
    await page.goto(`${origin}/tools/csv-to-json.html`);
    for (const test of csvCases) {
      await page.locator('#csv-input').fill(test.input);
      await page.locator('#csv-headers').setChecked(test.headers);
      await page.locator('#csv-convert').click();
      const output = await page.locator('#csv-output').textContent();
      const status = await page.locator('#csv-status').textContent();
      if (test.expected === null) { assert.equal(output, '', test.id); assert.equal(status, test.error, test.id); }
      else assert.deepEqual(JSON.parse(output), test.expected, test.id);
      run.csv.push({ id: test.id, input: test.input, headers: test.headers, output: output ? JSON.parse(output) : null, status, passed: true });
      if (test.id === 'quoted-newline') await screenshot('csv-newline-experiment');
    }
    await page.goto(`${origin}/tools/word-counter.html`);
    for (const test of wordCases) {
      await page.locator('#wc-input').fill(test.input);
      const output = await page.evaluate(() => ['wc-words','wc-chars','wc-chars-nospace','wc-sentences','wc-paragraphs','wc-readtime'].map(id => parseInt(document.getElementById(id).textContent, 10)));
      assert.deepEqual(output, test.expected, test.id);
      run.wordCounter.push({ id: test.id, input: test.input, output, passed: true });
      if (test.id === 'family-emoji') await screenshot('unicode-count-experiment');
    }
    for (const extension of ['jpg','png','webp']) {
      await page.goto(`${origin}/tools/image-to-pdf.html`);
      await page.locator('#ip-file-input').setInputFiles(path.resolve(`${out}/format-sample.${extension}`));
      const download = page.waitForEvent('download');
      await page.locator('#ip-convert').click();
      const file = `${out}/format-${report.runs.length ? 'edge-' : ''}${extension}.pdf`;
      await (await download).saveAs(file);
      assert.match(await page.locator('#ip-status').textContent(), /PDF ready \(1 pages\)/);
      run.pdf.push({ format: extension, inputBytes: fs.statSync(`${out}/format-sample.${extension}`).size, outputBytes: fs.statSync(file).size, outputFile: file, download: '/' + file.slice('frontend/'.length), sha256: createHash('sha256').update(fs.readFileSync(file)).digest('hex') });
      if (extension === 'webp') await screenshot('image-format-experiment');
    }
    report.runs.push(run);
    console.log(`${run.browser} ${run.version}: 14 JSON, 13 CSV, 12 word-count, 3 PDF runs passed.`);
    await context.close(); await browser.close(); browser = null;
  }
  const dimensionsFile = 'backend/src/lib/editorial-images.json';
  const dimensions = JSON.parse(fs.readFileSync(dimensionsFile, 'utf8'));
  for (const name of ['json-precision-experiment','csv-newline-experiment','unicode-count-experiment','image-format-experiment']) {
    const metadata = await sharp(`${images}/${name}.png`).metadata();
    dimensions[`/assets/images/editorial/${name}.png`] = { width: metadata.width, height: metadata.height };
  }
  fs.writeFileSync(dimensionsFile, JSON.stringify(dimensions, null, 2) + '\n');
  fs.writeFileSync(`${out}/results.json`, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync('docs/audits/readiness-experiments.json', JSON.stringify(report, null, 2) + '\n');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});
