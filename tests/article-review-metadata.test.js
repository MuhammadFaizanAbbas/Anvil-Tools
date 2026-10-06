const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderArticle } = require('../backend/src/lib/articles');
const { publicSecurityHeaders, securityHeadersForPath, backgroundCsp, hsts } = require('../backend/src/lib/public-security');

test('review dates belong to the reviewed article version, including metadata edits', () => {
  const item = require('../content/editorial/experiments.json')[0];
  const post = { ...item, body: fs.readFileSync('content/editorial/' + item.bodyFile, 'utf8') };
  const html = renderArticle(post, 'https://nevco.online');
  assert.match(html, /Last reviewed <time datetime="2026-10-07">2026-10-07/);
  assert.match(html, /Published <time datetime="2026-10-06T00:00:00\+05:00">2026-10-06/);
  assert.match(html, /rel="author">VelloxTech editorial team/);
  assert.match(html, /How we test examples and review content/);
  const crlf = renderArticle({ ...post, body: post.body.replace(/\r?\n/g, '\r\n') }, 'https://nevco.online');
  assert.match(crlf, /Last reviewed/);
  for (const change of [{ body: post.body + '\n\nNew unreviewed claim.' }, { title: 'Changed title' }, { excerpt: 'Changed description' }]) {
    assert.doesNotMatch(renderArticle({ ...post, ...change }, 'https://nevco.online'), /Last reviewed/);
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
