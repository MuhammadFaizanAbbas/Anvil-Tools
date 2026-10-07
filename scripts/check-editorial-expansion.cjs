const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const sharp = require('sharp');
const release = require('../content/editorial/release-2026-10-07.json');
const output = { checkedAt: new Date().toISOString(), hosts: [], fixtures: [] };
const origins = process.argv.slice(2).length ? process.argv.slice(2) : ['https://nevco.online', 'https://anviltools.vercel.app'];
const get = url => fetch(url, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) });
(async () => {
  for (const origin of origins) {
    const articles = await Promise.all(release.covers.map(async cover => {
      const response = await get(`${origin}/journal/${cover.slug}`); assert.equal(response.status, 200, cover.slug);
      assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag') || ''));
      const html = await response.text(); assert.ok(html.includes(`rel="canonical" href="${origin}/journal/${cover.slug}"`));
      assert.ok(html.includes(`/journal-images/${cover.id}`)); assert.ok(html.includes(cover.alt));
      assert.doesNotMatch(html,/adsbygoogle|pagead2\.googlesyndication|ad-placeholder/);
      const post = release.posts.find(post => post.slug === cover.slug);
      if (post) {
        assert.ok(html.includes(`<h1>${post.title}</h1>`)); assert.ok(html.includes('class="article-toc"'));
        for (const file of ['cases.json', 'results.json', 'tool-run.png']) assert.ok(html.includes(`/experiment-assets/${post.key.startsWith('url') ? 'url-encoding' : 'sha256'}/${file}`));
      }
      const coverUrl = html.match(/<img class="article-cover" src="([^"]+)"/)?.[1];
      assert.equal(coverUrl, `${origin}/journal-images/${cover.id}?v=${cover.sha256.slice(0,12)}`);
      const image = await get(coverUrl); assert.equal(image.status, 200); assert.match(image.headers.get('content-type'), /image\/webp/);
      const bytes = Buffer.from(await image.arrayBuffer()); assert.equal(createHash('sha256').update(bytes).digest('hex'), cover.sha256);
      const dimensions = await sharp(bytes).metadata(); assert.equal(dimensions.width,cover.width); assert.equal(dimensions.height,cover.height);
      return { slug: cover.slug, status: response.status, canonicalCorrect: true, coverUrl, coverStatus: image.status, mime: image.headers.get('content-type'), width: dimensions.width, height: dimensions.height, coverBytesMatch: true };
    }));
    const [hub, sitemap, staticMap] = await Promise.all([get(`${origin}/blog/index.html`),get(`${origin}/journal-sitemap.xml`),get(`${origin}/sitemap.xml`)]);
    assert.equal(hub.status,200); assert.equal(sitemap.status,200); assert.equal(staticMap.status,200);
    const hubHtml = await hub.text(), xml = await sitemap.text(), staticXml = await staticMap.text();
    for (const post of release.posts) { assert.ok(hubHtml.includes(`/journal/${post.slug}`)); assert.ok(xml.includes(`${origin}/journal/${post.slug}`)); }
    const dynamicUrls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
    const staticUrls = [...staticXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
    assert.equal(dynamicUrls.length,6); assert.equal(staticUrls.length,39); assert.equal(new Set([...dynamicUrls,...staticUrls]).size,45);
    assert.ok([...dynamicUrls,...staticUrls].every(url=>url.startsWith(origin+'/')&&!url.includes('/assets/')));
    output.hosts.push({ origin, articles, hubContainsNewArticles: true, staticUrls: staticUrls.length, dynamicUrls: dynamicUrls.length, totalPublicPages: 45 });
    console.log(`${origin}: four covers match, both new articles/hub/sitemap passed, 45 public pages.`);
  }
  for (const group of ['url-encoding', 'sha256']) for (const file of ['cases.json','results.json','tool-run.png']) {
    const url = `https://anvil-tools-backend.vercel.app/api/public/experiment-assets/${group}/${file}`;
    const response = await get(url); assert.equal(response.status,200,url);
    const bytes=Buffer.from(await response.arrayBuffer()); assert.deepEqual(bytes,fs.readFileSync(`backend/assets/experiments/${group}/${file}`));
    if(file.endsWith('.json'))JSON.parse(bytes.toString('utf8'));else assert.equal((await sharp(bytes).metadata()).format,'png');
    output.fixtures.push({url,status:response.status,mime:response.headers.get('content-type'),bytesMatch:true});
  }
  output.passed=true;
})().catch(error=>{output.passed=false;output.failure=error.message;console.error(error.message);process.exitCode=1;}).finally(()=>fs.writeFileSync('docs/audits/editorial-expansion-live-2026-10-07.json',JSON.stringify(output,null,2)+'\n'));
