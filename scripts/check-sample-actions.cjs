// Exercise the reader's exact workflow: sample and primary action in one JS turn.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const express = require('express');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const { securityHeadersForPath } = require('../backend/src/lib/public-security');
const cases = [
  ['base64-tool', '#b64-encode', '#b64-output', 'SGVsbG8='],
  ['json-formatter', '#jf-format', '#jf-output', { id: '001', active: true, items: [1, null] }],
  ['csv-to-json', '#csv-convert', '#csv-output', [{ id: '001', name: 'Amina, Ali', note: '' }, { id: '002', name: 'Omar', note: 'He said "hi"' }]],
  ['jwt-decoder', '#jwt-decode', '#jwt-payload', { sub: 'demo-user', exp: 0 }],
  ['unix-timestamp-converter', '#ts-from', '#ts-output', 'UTC: 1970-01-01T00:00:00.000Z'],
  ['url-encoder-decoder', '#url-encode', '#url-output', 'red%20shoes%20%2B%20caf%C3%A9'],
  ['text-case-converter', '[data-case="snake"]', '#case-output', 'nasa_report_café'],
  ['text-diff-checker', '#diff-compare', '#diff-status', '1 added line, 1 removed line, 2 unchanged.'],
  ['qr-code-generator', '#qr-generate', '#qr-canvas-wrap canvas', null]
];
const baseline = process.argv.includes('--baseline');
const live = process.argv.find(value => /^https?:\/\//.test(value));
const report = { checkedAt: new Date().toISOString(), baseline, cases: [], errors: [] };
let browser, server;
(async () => {
  let origin = live;
  if (!origin) {
    const app = express();
    app.use((req, res, next) => { res.set(securityHeadersForPath(req.path)); next(); });
    app.get('/assets/js/config.js', (req, res) => res.type('js').send('window.ANVIL_CONFIG={SITE_URL:location.origin,API_BASE_URL:location.origin};'));
    app.get('/api/public/recommendations', (req, res) => res.json([]));
    app.use(express.static('frontend'));
    server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
  }
  report.origin = origin;
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  for (const [slug, action, output, expected] of cases) {
    await page.goto(`${origin}/tools/${slug}.html`, { waitUntil: 'domcontentloaded' });
    const results = await page.evaluate(({ action, output }) => {
      const sample = document.querySelector('[data-example-fields]');
      const fields = Object.keys(JSON.parse(sample.dataset.exampleFields));
      const events = [];
      const listener = event => { if (fields.includes(event.target.id)) events.push({ field: event.target.id, type: event.type, bubbles: event.bubbles }); };
      document.addEventListener('input', listener);
      document.addEventListener('change', listener);
      const results = [];
      for (let iteration = 0; iteration < 10; iteration++) {
        for (const id of fields) {
          const field = document.getElementById(id);
          if (field.type === 'checkbox') field.checked = false;
          else if (field.tagName !== 'SELECT') field.value = 'stale invalid input';
        }
        events.length = 0;
        sample.click();
        const feedback = document.getElementById('example-status').textContent;
        document.querySelector(action).click();
        const node = document.querySelector(output);
        results.push({ feedback, fields, events: events.slice(), output: node ? node.value ?? node.textContent : null, canvas: node?.tagName === 'CANVAS' ? [node.width, node.height] : null });
      }
      document.removeEventListener('input', listener);
      document.removeEventListener('change', listener);
      return results;
    }, { action, output });
    for (const result of results) {
      assert.match(result.feedback, /Sample loaded/, slug);
      if (!baseline) for (const field of result.fields) for (const type of ['input', 'change']) {
        assert.ok(result.events.some(event => event.field === field && event.type === type && event.bubbles), `${slug}: missing ${type} for ${field}`);
      }
      if (expected === null) assert.deepEqual(result.canvas, [180, 180], slug);
      else if (typeof expected === 'object') assert.deepEqual(JSON.parse(result.output), expected, slug);
      else assert.ok(result.output.includes(expected), `${slug}: ${result.output}`);
    }
    report.cases.push({ slug, repetitions: results.length, noWaitBetweenClicks: true, outputPassed: true, emitsBothEvents: results.every(result => result.fields.every(field => ['input', 'change'].every(type => result.events.some(event => event.field === field && event.type === type && event.bubbles)))) });
    console.log(`${slug}: ${results.length} immediate sample/action checks passed`);
  }
  assert.deepEqual(report.errors, []);
  report.passed = true;
})().catch(error => { report.passed = false; report.failure = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  const file = baseline ? 'deployment/guide-samples-2026-10-07/sample-baseline.json' : live ? 'deployment/guide-samples-2026-10-07/sample-live.json' : 'docs/audits/guide-sample-actions-2026-10-07.json';
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  if (browser) await browser.close();
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
