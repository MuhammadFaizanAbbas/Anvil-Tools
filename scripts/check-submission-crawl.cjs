// Public GET/HEAD requests only. No messages, account updates, or database writes.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const library = require('../content/editorial/published-library.json');
const examples = require('./site-generator/tool-examples.json');
const origin = new URL(process.argv[2] || 'https://nevco.online').origin;
assert.match(origin, /^https?:\/\//);
const report = { checkedAt: new Date().toISOString(), origin, pages: [], links: [], assets: [], directives: [],
  limits: ['HTTP checks cannot establish AdSense ownership or review status.', 'Email/contact delivery and future advertising are not tested.', 'An HTTP 200 alone does not prove editorial quality.'] };
const decode = value => value.replace(/&amp;/g, '&').replace(/&#(?:x([\da-f]+)|(\d+));/gi, (_, hex, decimal) => String.fromCodePoint(parseInt(hex || decimal, hex ? 16 : 10)));
const canonicalPath = pathname => pathname === '/index.html' ? '/' : pathname.endsWith('/') && pathname !== '/' ? pathname + 'index.html' : pathname;
async function request(url, method = 'GET') {
  const response = await fetch(url, { method, signal: AbortSignal.timeout(30000) });
  return { status: response.status, finalUrl: response.url, type: response.headers.get('content-type'),
    robots: response.headers.get('x-robots-tag'), cache: response.headers.get('cache-control'), body: method === 'GET' ? await response.text() : '' };
}
async function concurrent(values, action) {
  let cursor = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (cursor < values.length) { const value = values[cursor++]; await action(value); } }));
}
(async () => {
  const paths = ['/', '/about.html', '/contact.html', '/privacy-policy.html', '/cookie-policy.html', '/terms-of-service.html', '/disclaimer.html', '/tools/index.html', '/blog/index.html',
    ...fs.readdirSync('frontend/categories').filter(file => file.endsWith('.html')).map(file => '/categories/' + file),
    ...Object.keys(examples).map(slug => '/tools/' + slug + '.html'), ...library.map(guide => '/journal/' + guide.slug)];
  assert.equal(paths.length, 39);
  const documents = new Map(), links = new Set(), assets = new Set();
  await concurrent(paths, async route => {
    try {
      const result = await request(origin + route), html = result.body;
      const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => decode(match[1])));
      const destinations = [...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map(match => new URL(decode(match[1]), origin + route));
      destinations.forEach(url => { if (['http:', 'https:'].includes(url.protocol)) links.add(url.href); });
      [...html.matchAll(/<(?:script|img|link)\b[^>]*\b(?:src|href)=["']([^"']+)["']/gi)].forEach(match => {
        const url = new URL(decode(match[1]), origin + route);
        if (url.origin === origin && (/\/assets\//.test(url.pathname) || /\/journal-images\//.test(url.pathname))) assets.add(url.href);
      });
      documents.set(canonicalPath(route), { ids, destinations });
      const canonical = html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*\bhref=["']([^"']+)["']/i)?.[1];
      report.pages.push({ route, status: result.status, title: html.match(/<title>(.*?)<\/title>/is)?.[1],
        description: html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)/i)?.[1], h1: (html.match(/<h1\b/gi) || []).length,
        canonical, expectedCanonical: origin + route, canonicalMatches: canonical === origin + route,
        noindex: /noindex/i.test(result.robots || '') || /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html),
        advertisingScript: /<script\b[^>]*src=["'][^"']*(?:adsbygoogle|fundingchoices|\/ads\.js|\/cmp\.js)/i.test(html),
        sharedLoaderVersioned: /assets\/js\/main\.js\?v=20261005-review/.test(html), workedExample: html.includes('<!-- checked-example -->') });
    } catch (error) { report.pages.push({ route, error: error.message }); }
  });
  report.fragmentFailures = [];
  for (const [route, document] of documents) for (const url of document.destinations) {
    if (url.origin !== origin || !url.hash || ['#', '#top'].includes(url.hash)) continue;
    const target = documents.get(canonicalPath(url.pathname));
    if (target && !target.ids.has(decodeURIComponent(url.hash.slice(1)))) report.fragmentFailures.push({ route, target: url.pathname + url.hash });
  }
  const uniqueDestinations = [...new Set([...links].map(href => { const url = new URL(href); url.hash = ''; return url.href; }))];
  await concurrent(uniqueDestinations, async url => {
    try {
      let response = await request(url, 'HEAD');
      if (response.status === 405 || response.status === 403) response = await request(url);
      report.links.push({ url, status: response.status, finalUrl: response.finalUrl });
    } catch (error) { report.links.push({ url, error: error.message }); }
  });
  await concurrent([...assets], async url => {
    try { const response = await request(url, 'HEAD'); report.assets.push({ url, status: response.status, type: response.type, cache: response.cache }); }
    catch (error) { report.assets.push({ url, error: error.message }); }
  });
  await concurrent(['/robots.txt', '/sitemap.xml', '/sitemap-index.xml', '/journal-sitemap.xml', '/ads.txt'], async route => {
    try {
      const result = await request(origin + route);
      const check = { route, status: result.status };
      if (route.includes('sitemap')) {
        check.urls = [...result.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1]));
        check.wrongOrigin = check.urls.filter(url => new URL(url).origin !== origin);
      } else if (route === '/robots.txt') {
        check.sitemap = result.body.match(/^Sitemap:\s*(.+)$/m)?.[1]?.trim();
        check.blocksPublicPages = /^Disallow:\s*\/(?:\s*$|blog|journal)/m.test(result.body);
      } else {
        check.sha256 = createHash('sha256').update(result.body).digest('hex');
        check.modified = false;
      }
      report.directives.push(check);
    } catch (error) { report.directives.push({ route, error: error.message }); }
  });
  report.articles = [];
  await concurrent(library, async guide => {
    try {
      const result = await request('https://anvil-tools-backend.vercel.app/api/public/posts/' + guide.slug);
      assert.equal(result.status, 200);
      const post = JSON.parse(result.body), expected = fs.readFileSync('content/editorial/' + guide.bodyFile, 'utf8').replace(/\r\n?/g, '\n').trim();
      report.articles.push({ slug: guide.slug, matchesPreparedBody: post.body === expected });
    } catch (error) { report.articles.push({ slug: guide.slug, error: error.message }); }
  });
  for (const key of ['pages', 'links', 'assets', 'directives', 'articles']) report[key].sort((a, b) => (a.route || a.url || a.slug).localeCompare(b.route || b.url || b.slug));
  report.failedHttp = [...report.pages, ...report.links, ...report.assets, ...report.directives].filter(check => check.error || check.status < 200 || check.status >= 400);
  report.releasePending = report.pages.filter(page => !page.sharedLoaderVersioned || (page.route.startsWith('/tools/') && page.route !== '/tools/index.html' && !page.workedExample)).map(page => page.route);
  report.unpublishedGuides = report.articles.filter(guide => !guide.matchesPreparedBody).map(guide => guide.slug);
  fs.writeFileSync('docs/audits/submission-crawl-' + new URL(origin).hostname + '.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ origin, pages: report.pages.length, links: report.links.length, assets: report.assets.length, failedHttp: report.failedHttp.length,
    fragmentFailures: report.fragmentFailures.length, wrongCanonicals: report.pages.filter(page => !page.canonicalMatches).length,
    releasePending: report.releasePending.length, unpublishedGuides: report.unpublishedGuides.length, badRequests: report.failedHttp.map(check => ({ url: check.url || check.route, status: check.status, error: check.error })) }, null, 2));
  if (report.failedHttp.length || report.fragmentFailures.length || report.releasePending.length || report.unpublishedGuides.length) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
