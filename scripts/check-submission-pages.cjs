// Browser checks of the prepared public release. Optional --live ORIGIN audits a deployment.
// No messages are sent; inbox layout checks use explicitly synthetic API responses.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const express = require('express');
const sharp = require('sharp');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const axe = require('../deployment/browser-check/node_modules/axe-core');
const jsQR = require('../deployment/browser-check/node_modules/jsqr');
let PDFDocument;
const { renderArticle } = require('../backend/src/lib/articles');
const { renderBlog } = require('../backend/src/lib/blog');
const library = require('../content/editorial/published-library.json');
const baselines = require('../docs/audits/editorial-cleanup-database.json');
const directory = process.argv.find(arg => arg.startsWith('--folder='))?.slice('--folder='.length) || 'deployment/page-review-2026-10-05';
const live = process.argv[2] === '--live' ? new URL(process.argv[3]).origin : null;
const toolsOnly = process.argv.includes('--tools-only');
const onlyRoutes = process.argv.find(arg => arg.startsWith('--routes='))?.slice('--routes='.length).split(',');
const report = { checkedAt: new Date().toISOString(), scope: live || 'local prepared release', axeVersion: axe.version, pages: [], functionality: [], interactiveStates: [], limits: ['Automated axe checks and emulated widths do not establish complete accessibility.', 'Inbox layout and expiry checks use synthetic responses; no email or contact message is sent.', 'Physical-device, screen-reader, and future advertising checks remain separate.'] };

async function cached(url, name) {
  const folder = path.resolve('deployment/adsense-followup-2026-10-05');
  fs.mkdirSync(folder, { recursive: true });
  const file = path.join(folder, name);
  if (!fs.existsSync(file)) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, 'Public fixture download failed');
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  return file;
}

async function fixtures() {
  const folder = 'frontend/assets/examples/pdf';
  fs.mkdirSync(folder, { recursive: true });
  const documents = {};
  for (const [name, sizes] of Object.entries({ cover: [[420, 594]], application: [[400, 600], [401, 601]], support: [[360, 480]] })) {
    const file = `${folder}/${name}.pdf`;
    if (!fs.existsSync(file)) {
      const doc = await PDFDocument.create();
      doc.setCreationDate(new Date('2026-10-05T00:00:00Z'));
      doc.setModificationDate(new Date('2026-10-05T00:00:00Z'));
      sizes.forEach((size, index) => doc.addPage(size).drawText(`Synthetic ${name} / ${index + 1}`, { x: 20, y: 30, size: 12 }));
      fs.writeFileSync(file, await doc.save());
    }
    documents[name] = await PDFDocument.load(fs.readFileSync(file));
    assert.deepEqual(documents[name].getPages().map(page => [page.getWidth(), page.getHeight()]), sizes);
  }
}

