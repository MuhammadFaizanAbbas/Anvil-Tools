// Read-only production check. Reports content publication separately from code deployment.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const release = require('../content/editorial/release-2026-10-04.json');
const origin = 'https://anviltools.vercel.app';
async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
  return { response, text: await response.text() };
}
(async () => {
  const report = { checkedAt: new Date().toISOString(), origin, pages: [], articles: [], listings: [] };
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['assets', 'admin-panel'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
  });
  const pages = walk('frontend'); let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < pages.length) {
      const file = pages[cursor++];
      const route = '/' + path.relative('frontend', file).replaceAll('\\', '/');
      const { response, text } = await read(origin + route);
      report.pages.push({ path: route, status: response.status, h1: (text.match(/<h1\b/g) || []).length, canonical: text.match(/rel="canonical" href="([^"]+)"/)?.[1], noindex: /noindex/i.test(response.headers.get('x-robots-tag') || '') });
    }
  }));
  for (const route of ['/blog', '/blog/', '/blog/index.html?page=2']) {
    const { response, text } = await read(origin + route);
    const entry = { path: route, status: response.status, serverRendered: text.includes('data-server-rendered="true"'), canonical: text.match(/rel="canonical" href="([^"]+)"/)?.[1], articleLinks: (text.match(/href="\/journal\//g) || []).length };
    report.listings.push(entry);
  }
  for (const post of release.posts) {
    const local = fs.readFileSync(`content/editorial/${post.key}.md`, 'utf8').trim();
    const { text } = await read(`https://anvil-tools-backend.vercel.app/api/public/posts/${post.slug}`);
    const live = JSON.parse(text);
    const md5 = body => crypto.createHash('md5').update(body).digest('hex');
    const { response, text: html } = await read(`${origin}/journal/${post.slug}`);
    const image = await fetch(`${origin}/journal-images/${post.cover_image_id}`, { signal: AbortSignal.timeout(30000) });
    const bytes = Buffer.from(await image.arrayBuffer());
    const dimensions = image.ok ? await require('sharp')(bytes).metadata() : {};
    report.articles.push({ slug: post.slug, status: response.status, revisedBodyPublished: md5(local) === md5(live.body), bodyMd5: md5(live.body), htmlOutline: html.includes('class="article-toc"'), canonical: html.match(/rel="canonical" href="([^"]+)"/)?.[1], coverMatches: live.cover_image_id === post.cover_image_id, coverStatus: image.status, coverMime: image.headers.get('content-type'), coverWidth: dimensions.width, coverHeight: dimensions.height });
  }
  report.pages.sort((a,b) => a.path.localeCompare(b.path));
  report.missingPageStatus = (await fetch(`${origin}/release-check-page-that-does-not-exist`, { signal: AbortSignal.timeout(30000) })).status;
  report.codePassed = report.pages.every(page => page.status === 200 && page.h1 === 1)
    && report.missingPageStatus === 404
    && report.listings.every(page => page.status === 200 && page.serverRendered && page.articleLinks > 0)
    && report.listings[2].canonical === `${origin}/blog/index.html?page=2`
    && report.articles.every(post => post.status === 200 && post.htmlOutline && post.coverMatches && post.coverStatus === 200 && post.coverWidth > 0);
  report.contentPublished = report.articles.every(post => post.revisedBodyPublished);
  fs.writeFileSync('docs/audits/live-release.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ codePassed: report.codePassed, contentPublished: report.contentPublished, pageCount: report.pages.length, pageIssues: report.pages.filter(page => ![200,404].includes(page.status) || page.h1 !== 1), listings: report.listings, articles: report.articles }, null, 2));
  if (!report.codePassed) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
