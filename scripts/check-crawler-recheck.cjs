// Fresh output evidence. Inbox/contact responses are fixtures; no message is sent.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const express = require('express');
const sharp = require('sharp');
const { chromium } = require('../deployment/browser-check/node_modules/playwright');
const jsQR = require('../deployment/browser-check/node_modules/jsqr');
const { renderArticle } = require('../backend/src/lib/articles');
const { renderBlog } = require('../backend/src/lib/blog');
const library = require('../content/editorial/published-library.json');
const baselines = require('../deployment/crawler-recheck-2026-10-05/database-before.json');
const { PDFDocument } = require('../deployment/adsense-followup-2026-10-05/pdf-lib.min.js');
const folder = 'deployment/crawler-recheck-2026-10-05';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const edgePath = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const photoOnly = process.argv.includes('--photo-only');
const report = { checkedAt: new Date().toISOString(), scope: 'local prepared release', cases: [], outputs: [], limits: ['Phone viewports/touch are emulated; no physical phone or print scan.', 'QR decoded with jsQR; physical scanning remains separate.', 'Mail and contact are synthetic UI checks; no external message, SMTP acceptance, receipt, or reply tested.', 'One licensed photograph does not establish general model quality.'] };
const record = (name, details = {}) => { report.cases.push({ name, passed: true, ...details }); fs.writeFileSync('docs/audits/crawler-recheck-browser.json', JSON.stringify(report, null, 2) + '\n'); console.log(name); };
let origin, server;
async function output(page, trigger, name) { const event = page.waitForEvent('download'); await trigger(); const download = await event; await download.saveAs(`${folder}/${name}`); report.outputs.push({ file: name, sha256: createHash('sha256').update(fs.readFileSync(`${folder}/${name}`)).digest('hex') }); return `${folder}/${name}`; }
async function context(browser) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 }, hasTouch: true });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin });
  await ctx.route('**/api/public/recommendations*', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(library) }));
  await ctx.route('**/pdf-lib.min.js', route => route.fulfill({ path: 'deployment/adsense-followup-2026-10-05/pdf-lib.min.js', contentType: 'text/javascript' }));
  await ctx.route('**/qrcode.min.js', route => route.fulfill({ path: 'deployment/page-review-2026-10-05/qrcode.min.js', contentType: 'text/javascript' }));
  return ctx;
}
async function pdfChecks(browser, brand) {
  const ctx = await context(browser), page = await ctx.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${origin}/tools/pdf-merge.html`);
  await page.locator('#pm-file-input').setInputFiles(['support', 'cover', 'application'].map(name => path.resolve(`frontend/assets/examples/pdf/${name}.pdf`)));
  await page.getByRole('button', { name: 'Move up: cover.pdf', exact: true }).click(); await page.getByRole('button', { name: 'Move up: application.pdf', exact: true }).click();
  const merged = await output(page, () => page.locator('#pm-merge').click(), `merge-${brand}.pdf`);
  const doc = await PDFDocument.load(fs.readFileSync(merged)); assert.deepEqual(doc.getPages().map(p => [p.getWidth(),p.getHeight()]), [[420,594],[400,600],[401,601],[360,480]]);
  await page.goto(`${origin}/tools/image-to-pdf.html`);
  await page.locator('#ip-file-input').setInputFiles([path.resolve('frontend/assets/images/editorial/background-removal-input.png'), path.resolve('frontend/assets/examples/images/mug-photo.webp')]);
  const converted = await output(page, () => page.locator('#ip-convert').click(), `mixed-images-${brand}.pdf`);
  const images = await PDFDocument.load(fs.readFileSync(converted)); assert.deepEqual(images.getPages().map(p => [p.getWidth(),p.getHeight()]), [[480,360],[480,640]]);
  await page.goto(`${origin}/tools/password-generator.html`);
  for (const length of [6,48]) { await page.locator('#pw-length').fill(String(length)); await page.locator('#pw-generate').click(); assert.equal((await page.locator('#pw-output').innerText()).length,length); }
  await page.locator('#pw-copy').click(); assert.equal((await page.evaluate(() => navigator.clipboard.readText())).length,48);
  await page.goto(`${origin}/tools/color-palette-generator.html`); await page.locator('#cp-export').click(); const css = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(css,/--color-1: #[0-9A-F]{6}/); await page.addStyleTag({ content: css + '\n#palette-fixture { background: var(--color-1); }' });
  const pair = await page.evaluate(() => { const el=document.createElement('div');el.id='palette-fixture';document.body.append(el); const bg=getComputedStyle(el).backgroundColor,preview=getComputedStyle(document.querySelector('.palette-preview'));return { bg,preview:preview.backgroundColor,text:preview.color,label:document.querySelector('.palette-preview').textContent }; });
  assert.equal(pair.bg,pair.preview); assert.match(pair.label,/Contrast [\d.]+:1 with #[0-9A-F]{6}/);
  assert.deepEqual(errors, []); record(`Fresh downloads, password boundaries/copy, and exported CSS in ${brand}`, { pdfPages: 4, mixedImagePages: 2, mixedDimensions: [[480,360],[480,640]], contrastPair: pair }); await ctx.close();
}
(async () => {
  fs.mkdirSync(folder,{recursive:true}); const app=express();
  app.get('/journal/:slug',(req,res)=>{const guide=library.find(g=>g.slug===req.params.slug);if(!guide)return res.sendStatus(404);res.type('html').send(renderArticle({...baselines.find(p=>p.slug===guide.slug),body:fs.readFileSync(`content/editorial/${guide.bodyFile}`,'utf8')},origin));});
  app.get(['/blog/','/blog/index.html'],(req,res)=>res.type('html').send(renderBlog(library,origin)));
  app.get('/journal-images/:id',(req,res)=>res.sendFile(path.resolve(`deployment/adsense-followup-2026-10-05/${req.params.id}.webp`)));
  app.use(express.static('frontend'));app.use((req,res)=>res.status(404).sendFile(path.resolve('frontend/404.html')));
  server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));origin=`http://127.0.0.1:${server.address().port}`;
  console.log(`Output review server: ${origin}`);
  if (!photoOnly) for (const [brand, executablePath] of [['chrome',chromePath],['edge',edgePath]]) {
    console.log(`Opening ${brand}.`); const browser=await chromium.launch({executablePath,headless:true,timeout:45000});
    try { await pdfChecks(browser,brand); } finally { await browser.close(); }
  }
  const browser=await chromium.launch({executablePath:chromePath,headless:true,timeout:45000});
  try {
    const ctx=await context(browser),page=await ctx.newPage();
    if (!photoOnly) {
    for(const width of [320,390,768,1440]){
      await page.setViewportSize({width,height:900});await page.goto(`${origin}/tools/index.html`);assert.equal(await page.locator('input[type=search]').count(),1);
      for (const [category,query,count] of [['Generators','',5],['Generators','JSON',0],['Generators','',5],['','',20],['','JSON',2]]) {await page.locator('#tool-category').selectOption(category);await page.locator('#tool-search').fill(query);assert.equal(await page.locator('[data-directory-tool]:visible').count(),count);assert.match(await page.locator('#tool-results').innerText(),count?new RegExp(`^${count} of 20`):/No matching tools/);}
      if(width<761){await page.locator('.nav-toggle').tap();assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'true');await page.keyboard.press('Escape');assert.equal(await page.locator('.nav-toggle').getAttribute('aria-expanded'),'false');}
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false); record(`One directory controller and accurate intersection/count at ${width}px`);
    }
    const visit=slug=>page.goto(`${origin}/tools/${slug}.html`);
    await visit('csv-to-json');await page.locator('#csv-input').fill(fs.readFileSync('frontend/assets/examples/developer/quoted-newline.csv','utf8'));await page.locator('#csv-headers').check();await page.locator('#csv-convert').click();assert.deepEqual(JSON.parse(await page.locator('#csv-output').innerText()),JSON.parse(fs.readFileSync('frontend/assets/examples/developer/expected.json','utf8')));
    await page.locator('#csv-input').fill('id,id\n001,002');await page.locator('#csv-convert').click();assert.equal(await page.locator('#csv-status').innerText(),'Header names must be unique.');record('Quoted newline, comma, escaped quotes, and duplicate-header rejection');
    await visit('json-formatter');for(const [input,expected] of [['{"id":1,"id":2}','{"id":2}'],['{"id":9007199254740993}','{"id":9007199254740992}']]){await page.locator('#jf-input').fill(input);await page.locator('#jf-minify').click();assert.equal(await page.locator('#jf-output').innerText(),expected);}record('Visible duplicate-key and unsafe-integer before/after outputs');
    await visit('jwt-decoder');await page.locator('#jwt-input').fill('abc.def');await page.locator('#jwt-decode').click();assert.match(await page.locator('#jwt-status').innerText(),/compact JWT/);assert.equal(await page.locator('#jwt-payload').innerText(),'');record('Malformed synthetic JWT clears earlier output');
    await visit('url-encoder-decoder');await page.locator('#url-mode').selectOption('component');await page.locator('#url-input').fill('a+b%20c');await page.locator('#url-decode').click();assert.equal(await page.locator('#url-output').innerText(),'a+b c');await page.locator('#url-input').fill('%ZZ');await page.locator('#url-decode').click();assert.match(await page.locator('#url-status').innerText(),/malformed percent/);assert.equal(await page.locator('#url-output').innerText(),'');record('Plus stays plus; malformed percent input rejects and clears output');
    await visit('text-case-converter');await page.locator('#case-input').fill('NASA report: café');for(const [mode,expected] of [['sentence','Nasa report: café'],['title','Nasa Report: Café'],['camel','nasaReportCafé']]){await page.locator(`[data-case=${mode}]`).click();assert.equal(await page.locator('#case-output').inputValue(),expected);}record('Unicode/acronym outputs in three case modes');
    await visit('word-counter');await page.locator('#wc-input').fill('你好世界');assert.equal(await page.locator('#wc-words').innerText(),'1');assert.equal(await page.locator('#wc-chars').innerText(),'4');record('Non-space-delimited language demonstrates whitespace-count limitation');
    await visit('qr-code-generator');await page.locator('#qr-input').fill('https://nevco.online/');await page.locator('#qr-generate').click();const qr=await output(page,()=>page.locator('#qr-download').click(),'qr-code.png');const pixels=await sharp(qr).ensureAlpha().raw().toBuffer({resolveWithObject:true});assert.equal(jsQR(new Uint8ClampedArray(pixels.data),pixels.info.width,pixels.info.height)?.data,'https://nevco.online/');
    const print=await PDFDocument.create();const printPage=print.addPage([595,842]);const qrImage=await print.embedPng(fs.readFileSync(qr));printPage.drawRectangle({x:185,y:385,width:220,height:220,color:require('../deployment/adsense-followup-2026-10-05/pdf-lib.min.js').rgb(1,1,1)});printPage.drawImage(qrImage,{x:205,y:405,width:180,height:180});printPage.drawText('Expected: https://nevco.online/',{x:100,y:350,size:14});fs.writeFileSync('frontend/assets/examples/qr-print-check.pdf',await print.save());record('Fresh downloaded QR independently decoded; physical print fixture prepared');
    }
    await page.setViewportSize({width:390,height:844});await page.goto(`${origin}/tools/background-remover.html`);assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/imgly|onnxruntime|resources\.json/.test(r.name)).length),0);
    console.log('Starting licensed-photograph model test.');
    page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
    const started=Date.now();await page.locator('#bg-file-input').setInputFiles(path.resolve('frontend/assets/examples/images/mug-photo.jpg'));await page.locator('#bg-download').waitFor({state:'visible',timeout:180000});const coldMs=Date.now()-started;
    const removed=await output(page,()=>page.locator('#bg-download').click(),'mug-photo-output.png');fs.copyFileSync(removed,'frontend/assets/examples/images/mug-photo-output.png');const alpha=await sharp(removed).ensureAlpha().raw().toBuffer({resolveWithObject:true});let transparent=0,opaque=0,maxAlpha=0;for(let i=3;i<alpha.data.length;i+=4){if(alpha.data[i]===0)transparent++;if(alpha.data[i]>=240)opaque++;maxAlpha=Math.max(maxAlpha,alpha.data[i]);}assert.ok(transparent&&opaque,'Expected transparent background and substantially opaque subject pixels');assert.deepEqual([alpha.info.width,alpha.info.height],[960,1280]);
    const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>r.name.includes('/assets/vendor/background-removal/')).map(r=>({path:new URL(r.name).pathname,encodedBodySize:r.encodedBodySize,transferSize:r.transferSize})));
    await page.screenshot({path:`${folder}/mug-photo-browser.png`,fullPage:true});await ctx.close();record('Licensed product photograph processed with real lazy-loaded model on emulated phone', {coldMs,dimensions:[960,1280],transparentPixels:transparent,substantiallyOpaquePixels:opaque,maxAlpha,resources,visualQuality:'pending independent visual inspection'});
    const nojs=await browser.newContext({javaScriptEnabled:false});const plain=await nojs.newPage();await plain.goto(origin+'/tools/index.html');assert.equal(await plain.locator('[data-directory-tool]:visible').count(),20);await plain.goto(origin+'/journal/'+library[0].slug);assert.ok(await plain.locator('.article-content h2').count()>3);assert.equal(await plain.locator('h1').count(),1);await nojs.close();record('Directory cards and complete guide hierarchy work without JavaScript');
  } finally {await browser.close();}
  report.completedAt=new Date().toISOString();fs.writeFileSync('docs/audits/crawler-recheck-browser.json',JSON.stringify(report,null,2)+'\n');
})().catch(error=>{report.error=error.message;fs.writeFileSync('docs/audits/crawler-recheck-browser.json',JSON.stringify(report,null,2)+'\n');console.error(error);process.exitCode=1;}).finally(async()=>{if(server)await new Promise(resolve=>server.close(resolve));});