(async () => {
  fs.mkdirSync(directory, { recursive: true });
  const bundle = await cached('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', 'pdf-lib.min.js');
  ({ PDFDocument } = require(bundle));
  await Promise.all(library.map(guide => cached(`https://anvil-tools-backend.vercel.app/api/public/post-images/${guide.cover_image_id}`, `${guide.cover_image_id}.webp`)));
  if (!live) await fixtures();
  const posts = library.map(guide => ({ ...baselines.published.find(post => post.slug === guide.slug), ...guide, body: fs.readFileSync(`content/editorial/${guide.bodyFile}`, 'utf8').trim() }));
  const coverTypes = Object.fromEntries(await Promise.all(library.map(async guide => {
    const metadata = await sharp(`deployment/adsense-followup-2026-10-05/${guide.cover_image_id}.webp`).metadata();
    return [guide.cover_image_id, { svg: 'image/svg+xml', png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }[metadata.format]];
  })));
  let server, browser, origin = live;
  try {
    if (!live) {
      const app = express();
      app.get('/journal/:slug', (req, res) => {
        const post = posts.find(post => post.slug === req.params.slug);
        if (!post) return res.sendStatus(404);
        res.type('html').send(renderArticle(post, origin));
      });
      app.get(['/blog/', '/blog/index.html'], (req, res) => res.type('html').send(renderBlog(posts, origin)));
      app.get('/journal-images/:id', (req, res) => {
        if (!coverTypes[req.params.id]) return res.sendStatus(404);
        res.type(coverTypes[req.params.id]).sendFile(path.resolve(`deployment/adsense-followup-2026-10-05/${req.params.id}.webp`));
      });
      app.use(express.static('frontend'));
      server = app.listen(0, '127.0.0.1');
      await new Promise(resolve => server.once('listening', resolve));
      origin = `http://127.0.0.1:${server.address().port}`;
    }
    console.log('Launching public-page browser audit.');
    browser = await chromium.launch({ executablePath: process.argv.includes('--chrome') ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true, timeout: 45000 });
    console.log('Browser connected.');
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 390, height: 900 } });
    const externalFontRequests = [];
    context.on('request', request => { if (/fonts\.(?:googleapis|gstatic)\.com/.test(request.url())) externalFontRequests.push(request.url()); });
    if (!live) await context.route('**/api/public/recommendations*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(posts) }));
    await context.route('**/api/temp-mail/**', route => {
      const create = route.request().url().includes('/create');
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ok: true, capability: '0'.repeat(64), address: 'review-fixture@example.test', expiresAt: Date.now() + 600000, ...(create ? {} : { messages: [] }) }) });
    });
    await context.route('**/pdf-lib.min.js', route => route.fulfill({ path: 'deployment/adsense-followup-2026-10-05/pdf-lib.min.js', contentType: 'text/javascript' }));
    const qrFile = `${directory}/qrcode.min.js`;
    if (!fs.existsSync(qrFile)) {
      const response = await fetch('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
      assert.equal(response.status, 200);
      fs.writeFileSync(qrFile, await response.text());
    }
    await context.route('**/qrcode.min.js', route => route.fulfill({ path: qrFile, contentType: 'text/javascript' }));
    let paths = ['/', '/about.html', '/contact.html', '/privacy-policy.html', '/cookie-policy.html', '/terms-of-service.html', '/disclaimer.html', '/tools/index.html', '/blog/index.html',
      ...fs.readdirSync('frontend/categories').filter(file => file.endsWith('.html')).map(file => `/categories/${file}`),
      ...Object.keys(require('./site-generator/tool-examples.json')).map(slug => `/tools/${slug}.html`), ...library.map(guide => `/journal/${guide.slug}`),
      ...require('../content/editorial/experiments.json').map(article => `/blog/${article.slug}.html`)];
    assert.equal(paths.length, 43);
    if (onlyRoutes) {
      assert.ok(onlyRoutes.every(route => paths.includes(route)), 'Requested route must be in the reviewed public catalog');
      paths = paths.filter(route => onlyRoutes.includes(route));
    }
    let cursor = 0;
    if (!toolsOnly) await Promise.all(Array.from({ length: process.argv.includes('--serial') ? 1 : 3 }, async () => {
      const page = await context.newPage();
      try {
        while (cursor < paths.length) {
          const route = paths[cursor++];
          console.log(`Checking ${route}`);
          const errors = [];
          const onError = error => errors.push(error.message);
          page.on('pageerror', onError);
          const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
          if (route === '/' || route.startsWith('/journal/')) await page.locator('#suggested-guides .tool-link').first().waitFor();
          for (const width of [320, 390, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            await page.evaluate(() => document.querySelectorAll('details.faq-item').forEach(node => { node.open = true; }));
            await page.addScriptTag({ content: axe.source });
            const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } }));
            const labels = await page.evaluate(() => axe.run(document, { runOnly: { type: 'rule', values: ['label-content-name-mismatch'] } }));
            result.violations.push(...labels.violations);
            const data = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length,
              title: document.title, description: document.querySelector('meta[name=description]')?.content,
              canonical: document.querySelector('link[rel=canonical]')?.href,
              overflow: document.documentElement.scrollWidth > innerWidth,
              brokenImages: [...document.images].filter(img => img.complete && !img.naturalWidth).map(img => img.getAttribute('src')) }));
            report.pages.push({ route, width, status: response.status(), ...data, errors: [...errors],
              violations: result.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({ target: node.target, failureSummary: node.failureSummary })) })),
              incomplete: result.incomplete.map(item => ({ id: item.id, nodes: item.nodes.length })) });
          }
          page.off('pageerror', onError);
          if (report.pages.length % 30 === 0) console.log(`Checked ${report.pages.length / 3} of ${paths.length} public pages.`);
        }
      } finally { await page.close(); }
    }));
    if (!onlyRoutes) {
    const page = await context.newPage();
    const stateErrors = [];
    page.on('pageerror', error => stateErrors.push(error.message));
    const visit = slug => { stateErrors.length = 0; return page.goto(`${origin}/tools/${slug}.html`, { waitUntil: 'domcontentloaded' }); };
    const record = async item => {
      report.functionality.push(item);
      await page.addScriptTag({ content: axe.source });
      const result = await page.evaluate(() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] } }));
      report.interactiveStates.push({ tool: item.tool, errors: [...stateErrors],
        violations: result.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({ target: node.target, failureSummary: node.failureSummary })) })),
        incomplete: result.incomplete.map(item => ({ id: item.id, nodes: item.nodes.length, details: item.nodes.map(node => ({ target: node.target, reason: node.failureSummary })) })) });
    };
    const sample = () => page.getByRole('button', { name: 'Try this sample', exact: true }).click();
    await page.goto(`${origin}/tools/index.html`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.locator('input[type="search"]').count(), 1);
    assert.equal(await page.locator('[data-catalog-search]').count(), 0);
    await page.locator('#tool-category').selectOption('Generators');
    assert.equal(await page.locator('[data-directory-tool]:visible').count(), 5);
    assert.equal(await page.locator('#tool-results').innerText(), '5 of 20 tools shown.');
    await page.locator('#tool-search').fill('JSON');
    assert.equal(await page.locator('[data-directory-tool]:visible').count(), 0);
    assert.match(await page.locator('#tool-results').innerText(), /No matching tools/);
    await page.locator('#tool-search').fill('');
    assert.equal(await page.locator('[data-directory-tool]:visible').count(), 5);
    assert.equal(await page.locator('#tool-results').innerText(), '5 of 20 tools shown.');
    await page.locator('#tool-category').selectOption('');
    assert.equal(await page.locator('[data-directory-tool]:visible').count(), 20);
    assert.equal(await page.locator('#tool-results').innerText(), '20 of 20 tools shown.');
    await page.locator('#tool-search').fill('JSON');
    assert.equal(await page.locator('[data-directory-tool]:visible').count(), 2);
    await page.locator('#tool-search').fill('');
    await page.locator('#tool-category').selectOption('PDF tools');
    assert.equal(await page.locator('[data-directory-tool]:visible').count(), 2);
    await page.locator('#tool-search').fill('no-such-tool');
    assert.equal(await page.locator('[data-directory-tool]:visible').count(), 0);
    assert.match(await page.locator('#tool-results').innerText(), /No matching/);
    await record({ tool: 'directory', searchAndCategoryAndNoResults: true });
    await visit('word-counter');
    assert.equal(await page.locator('#wc-readtime').innerText(), '0 min');
    await sample();
    assert.equal(await page.locator('#wc-words').innerText(), '4');
    assert.equal(await page.locator('#wc-chars').innerText(), '24');
    await page.locator('#wc-input').fill('');
    assert.equal(await page.locator('#wc-readtime').innerText(), '0 min');
    await record({ tool: 'word-counter', emptyAndWorkedExample: true });
    await visit('csv-to-json'); await sample(); await page.locator('#csv-convert').click();
    assert.deepEqual(JSON.parse(await page.locator('#csv-output').innerText()), [{ id: '001', name: 'Amina, Ali', note: '' }, { id: '002', name: 'Omar', note: 'He said "hi"' }]);
    await record({ tool: 'csv-to-json', leadingZeroQuotedCommaBlankAndQuote: true });
    await visit('json-formatter'); await sample(); await page.locator('#jf-format').click();
    assert.deepEqual(JSON.parse(await page.locator('#jf-output').innerText()), { id: '001', active: true, items: [1, null] });
    await page.locator('#jf-input').fill('{"active":true,}'); await page.locator('#jf-format').click();
    assert.equal(await page.locator('#jf-output').innerText(), '');
    await record({ tool: 'json-formatter', typesPreservedAndInvalidRejected: true });
    await visit('base64-tool'); await sample(); await page.locator('#b64-encode').click();
    assert.equal(await page.locator('#b64-output').innerText(), 'SGVsbG8=');
    await page.locator('#b64-input').fill('Y2Fmw6k='); await page.locator('#b64-decode').click();
    assert.equal(await page.locator('#b64-output').innerText(), 'café');
    await record({ tool: 'base64-tool', knownEncodingAndUnicode: true });
    await visit('url-encoder-decoder'); await sample(); await page.locator('#url-encode').click();
    assert.equal(await page.locator('#url-output').innerText(), 'red%20shoes%20%2B%20caf%C3%A9');
    await record({ tool: 'url-encoder-decoder', unicodeAndPlusEncoding: true });
    await visit('unit-converter'); await sample();
    assert.match(await page.locator('#uc-result').innerText(), /212\.000 fahrenheit/);
    await record({ tool: 'unit-converter', temperatureOffset: true });
    await visit('hash-generator'); await sample(); await page.locator('#hash-generate').click();
    await page.waitForFunction(() => document.getElementById('hash-hex').textContent.length === 64);
    assert.equal(await page.locator('#hash-hex').innerText(), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    await record({ tool: 'hash-generator', knownDigest: true });
    await visit('text-case-converter'); await sample(); await page.locator('[data-case=camel]').click();
    assert.equal(await page.locator('#case-output').inputValue(), 'nasaReportCafé');
    await record({ tool: 'text-case-converter', unicodeIdentifier: true });
    await visit('text-diff-checker'); await sample(); await page.locator('#diff-compare').click();
    assert.equal(await page.locator('#diff-status').innerText(), '1 added line, 1 removed line, 2 unchanged.');
    await record({ tool: 'text-diff-checker', replacementCounts: true });
    await visit('unix-timestamp-converter'); await sample(); await page.locator('#ts-from').click();
    assert.match(await page.locator('#ts-output').innerText(), /1970-01-01T00:00:00\.000Z/);
    await record({ tool: 'unix-timestamp-converter', explicitEpochUnit: true });
    await visit('jwt-decoder'); await sample(); await page.locator('#jwt-decode').click();
    assert.match(await page.locator('#jwt-status').innerText(), /not verified/i);
    await record({ tool: 'jwt-decoder', harmlessUnverifiedSample: true });
    await visit('password-generator');
    assert.equal((await page.locator('#pw-output').innerText()).length, 16);
    await page.locator('#pw-length').fill('48'); await page.locator('#pw-generate').click();
    assert.equal((await page.locator('#pw-output').innerText()).length, 48);
    await record({ tool: 'password-generator', supportedRange: true });
    await visit('user-agent-generator');
    await page.locator('#ua-select').selectOption({ label: 'iPhone Safari' });
    assert.match(await page.locator('#ua-output').innerText(), /iPhone; CPU iPhone OS 17_5/);
    await record({ tool: 'user-agent-generator', fixedFixtureSelection: true });
    await visit('color-palette-generator');
    const firstSwatch = await page.locator('#cp-row .swatch').first().getAttribute('style');
    await page.getByRole('button', { name: 'Lock color 1', exact: true }).click();
    await page.locator('#cp-generate').click();
    assert.equal(await page.locator('#cp-row .swatch').first().getAttribute('style'), firstSwatch);
    await page.locator('#cp-export').click();
    await page.waitForFunction(() => /CSS variables copied|--color-1:/.test(document.getElementById('cp-status').textContent));
    assert.match(await page.locator('#cp-status').innerText(), /CSS variables copied|--color-1:/);
    await record({ tool: 'color-palette-generator', lockedColorAndCssExport: true });
    await visit('uuid-generator'); await page.locator('#uuid-count').fill('3'); await page.locator('#uuid-generate').click();
    const identifiers = (await page.locator('#uuid-output').innerText()).trim().split(/\s+/);
    assert.equal(new Set(identifiers).size, 3);
    identifiers.forEach(id => assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i));
    await record({ tool: 'uuid-generator', versionAndVariantAndDistinctBatch: true });
    await visit('qr-code-generator'); await sample(); await page.locator('#qr-generate').click();
    const qrDownload = page.waitForEvent('download'); await page.locator('#qr-download').click();
    const qr = await qrDownload; await qr.saveAs(`${directory}/qr-code.png`);
    const image = await sharp(`${directory}/qr-code.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(jsQR(new Uint8ClampedArray(image.data), image.info.width, image.info.height)?.data, 'https://nevco.online/');
    await record({ tool: 'qr-code-generator', actualPngDecodedIndependently: true });
    await visit('pdf-merge');
    await page.locator('#pm-file-input').setInputFiles(['support', 'cover', 'application'].map(name => path.resolve(`frontend/assets/examples/pdf/${name}.pdf`)));
    await page.getByRole('button', { name: 'Move up: cover.pdf', exact: true }).click();
    await page.getByRole('button', { name: 'Move up: application.pdf', exact: true }).click();
    const pdfDownload = page.waitForEvent('download'); await page.locator('#pm-merge').click();
    const pdf = await pdfDownload; await pdf.saveAs(`${directory}/merged-example.pdf`);
    const result = await PDFDocument.load(fs.readFileSync(`${directory}/merged-example.pdf`));
    assert.deepEqual(result.getPages().map(page => [page.getWidth(), page.getHeight()]), [[420, 594], [400, 600], [401, 601], [360, 480]]);
    if (!live && !fs.existsSync('frontend/assets/examples/pdf/merged-example.pdf')) fs.copyFileSync(`${directory}/merged-example.pdf`, 'frontend/assets/examples/pdf/merged-example.pdf');
    await record({ tool: 'pdf-merge', actualDownloadedFourPageOrder: true });
    await visit('image-to-pdf');
    await page.locator('#ip-file-input').setInputFiles(path.resolve('frontend/assets/images/editorial/background-removal-input.png'));
    const imageDownload = page.waitForEvent('download'); await page.locator('#ip-convert').click();
    const converted = await imageDownload; await converted.saveAs(`${directory}/image-page.pdf`);
    const convertedDoc = await PDFDocument.load(fs.readFileSync(`${directory}/image-page.pdf`));
    assert.equal(convertedDoc.getPageCount(), 1);
    assert.deepEqual([convertedDoc.getPage(0).getWidth(), convertedDoc.getPage(0).getHeight()], [480, 360]);
    await record({ tool: 'image-to-pdf', actualPngPageDimensions: true });
    await visit('background-remover');
    const beforeInputModules = await page.evaluate(() => performance.getEntriesByType('resource').filter(item => /cdn\.jsdelivr\.net.*(?:imgly|onnxruntime)/.test(item.name)).length);
    assert.equal(beforeInputModules, 0, 'Background libraries must wait for image selection');
    await page.locator('#bg-file-input').setInputFiles(path.resolve('frontend/assets/images/editorial/background-removal-input.png'));
    await page.locator('#bg-download').waitFor({ state: 'visible', timeout: 180000 });
    const backgroundDownload = page.waitForEvent('download'); await page.locator('#bg-download').click();
    const background = await backgroundDownload; await background.saveAs(`${directory}/background-result.png`);
    const removal = await sharp(`${directory}/background-result.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual([removal.info.width, removal.info.height], [480, 360]);
    let clear = 0, opaque = 0;
    for (let i = 3; i < removal.data.length; i += 4) { if (removal.data[i] === 0) clear++; if (removal.data[i] === 255) opaque++; }
    assert.ok(clear > 0 && opaque > 0);
    await record({ tool: 'background-remover', librariesDeferredUntilInput: true, realModelAndDownloadedAlphaChannel: true, clearPixels: clear, opaquePixels: opaque });
    await visit('temp-mail');
    await page.waitForFunction(() => document.getElementById('tm-expiry').textContent.includes('remaining'));
    await record({ tool: 'temp-mail', syntheticServerExpiryDisplayed: true, realDeliveryTested: false });
    await page.close();
    }
    report.pages.sort((a, b) => a.route.localeCompare(b.route) || a.width - b.width);
    report.externalFontRequests = [...new Set(externalFontRequests)];
    report.failures = [...report.pages.filter(page => page.status !== 200 || page.h1 !== 1 || page.overflow || page.errors.length || page.brokenImages.length || page.violations.length), ...report.interactiveStates.filter(state => state.errors.length || state.violations.length)];
    const file = onlyRoutes ? `submission-targeted-pages-${live ? 'live' : 'local'}.json` : toolsOnly ? `submission-tool-states-${live ? 'live' : 'local'}.json` : live ? 'submission-pages-live.json' : 'submission-pages-local.json';
    const reportPath = process.argv.find(arg => arg.startsWith('--report='))?.slice('--report='.length) || `docs/audits/${file}`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
    const rules = {};
    report.failures.forEach(page => page.violations.forEach(item => { rules[item.id] = (rules[item.id] || 0) + 1; }));
    console.log(JSON.stringify({ scope: report.scope, pages: report.pages.length, functionalityCases: report.functionality.length, failedCases: report.failures.length, failedRules: rules }, null, 2));
    if (report.failures.length) process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => {
  report.error = error.message;
  fs.writeFileSync(`${directory}/browser-incomplete.json`, JSON.stringify(report, null, 2));
  console.error(error.message);
  process.exitCode = 1;
});
