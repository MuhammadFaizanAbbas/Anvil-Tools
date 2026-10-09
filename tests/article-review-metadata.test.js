const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderArticle } = require('../backend/src/lib/articles');
const { publicSecurityHeaders, securityHeadersForPath, backgroundCsp, hsts } = require('../backend/src/lib/public-security');

test('review dates belong to the reviewed article version, including metadata edits', () => {
  const item = require('../content/editorial/experiments.json')[0];
  const post = { ...item, body: fs.readFileSync('content/editorial/' + item.bodyFile, 'utf8') };
  const html = renderArticle(post, 'https://nevco.online');
  assert.match(html, /Last reviewed: <time datetime="2026-10-09">October 9, 2026<\/time>/);
  assert.match(html, /Published <time datetime="2026-10-06T00:00:00\+05:00">2026-10-06/);
  assert.match(html, /Written by: <a[^>]+rel="author">VelloxTech Editorial Team/);
  assert.match(html, /How we test examples and review content/);
  const crlf = renderArticle({ ...post, body: post.body.replace(/\r?\n/g, '\r\n') }, 'https://nevco.online');
  assert.match(crlf, /Last reviewed/);
  for (const change of [{ body: post.body + '\n\nNew unreviewed claim.' }, { title: 'Changed title' }, { excerpt: 'Changed description' }]) {
    assert.doesNotMatch(renderArticle({ ...post, ...change }, 'https://nevco.online'), /Last reviewed/);
  }
});

test('all 30 published guides and experiments show the human-readable review date and correction path', () => {
  const guides = [
    ...require('../content/editorial/published-library.json'),
    ...require('../content/editorial/experiments.json'),
  ];
  assert.equal(guides.length, 30);
  for (const guide of guides) {
    const post = { ...guide, body: fs.readFileSync('content/editorial/' + guide.bodyFile, 'utf8'), updated_at: '2026-10-10T00:00:00Z' };
    const html = renderArticle(post, 'https://nevco.online');
    assert.match(html, /Last reviewed: <time datetime="2026-10-09">October 9, 2026<\/time>/, guide.slug);
    assert.match(html, /"dateModified":"2026-10-09"/, guide.slug);
    assert.match(html, /Written by: <a[^>]*>VelloxTech Editorial Team<\/a>/, guide.slug);
    assert.match(html, /Report an error or suggest a correction/, guide.slug);
  }
});

test('article structured data connects organization, breadcrumbs, and article author', () => {
  const html = renderArticle({ slug: 'guide', title: 'Guide', excerpt: 'Tested guide.', body: 'Useful content.' }, 'https://nevco.online');
  const data = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const organizations = data['@graph'].filter(item => item['@type'] === 'Organization');
  const breadcrumbs = data['@graph'].find(item => item['@type'] === 'BreadcrumbList');
  const article = data['@graph'].find(item => item['@type'] === 'BlogPosting');
  const publisher = organizations.find(item => item.name === 'VelloxTech');
  const author = organizations.find(item => item.name === 'VelloxTech Editorial Team');
  assert.equal(breadcrumbs.itemListElement.length, 3);
  assert.equal(article.author['@id'], author['@id']);
  assert.equal(article.publisher['@id'], publisher['@id']);
  assert.equal(author.parentOrganization['@id'], publisher['@id']);
});

test('article category identifiers render as polished labels', () => {
  const cases = {
    'developer-tools': 'Developer tools',
    'email-tools': 'Email tools',
    'image-tools': 'Image tools',
    'pdf-tools': 'PDF tools',
    'text-tools': 'Text tools',
    generators: 'Generators',
  };
  for (const [category_slug, label] of Object.entries(cases)) {
    const html = renderArticle({ slug: 'guide', title: 'Guide', body: 'Useful content.', category_slug }, 'https://nevco.online');
    assert.match(html, new RegExp(`<span class="eyebrow">${label}<\\/span>`));
    assert.doesNotMatch(html, new RegExp(`<span class="eyebrow">${category_slug}<\\/span>`));
  }
});

test('host configs redirect duplicate home before file handling and enforce compatible headers', () => {
  for (const file of ['vercel.json', 'frontend/vercel.json']) {
    const routes = JSON.parse(fs.readFileSync(file, 'utf8')).routes;
    const redirect = routes.findIndex(route => new RegExp(route.src || '$^').test('/index.html'));
    assert.equal(routes[redirect].headers.Location, '/');
    assert.equal(routes[redirect].status, 308);
    assert.ok(redirect < routes.findIndex(route => route.handle === 'filesystem'));
    const headers = routes.find(route => route.headers?.['Content-Security-Policy']).headers;
    assert.equal(headers['Content-Security-Policy'], publicSecurityHeaders['Content-Security-Policy']);
    assert.equal(headers['Strict-Transport-Security'], hsts);
    const background = routes.find(route => route.src === '^/tools/background-remover\\.html/?$');
    assert.equal(background.headers['Content-Security-Policy'], backgroundCsp);
    assert.ok(routes.indexOf(background) > routes.findIndex(route => route.headers?.['Content-Security-Policy']));
    assert.doesNotMatch(hsts, /includeSubDomains|preload/);
  }
  const apache = fs.readFileSync('frontend/.htaccess', 'utf8');
  assert.ok(apache.includes(publicSecurityHeaders['Content-Security-Policy']));
  assert.match(apache, /THE_REQUEST.*index\\\.html/);
  assert.match(apache, /Strict-Transport-Security.*expr=%\{HTTPS\} == 'on'/);
  assert.doesNotMatch(publicSecurityHeaders['Content-Security-Policy'], /'unsafe-eval'/);
  assert.match(securityHeadersForPath('/tools/background-remover.html')['Content-Security-Policy'], /'unsafe-eval'/);
  assert.deepEqual(securityHeadersForPath('/admin-panel/index.html'), publicSecurityHeaders);
  assert.deepEqual(securityHeadersForPath('/tools/json-formatter.html'), publicSecurityHeaders);
});
