// Review the completed articles in a real browser with site JavaScript disabled.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const express = require('express');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const { renderArticle } = require('../backend/src/lib/articles');
const posts = JSON.parse(fs.readFileSync('deployment/editorial-2026-10-04/completed-guides.json', 'utf8'));
const app = express();
let origin;
for (const post of posts) {
  app.get(`/journal/${post.slug}`, (_, res) => res.type('html').send(renderArticle({ ...post, published_at: '2026-09-29T00:00:00Z', updated_at: '2026-10-04T00:00:00Z' }, origin)));
  const image = post.key === 'temporary-email' ? 'temporary-email' : 'background-design';
  app.get(`/journal-images/${post.cover_image_id}`, (_, res) => res.type('image/webp').send(fs.readFileSync(`deployment/editorial-2026-10-04/references/${image}.webp`)));
}
app.use(express.static('frontend'));
let browser, server;
(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const context = await browser.newContext({ javaScriptEnabled: false });
  const results = [];
  for (const post of posts) {
    const page = await context.newPage();
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto(`${origin}/journal/${post.slug}`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      const result = await page.evaluate(() => ({
        width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
        h1: document.querySelectorAll('h1').length,
        coverLoaded: document.querySelector('.article-cover')?.naturalWidth > 0,
        textLength: document.querySelector('.article-content').textContent.length,
        visibleNav: getComputedStyle(document.querySelector('.main-nav')).display !== 'none',
        missingAnchors: [...document.querySelectorAll('.article-toc a')].filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash),
        tables: document.querySelectorAll('.article-content table').length
      }));
      assert.ok(result.scrollWidth <= width, `${post.key}: horizontal overflow at ${width}`);
      assert.equal(result.h1, 1); assert.ok(result.coverLoaded); assert.ok(result.textLength > 60000);
      assert.ok(result.visibleNav); assert.deepEqual(result.missingAnchors, []);
      results.push({ article: post.key, ...result });
      if (width !== 768) await page.screenshot({ path: `deployment/editorial-2026-10-04/preview/${post.key}-${width}.png` });
    }
    await page.close();
  }
  fs.writeFileSync('docs/audits/editorial-no-js.json', JSON.stringify({ javaScriptEnabled: false, cases: results }, null, 2) + '\n');
  console.log(`Passed ${results.length} article viewport checks with JavaScript disabled, including covers and section links.`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); });
