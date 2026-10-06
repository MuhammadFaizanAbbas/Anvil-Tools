// Browser verification under the actual release CSP, with synthetic inbox data.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const express = require('express');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const { renderArticle } = require('../backend/src/lib/articles');
const { renderBlog } = require('../backend/src/lib/blog');
const { securityHeadersForPath } = require('../backend/src/lib/public-security');
const library = require('../content/editorial/published-library.json');
const snapshot = JSON.parse(fs.readFileSync('deployment/adsense-audit-2026-10-07/database-before.json', 'utf8'));
const posts = library.map(item => ({ ...snapshot.find(post => post.slug === item.slug), ...item, seo_title: item.title, seo_description: item.excerpt, body: fs.readFileSync('content/editorial/' + item.bodyFile, 'utf8') }));
const report = { checkedAt: new Date().toISOString(), scope: 'Local release with real security headers; prepared guide versions; synthetic inbox, no email delivery', layouts: [], checks: [], cspViolations: [], errors: [] };
const toolsOnly = process.argv.includes('--tools-only');
if (toolsOnly) {
  const previous = JSON.parse(fs.readFileSync('docs/audits/adsense-oct7-browser.json', 'utf8'));
  assert.equal(previous.layouts.length, 129); assert.ok(previous.layouts.every(item => item.passed));
  assert.deepEqual(previous.cspViolations.filter(item => !item.url.includes('/tools/background-remover.html')), []); assert.deepEqual(previous.errors, []);
  report.layouts = previous.layouts;
  report.layoutCheckedAt = previous.layoutCheckedAt || previous.checkedAt;
}
const record = name => { report.checks.push(name); console.log(name); };
let browser, server, origin;
(async () => {
  const app = express(); app.disable('x-powered-by');
  app.use((req, res, next) => { res.set(securityHeadersForPath(req.path)); next(); });
  app.get(/^\/index\.html\/?$/i, (req, res) => res.redirect(301, '/' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '')));
  app.get(['/journal', '/journal/'], (req, res) => res.redirect(301, '/blog/index.html'));
  app.get(['/blog', '/blog/', '/blog/index.html'], (req, res) => res.type('html').send(renderBlog(posts, origin)));
  app.get('/journal/:slug', (req, res) => { const post = posts.find(item => item.slug === req.params.slug); if (!post) return res.sendStatus(404); res.type('html').send(renderArticle(post, origin)); });
  app.get('/journal-images/:id', async (req, res) => {
    try { const response = await fetch('https://nevco.online/journal-images/' + encodeURIComponent(req.params.id)); res.status(response.status).type(response.headers.get('content-type')).send(Buffer.from(await response.arrayBuffer())); }
    catch (_) { res.sendStatus(502); }
  });
  app.get('/assets/js/config.js', (req, res) => res.type('js').send(`window.ANVIL_CONFIG={SITE_URL:location.origin,API_BASE_URL:location.origin};`));
  app.post('/api/temp-mail/create', (req, res) => res.json({ capability: 'a'.repeat(64), address: 'authorized-check@example.test', expiresAt: Date.now() + 3600000 }));
  app.get('/api/temp-mail/messages', (req, res) => res.json({ address: 'authorized-check@example.test', messages: [], expiresAt: Date.now() + 3600000 }));
  app.get('/api/public/posts', (req, res) => { res.set('X-Total-Count', String(posts.length)); res.json(posts); });
  app.use((req, res, next) => {
    if (!req.path.endsWith('.html') && req.path !== '/') return next();
    const file = path.resolve('frontend', '.' + (req.path === '/' ? '/index.html' : req.path));
    if (!file.startsWith(path.resolve('frontend') + path.sep) || !fs.existsSync(file)) return next();
    res.type('html').send(fs.readFileSync(file, 'utf8').replaceAll('https://anviltools.vercel.app', origin));
  });
  app.use(express.static('frontend'));
  server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  const redirect = await fetch(origin + '/index.html?source=audit', { redirect: 'manual' });
  assert.equal(redirect.status, 301); assert.equal(redirect.headers.get('location'), '/?source=audit');
  assert.equal((await fetch(origin + '/', { redirect: 'manual' })).status, 200);
  assert.equal((await fetch(origin + '/journal/', { redirect: 'manual' })).headers.get('location'), '/blog/index.html');
  record('Permanent homepage redirect preserves query and does not loop; Journal index leads to the shared hub');
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
  await context.exposeBinding('recordCspViolation', (source, detail) => report.cspViolations.push(detail));
  await context.addInitScript(() => document.addEventListener('securitypolicyviolation', event => window.recordCspViolation({ url: location.href, directive: event.effectiveDirective, blocked: event.blockedURI })));
  const page = await context.newPage(); page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', async message => {
    if (message.type() !== 'error' || !page.url().includes('/tools/background-remover.html')) return;
    const details = await Promise.all(message.args().map(arg => arg.evaluate(value => value?.stack || value?.message || String(value)).catch(() => 'unavailable')));
    (report.backgroundErrors ||= []).push(details.join(' ')); console.log(details.join(' '));
  });
  page.on('requestfailed', request => {
    if (!page.url().includes('/tools/background-remover.html')) return;
    const detail = { url: request.url(), error: request.failure()?.errorText };
    (report.backgroundRequests ||= []).push(detail); console.log(JSON.stringify(detail));
  });
  const routes = [...fs.readFileSync('frontend/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
  routes.push(...library.map(item => '/journal/' + item.slug));
  for (const width of toolsOnly ? [] : [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [...new Set(routes)]) {
      const response = await page.goto(origin + route, { waitUntil: 'networkidle' }); assert.equal(response.status(), 200);
      assert.equal(await page.locator('h1').count(), 1, route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      assert.equal(overflow, false, `${route} overflows at ${width}px`);
      const nav = page.locator('.main-nav a[href$="/blog/index.html"],.main-nav a[href="blog/index.html"]');
      assert.equal(await nav.innerText(), 'Guides & experiments', route);
      report.layouts.push({ route, width, passed: true });
    }
    console.log(`All 43 public pages fit at ${width}px`);
  }
  record('129 responsive layouts pass with the longer shared navigation label');
  await page.goto(origin + '/tools/temp-mail.html');
  await page.waitForFunction(() => document.getElementById('tm-address').textContent.includes('@'));
  assert.ok(await page.locator('#tm-provider-warning').isVisible());
  assert.match(await page.locator('.lede').innerText(), /authorized testing/);
  await page.locator('#tm-refresh').click(); assert.ok(await page.locator('#tm-expiry').isVisible());
  record('Synthetic temporary inbox retains controls, access expiry, and visible provider-retention warning');
  await page.goto(origin + '/tools/user-agent-generator.html');
  await page.locator('#ua-select').selectOption({ label: 'Googlebot' });
  assert.match(await page.locator('#ua-output').innerText(), /Googlebot/);
  await page.locator('#ua-copy').click(); assert.match(await page.locator('#ua-status').innerText(), /copied/i);
  record('Authorized user-agent reference still selects and copies samples');
  await page.goto(origin + '/tools/json-formatter.html');
  await page.locator('#jf-input').fill('{"check":true}'); await page.locator('#jf-format').click();
  assert.deepEqual(JSON.parse(await page.locator('#jf-output').innerText()), { check: true });
  await page.goto(origin + '/tools/csv-to-json.html');
  await page.locator('#csv-input').fill('id,note\n001,"first\nsecond"'); await page.locator('#csv-convert').click();
  assert.deepEqual(JSON.parse(await page.locator('#csv-output').innerText()), [{ id: '001', note: 'first\nsecond' }]);
  record('JSON and quoted-newline CSV transformations work under the CSP');
  await page.goto(origin + '/tools/background-remover.html');
  await page.locator('#bg-file-input').setInputFiles(path.resolve('frontend/assets/examples/images/mug-photo.jpg'));
  await page.waitForFunction(() => /PNG ready\.|Unable to process|download stopped/i.test(document.getElementById('bg-status').textContent), null, { timeout: 180000 });
  assert.match(await page.locator('#bg-status').innerText(), /PNG ready\./);
  await page.screenshot({ path: 'docs/audits/oct7-background-csp.png', fullPage: true });
  record('Background remover completes a real image using CDN scripts, WASM, local model files, and blob previews under the CSP');
  const plainContext = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const plain = await plainContext.newPage();
  for (const route of [...routes.filter(route => route.startsWith('/blog/') && route !== '/blog/index.html'), ...library.map(item => '/journal/' + item.slug)]) {
    await plain.goto(origin + route);
    assert.match(await plain.locator('.article-meta').first().innerText(), /VelloxTech editorial team/);
    assert.equal(await plain.locator('time').filter({ hasText: '2026-10-07' }).count(), 1);
    assert.ok(await plain.locator('a[href$="/about.html#editorial-testing"]').count());
    assert.ok(await plain.locator('.article-content').innerText());
  }
  record('All eight articles expose author, original publication date, matched review date, and methodology without JavaScript');
  assert.deepEqual(report.cspViolations, []); assert.deepEqual(report.errors, []);
  await plainContext.close(); await context.close(); report.passed = true;
})().catch(error => { report.passed = false; report.failure = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  fs.writeFileSync('docs/audits/adsense-oct7-browser.json', JSON.stringify(report, null, 2) + '\n');
  if (browser) await browser.close(); if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
