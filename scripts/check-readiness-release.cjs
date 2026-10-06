const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const express = require('express');
const { renderBlog } = require('../backend/src/lib/blog');
const experiments = require('../content/editorial/experiments.json');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const axeSource = fs.readFileSync('deployment/browser-check/node_modules/axe-core/axe.min.js', 'utf8');
const report = { checkedAt: new Date().toISOString(), scope: 'local release; synthetic API responses', checks: [] };
let browser, server;
(async () => {
  let mode = 'success';
  const posts = Array.from({ length: 35 }, (_, index) => ({ slug: `synthetic-article-${index}`, title: `Synthetic article ${index}`, excerpt: 'Local navigation fixture.' }));
  const app = express();
  let origin;
  app.get(['/blog','/blog/','/blog/index.html'], (req, res) => {
    const page = Number(req.query.page || 1);
    const chosen = mode === 'pagination' ? posts.slice((page-1)*30, page*30) : posts.slice(0,4);
    res.type('html').send(renderBlog(chosen, origin, { page, hasNext: mode === 'pagination' && page === 1, unavailable: mode === 'failure' }));
  });
  // Mirror cPanel's static origin replacement without needing an Apache server.
  app.use((req, res, next) => {
    if (!req.path.endsWith('.html') && req.path !== '/') return next();
    const file = path.resolve('frontend', '.' + (req.path === '/' ? '/index.html' : req.path));
    if (!file.startsWith(path.resolve('frontend') + path.sep) || !fs.existsSync(file)) return next();
    res.type('html').send(fs.readFileSync(file, 'utf8').replaceAll('https://anviltools.vercel.app', origin));
  });
  app.use(express.static('frontend'));
  server = app.listen(0,'127.0.0.1'); await new Promise(resolve => server.once('listening',resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  const record = (name, detail = {}) => { report.checks.push({ name, ...detail, passed: true }); console.log(name); };

  const initial = await (await fetch(origin + '/blog/index.html')).text();
  assert.doesNotMatch(initial,/Try again|id="blogPagination"|Previous|Page 1|>Next</);
  for (const item of experiments) assert.ok(initial.includes(`/blog/${item.slug}.html`));
  record('Successful one-page blog HTML omits retry and pagination; four experiments are crawlable');
  const renderer = path.resolve('frontend/blog-render.php').replaceAll('\\','/');
  const template = path.resolve('frontend/blog/index.html').replaceAll('\\','/');
  const data = Buffer.from(JSON.stringify(posts.slice(0,4))).toString('base64');
  for (const failed of [false,true]) {
    const html = execFileSync(process.env.PHP_PATH || 'php', ['-r', `require '${renderer}'; echo render_blog_index(file_get_contents('${template}'), json_decode(base64_decode('${data}'),true), 'https://nevco.online', 1, false, ${failed ? 'true':'false'});`], {encoding:'utf8'});
    assert.equal(html.includes('Try again'), failed);
    assert.equal(html.includes('id="blogPagination"'), failed);
  }
  record('PHP renderer only emits retry after a real failure');

  browser = await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const context = await browser.newContext();
  await context.route('**/api/public/posts*', route => route.fulfill({status:200,contentType:'application/json',headers:{'X-Total-Count':'4'},body:JSON.stringify(posts.slice(0,4))}));
  const page = await context.newPage();
  const pageErrors = []; page.on('pageerror',error=>pageErrors.push(error.message));
  mode = 'failure'; await page.goto(origin+'/blog/index.html');
  await page.waitForFunction(()=>document.querySelectorAll('#publishedGuideCards article').length===4);
  assert.equal(await page.locator('#blogsRetry').count(),0);
  record('Successful recovery removes the retry button from the DOM');
  mode = 'pagination'; await page.goto(origin+'/blog/index.html');
  const next = await page.locator('#blogsNext').getAttribute('href'); assert.equal(next,'/blog/index.html?page=2');
  await page.locator('#blogsNext').click();
  assert.equal(new URL(page.url()).search,'?page=2');
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),origin+'/blog/index.html?page=2');
  assert.equal(await page.locator('#publishedGuideCards article').count(),5);
  record('Normal Next link loads a fresh page with correct canonical and five remaining articles');
  mode = 'success';
  const pages = ['/blog/index.html','/about.html','/privacy-policy.html',...experiments.map(item=>`/blog/${item.slug}.html`),...experiments.flatMap(item=>item.tools.map(tool=>`/tools/${tool}.html`))];
  for (const width of [320,390,1440]) {
    await page.setViewportSize({width,height:900});
    for (const route of pages) {
      assert.equal((await page.goto(origin+route)).status(),200);
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} at ${width}px`);
      await page.addScriptTag({content:axeSource});
      const violations = await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(item=>({id:item.id,nodes:item.nodes.length})));
      assert.deepEqual(violations,[],`${route} at ${width}px`);
      record('Responsive and axe check', {route,width});
    }
  }
  assert.deepEqual(pageErrors,[]);
  const noJS = await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const plain = await noJS.newPage(); await plain.goto(origin+'/blog/index.html');
  for (const item of experiments) {
    await plain.locator(`a[href="/blog/${item.slug}.html"]`).first().click();
    assert.ok((await plain.locator('.article-content').innerText()).length>3000);
    await plain.goto(origin+'/blog/index.html');
  }
  record('All four experiments remain readable and navigable without JavaScript');
  for (const item of experiments) {
    const html = fs.readFileSync(`frontend/blog/${item.slug}.html`,'utf8');
    for (const match of html.matchAll(/(?:href|src)="(\/assets\/[^"]+)"/g)) {
      const url = new URL(match[1],origin); assert.equal((await fetch(url)).status,200,url.pathname);
    }
  }
  record('Every local asset and fixture linked from the four experiments responds successfully');
  await noJS.close(); await context.close();
  fs.writeFileSync('docs/audits/readiness-browser.json',JSON.stringify(report,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{
  if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));
});
