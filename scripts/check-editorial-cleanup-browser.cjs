const fs = require('node:fs');
const assert = require('node:assert/strict');
const express = require('../node_modules/express');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const { renderArticle } = require('../backend/src/lib/articles');
const { renderBlog } = require('../backend/src/lib/blog');
const library = require('../content/editorial/published-library.json');
const verification = require('../docs/audits/editorial-cleanup-database.json');
(async () => {
  const app = express(); let origin;
  const posts = library.map(guide => ({ ...guide, ...verification.published.find(row => row.slug === guide.slug), body: fs.readFileSync('content/editorial/' + guide.bodyFile, 'utf8').trim() }));
  app.get('/journal/:slug', (req, res) => res.send(renderArticle(posts.find(row => row.slug === req.params.slug), origin)));
  app.get('/blog/index.html', (req, res) => res.send(renderBlog(posts, origin)));
  app.get('/journal-images/:id', async (req, res) => {
    const response = await fetch('https://anvil-tools-backend.vercel.app/api/public/post-images/' + req.params.id);
    res.status(response.status).type(response.headers.get('content-type')).send(Buffer.from(await response.arrayBuffer()));
  });
  app.use(express.static('frontend'));
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  const cases = [];
  try {
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ javaScriptEnabled: false });
    for (const width of [320, 768, 1440]) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 1000 });
      for (const post of posts) {
        const response = await page.goto(origin + '/journal/' + post.slug, { waitUntil: 'networkidle' });
        assert.equal(response.status(), 200);
        assert.equal(await page.locator('h1').count(), 1);
        assert.ok(await page.locator('.article-content').innerText());
        const data = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          coverLoaded: document.querySelector('.article-cover').naturalWidth > 0,
          missingAnchors: [...document.querySelectorAll('.article-toc a')].filter(link => !document.getElementById(link.hash.slice(1))).length,
          versionedStyles: [...document.querySelectorAll('link[rel=stylesheet]')].filter(link => link.href.includes('/assets/css/')).every(link => link.href.includes('?v=20261004-css'))
        }));
        assert.ok(data.scrollWidth <= width, JSON.stringify({ slug: post.slug, width, ...data }));
        assert.ok(data.coverLoaded && data.versionedStyles);
        assert.equal(data.missingAnchors, 0);
        cases.push({ slug: post.slug, width, ...data });
      }
      await page.goto(origin + '/blog/index.html', { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.tool-card').count(), 4);
      assert.equal(await page.locator('.editorial-library').count(), 0);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      cases.push({ page: 'blog', width, cards: 4, duplicateLibrary: false });
      await page.close();
    }
    fs.writeFileSync('docs/audits/editorial-cleanup-browser.json', JSON.stringify({ checkedAt: new Date().toISOString(), javaScriptEnabled: false, cases }, null, 2) + '\n');
    console.log('Passed all ' + cases.length + ' article and listing layout checks without JavaScript.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
