// Real Chromium, emulated phone hardware/network. No physical-device claim.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const express = require('express');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const live = process.argv.find(arg => arg.startsWith('--origin='))?.slice(9);
const report = { checkedAt: new Date().toISOString(), scope: live || 'local release with live recommendations API',
  device: { width: 390, height: 844, touch: true, cpuSlowdown: 4, latencyMs: 150, downloadMbps: 10, uploadMbps: 1 },
  pages: [], model: [], requests: [], limits: ['Emulated phone/CPU/network on desktop Chromium; no physical iOS/Android test.',
    '10 Mbps is the explicit download profile used here; Lighthouse uses its own mobile simulation.',
    'A synthetic image is processed locally. No email or valid contact submission is sent.'] };
let server, browser;
(async () => {
  let origin = live;
  if (!origin) {
    const app = express(); app.use(express.static('frontend'));
    server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
  }
  browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  report.browser = browser.version();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  if (!live) await context.addInitScript(() => {
    let config;
    Object.defineProperty(window, 'ANVIL_CONFIG', { configurable: true,
      get: () => config, set: value => { value.API_BASE_URL = 'https://anvil-tools-backend.vercel.app'; config = value; }
    });
  });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (!['http:', 'https:'].includes(url.protocol)) return;
    report.requests.push({ host: url.host, path: url.pathname, method: request.method(), resourceType: request.resourceType(), bodyBytes: Buffer.byteLength(request.postData() || '') });
  });
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 10e6 / 8, uploadThroughput: 1e6 / 8 });
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  for (const route of ['/', '/tools/json-formatter.html', '/tools/pdf-merge.html', '/tools/image-to-pdf.html', '/tools/background-remover.html']) {
    const started = performance.now();
    const response = await page.goto(origin + route, { waitUntil: 'networkidle', timeout: 60000 });
    const metrics = await page.evaluate(() => ({ paints: performance.getEntriesByType('paint').map(item => ({ name: item.name, ms: Math.round(item.startTime) })),
      api: performance.getEntriesByType('resource').filter(item => item.name.includes('/api/')).map(item => ({ path: new URL(item.name).pathname, ms: Math.round(item.duration) })),
      overflow: document.documentElement.scrollWidth > innerWidth,
      cookies: document.cookie, storageKeys: Object.keys(localStorage), modelResources: performance.getEntriesByType('resource').filter(item => /\/assets\/vendor\/background-removal\/|cdn\.jsdelivr\.net.*(?:imgly|onnxruntime)/.test(item.name)).length }));
    assert.equal(response.status(), 200); assert.equal(metrics.overflow, false); assert.equal(metrics.cookies, '');
    if (route.includes('background-remover')) assert.equal(metrics.modelResources, 0, 'Model must be deferred until file selection');
    report.pages.push({ route, status: response.status(), settledMs: Math.round(performance.now() - started), ...metrics });
    console.log(JSON.stringify(report.pages.at(-1)));
  }
  for (const mode of ['cold', 'warm']) {
    const started = performance.now();
    await page.locator('#bg-file-input').setInputFiles(path.resolve('frontend/assets/images/editorial/background-removal-input.png'));
    await page.locator('#bg-download').waitFor({ state: 'visible', timeout: 240000 });
    const ms = Math.round(performance.now() - started);
    assert.match(await page.locator('#bg-status').innerText(), /PNG ready/);
    report.model.push({ mode, processingAndDownloadMs: ms });
    console.log(JSON.stringify(report.model.at(-1)));
    if (mode === 'cold') await page.reload({ waitUntil: 'networkidle' });
  }
  report.mobileApi = [];
  for (const path of ['/api/health', '/api/tools', '/api/public/posts']) {
    const samples = await page.evaluate(async path => {
      const results = [];
      for (let i = 0; i < 5; i++) {
        const started = performance.now();
        const response = await fetch('https://anvil-tools-backend.vercel.app' + path, { credentials: 'omit', signal: AbortSignal.timeout(20000) });
        await response.arrayBuffer();
        results.push({ status: response.status, ms: Math.round(performance.now() - started) });
      }
      return results;
    }, path);
    assert.ok(samples.every(item => item.status === 200));
    const sorted = samples.map(item => item.ms).sort((a, b) => a - b);
    report.mobileApi.push({ path, samples, p50Ms: sorted[2], maxMs: sorted[4] });
    console.log(JSON.stringify(report.mobileApi.at(-1)));
  }
  report.errors = errors;
  report.unexpectedUploads = report.requests.filter(item => item.method !== 'GET');
  assert.deepEqual(errors, []); assert.deepEqual(report.unexpectedUploads, []);
  report.passed = true;
})().catch(error => { report.error = error.message; process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve));
  const file = process.argv.find(arg => arg.startsWith('--report='))?.slice(9) || 'docs/audits/full-audit-mobile-runtime.json';
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
});
