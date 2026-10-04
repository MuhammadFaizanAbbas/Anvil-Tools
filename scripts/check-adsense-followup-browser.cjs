// Local browser verification. --capture-examples also saves actual tool screenshots.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const express = require('express');
const sharp = require('sharp');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const { renderArticle } = require('../backend/src/lib/articles');
const library = require('../content/editorial/published-library.json');
const baseline = require('../docs/audits/editorial-cleanup-database.json');
const directory = path.resolve('deployment/adsense-followup-2026-10-05');
const capture = process.argv.includes('--capture-examples');
const images = path.resolve('frontend/assets/images/editorial');
const report = { checkedAt: new Date().toISOString(), localOnly: true, cases: [], limits: ['Emulated phone viewports, not a physical phone.', 'Inbox creation and retrieval only; no external email or contact submission sent.', 'Synthetic background-removal sample, not a difficult photograph.'] };

async function cached(url, name) {
  const file = path.join(directory, name);
  if (!fs.existsSync(file)) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`Fixture request failed: ${response.status}`);
    fs.writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  return file;
}

(async () => {
  fs.mkdirSync(directory, { recursive: true });
  if (capture) fs.mkdirSync(images, { recursive: true });
  const bundle = await cached('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js', 'pdf-lib.min.js');
  const { PDFDocument } = require(bundle);
  await Promise.all(library.map(guide => cached(`https://anvil-tools-backend.vercel.app/api/public/post-images/${guide.cover_image_id}`, `${guide.cover_image_id}.webp`)));
  const coverTypes = Object.fromEntries(await Promise.all(library.map(async guide => {
    const metadata = await sharp(path.join(directory, `${guide.cover_image_id}.webp`)).metadata();
    return [guide.cover_image_id, { svg: 'image/svg+xml', png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }[metadata.format]];
  })));
  const app = express();
  let origin;
  app.get('/journal/:slug', (req, res) => {
    const guide = library.find(row => row.slug === req.params.slug);
    if (!guide) return res.sendStatus(404);
    const post = { ...guide, ...baseline.published.find(row => row.slug === guide.slug), body: fs.readFileSync(`content/editorial/${guide.bodyFile}`, 'utf8').trim() };
    res.type('html').send(renderArticle(post, origin));
  });
  app.get('/journal-images/:id', (req, res) => {
    if (!library.some(guide => guide.cover_image_id === req.params.id)) return res.sendStatus(404);
    res.set('Content-Type', coverTypes[req.params.id]).sendFile(path.join(directory, `${req.params.id}.webp`));
  });
  app.use(express.static('frontend'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1024, height: 900 } });
    await context.route('**/pdf-lib.min.js', route => route.fulfill({ path: bundle, contentType: 'text/javascript' }));
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const makePdf = async (name, sizes) => {
      const pdf = await PDFDocument.create();
      sizes.forEach((size, index) => pdf.addPage(size).drawText(`${name} / ${index + 1}`, { x: 20, y: 30, size: 12 }));
      return { name, mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) };
    };
    const cover = await makePdf('cover.pdf', [[420, 594]]);
    const application = await makePdf('application.pdf', [[400, 600], [401, 601]]);
    const supporting = await makePdf('support.pdf', [[360, 480]]);
    await page.goto(`${origin}/tools/pdf-merge.html`, { waitUntil: 'networkidle' });
    await page.locator('#pm-file-input').setInputFiles([supporting, cover, application]);
    await page.getByRole('button', { name: 'Move up: application.pdf', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Move down: support.pdf', exact: true }).click();
    await page.getByRole('button', { name: 'Move up: cover.pdf', exact: true }).click();
    await page.getByRole('button', { name: 'Move up: cover.pdf', exact: true }).click();
    assert.deepEqual(await page.locator('#pm-file-list .file-name').allTextContents(), ['1. cover.pdf', '2. application.pdf', '3. support.pdf']);
    if (capture) await page.locator('.tool-app').screenshot({ path: path.join(images, 'pdf-ordering-example.png') });
    const mergeDownload = page.waitForEvent('download');
    await page.locator('#pm-merge').click();
    const merged = await mergeDownload;
    await merged.saveAs(path.join(directory, 'merged-document.pdf'));
    assert.equal(await merged.failure(), null);
    const document = await PDFDocument.load(fs.readFileSync(path.join(directory, 'merged-document.pdf')));
    assert.equal(document.getPageCount(), 4);
    assert.deepEqual(document.getPages().map(p => [p.getWidth(), p.getHeight()]), [[420, 594], [400, 600], [401, 601], [360, 480]]);
    report.cases.push({ tool: 'pdf-merge', download: true, pageCount: 4, orderVerifiedByPageDimensions: true, keyboardReorder: true });

    await page.locator('#pm-file-input').setInputFiles({ name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('invalid pdf') });
    await page.locator('#pm-merge').click();
    await page.waitForFunction(() => document.getElementById('pm-status').textContent.includes('Could not merge'));
    assert.equal(await page.locator('#pm-file-input').isEnabled(), true);
    await page.getByRole('button', { name: 'Remove: broken.pdf', exact: true }).click();
    report.cases.push({ tool: 'pdf-merge', corruptInputRejected: true, queueRestored: true });

    const imageFiles = await Promise.all([
      { name: 'one.png', mimeType: 'image/png', width: 120, height: 160, background: '#c42e34', format: 'png' },
      { name: 'two.jpg', mimeType: 'image/jpeg', width: 200, height: 140, background: '#3562cc', format: 'jpeg' },
      { name: 'three.webp', mimeType: 'image/webp', width: 180, height: 220, background: '#299367', format: 'webp' }
    ].map(async image => ({ ...image, buffer: await sharp({ create: { width: image.width, height: image.height, channels: 3, background: image.background } }).toFormat(image.format).toBuffer() })));
    await page.goto(`${origin}/tools/image-to-pdf.html`, { waitUntil: 'networkidle' });
    await page.locator('#ip-file-input').setInputFiles(imageFiles.map(({ name, mimeType, buffer }) => ({ name, mimeType, buffer })));
    await page.getByRole('button', { name: 'Move up: three.webp', exact: true }).click();
    await page.getByRole('button', { name: 'Remove: one.png', exact: true }).click();
    const imageDownload = page.waitForEvent('download');
    await page.locator('#ip-convert').click();
    const converted = await imageDownload;
    await converted.saveAs(path.join(directory, 'images-to-pdf.pdf'));
    const imagePdf = await PDFDocument.load(fs.readFileSync(path.join(directory, 'images-to-pdf.pdf')));
    assert.equal(imagePdf.getPageCount(), 2);
    assert.deepEqual(imagePdf.getPages().map(p => [p.getWidth(), p.getHeight()]), [[180, 220], [200, 140]]);
    report.cases.push({ tool: 'image-to-pdf', download: true, formats: ['PNG preview', 'JPEG embedding', 'WebP conversion'], remove: true, orderVerifiedByPageDimensions: true });

    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"><defs><linearGradient id="m"><stop stop-color="#284b73"/><stop offset="1" stop-color="#6089ac"/></linearGradient></defs><rect width="480" height="360" fill="#efddc5"/><rect y="278" width="480" height="82" fill="#bba48b"/><ellipse cx="233" cy="283" rx="123" ry="17" fill="#73634f" opacity=".28"/><path d="M309 135h29c62 0 62 115 0 115h-29" fill="none" stroke="#426a91" stroke-width="23"/><path d="M128 109h187v135q0 45-94 45t-93-45z" fill="url(#m)"/><ellipse cx="221" cy="109" rx="94" ry="22" fill="#87a6bd"/><ellipse cx="221" cy="109" rx="77" ry="13" fill="#2c3845"/><path d="M147 143v89" stroke="#a9c6da" stroke-width="9" stroke-linecap="round" opacity=".7"/></svg>';
    const mug = await sharp(Buffer.from(svg)).png().toBuffer();
    if (capture) fs.writeFileSync(path.join(images, 'background-removal-input.png'), mug);
    await page.goto(`${origin}/tools/background-remover.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.removeBackgroundLib === 'function');
    await page.locator('#bg-file-input').setInputFiles({ name: 'synthetic-mug.png', mimeType: 'image/png', buffer: mug });
    await page.locator('#bg-download').waitFor({ state: 'visible', timeout: 120000 });
    assert.equal(await page.locator('#bg-preview img').count(), 2);
    if (capture) await page.locator('.tool-app').screenshot({ path: path.join(images, 'background-removal-example.png') });
    const bgDownload = page.waitForEvent('download');
    await page.locator('#bg-download').click();
    const cutout = await bgDownload;
    await cutout.saveAs(path.join(directory, 'synthetic-mug-cutout.png'));
    if (capture) fs.copyFileSync(path.join(directory, 'synthetic-mug-cutout.png'), path.join(images, 'background-removal-output.png'));
    const info = await sharp(path.join(directory, 'synthetic-mug-cutout.png')).metadata();
    assert.equal(info.width, 480); assert.equal(info.height, 360); assert.equal(info.hasAlpha, true);
    const { data } = await sharp(path.join(directory, 'synthetic-mug-cutout.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let transparent = 0, opaque = 0;
    for (let index = 3; index < data.length; index += 4) { if (data[index] === 0) transparent++; if (data[index] === 255) opaque++; }
    assert.ok(transparent > 0 && opaque > 0);
    report.cases.push({ tool: 'background-remover', actualModel: true, dimensions: [info.width, info.height], transparentPixels: transparent, opaquePixels: opaque });

    // Creates and reads an inbox; never sends a message to an external person/service.
    await context.route('http://localhost:3000/api/temp-mail/**', async route => {
      const request = route.request();
      const target = request.url().replace('http://localhost:3000', 'https://anvil-tools-backend.vercel.app');
      const response = await fetch(target, { method: request.method(), headers: { 'Content-Type': 'application/json' }, body: request.postData() || undefined, signal: AbortSignal.timeout(20000) });
      await route.fulfill({ status: response.status, contentType: 'application/json', body: await response.text() });
    });
    await page.goto(`${origin}/tools/temp-mail.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.getElementById('tm-address').textContent.includes('@'), { timeout: 30000 });
    assert.equal(await page.locator('#tm-copy').isEnabled(), true);
    await page.locator('#tm-refresh').click();
    await page.waitForFunction(() => !document.getElementById('tm-refresh').disabled);
    if (capture) await page.locator('.temp-mail-console').screenshot({ path: path.join(images, 'temporary-email-example.png') });
    report.cases.push({ tool: 'temp-mail', liveAddressCreated: true, inboxRefresh: true, externalDeliveryTested: false });

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const slug of ['pdf-merge', 'image-to-pdf', 'temp-mail']) {
        await page.goto(`${origin}/tools/${slug}.html`, { waitUntil: 'networkidle' });
        if (slug === 'pdf-merge') await page.locator('#pm-file-input').setInputFiles([cover, application]);
        if (slug === 'image-to-pdf') await page.locator('#ip-file-input').setInputFiles(imageFiles.slice(0, 2).map(({ name, mimeType, buffer }) => ({ name, mimeType, buffer })));
        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        assert.ok(scrollWidth <= width, `${slug} overflows at ${width}: ${scrollWidth}`);
        if (width === 320) {
          await page.locator('.nav-toggle').click();
          assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'), 'true');
        }
        report.cases.push({ tool: slug, width, noHorizontalOverflow: true });
      }
    }
    const noJs = await browser.newContext({ javaScriptEnabled: false });
    const articlePage = await noJs.newPage();
    for (const width of [320, 768, 1440]) {
      await articlePage.setViewportSize({ width, height: 900 });
      for (const guide of library) {
        await articlePage.goto(`${origin}/journal/${guide.slug}`, { waitUntil: 'networkidle' });
        assert.equal(await articlePage.locator('h1').count(), 1);
        const layout = await articlePage.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth,
          brokenImages: [...document.querySelectorAll('.article-cover, .article-content img')].filter(img => !img.complete || !img.naturalWidth).length,
          missingAnchors: [...document.querySelectorAll('.article-toc a')].filter(a => !document.getElementById(a.hash.slice(1))).length }));
        // Scroll lazy images into view before validating their actual loads.
        for (const img of await articlePage.locator('.article-content img').all()) await img.scrollIntoViewIfNeeded();
        await articlePage.waitForFunction(() => [...document.querySelectorAll('.article-cover, .article-content img')].every(img => img.complete && img.naturalWidth > 0));
        assert.ok(layout.scrollWidth <= width, `${guide.key} overflows at ${width}`);
        assert.equal(layout.missingAnchors, 0);
        report.cases.push({ guide: guide.key, width, javaScriptEnabled: false, imagesLoaded: true, anchorsValid: true, noHorizontalOverflow: true });
      }
    }
    assert.deepEqual(errors, []);
    report.status = 'passed';
    console.log(`Passed ${report.cases.length} tool and article browser cases.`);
  } finally {
    fs.writeFileSync('docs/audits/adsense-followup-browser.json', JSON.stringify(report, null, 2) + '\n');
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
