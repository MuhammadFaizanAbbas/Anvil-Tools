// Check the actual rendered article-link character and truthful policy pages.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const express = require('express');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const remote = process.argv[2];
const report = { checkedAt: new Date().toISOString(), origin: remote || 'local', cases: [] };

(async () => {
  let server, browser;
  try {
    let origin = remote;
    if (!origin) {
      const app = express();
      app.use(express.static('frontend'));
      server = app.listen(0, '127.0.0.1');
      await new Promise(resolve => server.once('listening', resolve));
      origin = `http://127.0.0.1:${server.address().port}`;
    } else {
      const url = new URL(origin);
      assert.ok(['https:', 'http:'].includes(url.protocol) && !url.username && !url.password);
      origin = url.origin;
    }
    browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    for (const width of [320, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      if (!remote) await page.addInitScript(() => {
        window.ANVIL_CONFIG = { SITE_URL: location.origin, API_BASE_URL: 'https://anvil-tools-backend.vercel.app' };
      });
      const adRequests = [];
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (/adsbygoogle|fundingchoicesmessages|doubleclick\.net/.test(request.url())) adRequests.push(request.url());
      });
      await page.goto(origin, { waitUntil: 'domcontentloaded' });
      const links = page.locator('#suggested-guides .tool-link');
      await links.first().waitFor();
      const text = await links.allTextContents();
      assert.ok(text.length > 0 && text.every(label => label === 'Read article →'));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      report.cases.push({ path: '/', width, articleLinks: text.length, correctArrow: true, noHorizontalOverflow: true });
      for (const path of ['/privacy-policy.html', '/cookie-policy.html']) {
        const response = await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
        assert.equal(response.status(), 200);
        await page.getByRole('heading', { name: 'If Google advertising is introduced', exact: true }).waitFor();
        const body = await page.locator('main').innerText();
        assert.match(body, /Advertising and automatic browser analytics are (?:currently )?disabled/);
        assert.match(body, /Google-certified consent management platform/);
        assert.match(body, /October 5, 2026/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        report.cases.push({ path, width, currentDisabledState: true, futureGoogleDisclosure: true, noHorizontalOverflow: true });
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(adRequests, []);
      await page.close();
    }
    report.automaticAdRequestsObserved = false;
    const file = remote ? 'adsense-presentation-live.json' : 'adsense-presentation-local.json';
    fs.writeFileSync(`docs/audits/${file}`, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
