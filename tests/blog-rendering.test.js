const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const express = require('express');

const posts = Array.from({ length: 35 }, (_, i) => ({
  slug: `article-${i}`, title: i === 0 ? '<script>alert(1)</script>' : `Article ${i}`,
  excerpt: i === 0 ? '" onerror="unsafe' : `Summary ${i}`, status: 'published',
  cover_image_id: i === 0 ? 'image' : null, cover_alt: '" onerror="unsafe'
}));
posts.push({ slug: 'private-draft', title: 'Private draft', status: 'draft' });
let fail = false;
const queries = [];
const db = { from(table) {
  const query = { table, filters: [], orders: [], bounds: null };
  queries.push(query);
  return {
    select(fields) { query.fields = fields; return this; },
    eq(key, value) { query.filters.push([key, value]); return this; },
    order(key) { query.orders.push(key); return this; },
    range(first, last) { query.bounds = [first, last]; return this; },
    then(resolve, reject) {
      const rows = posts.filter(row => query.filters.every(([key, value]) => row[key] === value));
      return Promise.resolve(fail ? { error: { code: 'UNAVAILABLE' } } : { data: rows.slice(query.bounds[0], query.bounds[1] + 1) }).then(resolve, reject);
    }
  };
} };
const clientPath = require.resolve('../backend/src/lib/supabase');
require.cache[clientPath] = { id: clientPath, filename: clientPath, loaded: true, exports: { supabaseAdmin: db } };
const app = express();
app.use((req, res, next) => { res.set('X-Robots-Tag', 'noindex, nofollow'); next(); });
app.use('/api/public', require('../backend/src/routes/articles'));
let server, base;
before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));
const get = query => fetch(`${base}/api/public/blog${query || ''}`, { headers: { 'X-Frontend-Origin': 'https://nevco.online' } });

test('blog response includes escaped published cards, guides, and crawlable pagination without JavaScript', async () => {
  const response = await get();
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-robots-tag'), null);
  assert.match(html, /rel="canonical" href="https:\/\/nevco.online\/blog\/index.html"/);
  assert.match(html, /href="\/journal\/article-0"/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert|private-draft/);
  assert.match(html, /href="\/blog\/index.html\?page=2" rel="next"/);
  assert.doesNotMatch(html, /editorial-library|href="\/blog\/merge-pdfs-locally.html"/);
  assert.deepEqual(queries.at(-1).filters, [['status', 'published']]);
  assert.deepEqual(queries.at(-1).bounds, [0, 30]);
  assert.deepEqual(queries.at(-1).orders, ['published_at', 'slug']);
  assert.doesNotMatch(queries.at(-1).fields, /body/);
});

test('second blog page has its own canonical and links back; invalid and missing pages are rejected', async () => {
  const response = await get('?page=2');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /rel="canonical" href="https:\/\/nevco.online\/blog\/index.html\?page=2"/);
  assert.match(html, /href="\/journal\/article-30"/);
  assert.doesNotMatch(html, /href="\/journal\/article-0"/);
  assert.match(html, /href="\/blog\/index.html" rel="prev"/);
  assert.match(html, /id="blogsNext" hidden/);
  assert.doesNotMatch(html, /href="\/blog\/index.html\?page=3"/);
  for (const page of ['0', '-1', '1.5', 'abc', '33335', '1&page=2']) assert.equal((await get(`?page=${page}`)).status, 400);
  const missing = await get('?page=3');
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('x-robots-tag'), 'noindex, follow');
  assert.match(await missing.text(), /Browse the current guides/);
});

test('a database outage leaves the authored guides readable and allows a browser retry', async () => {
  fail = true;
  try {
    const response = await get();
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Latest articles are temporarily unavailable/);
    assert.match(html, /data-server-rendered="false"/);
    assert.match(html, /href="\/journal\/small-tools-that-save-developers-time"/);
    assert.match(html, /class="guide-cover"/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { fail = false; }
});

test('cPanel renderer escapes database content and preserves no-JS guide links and pagination', t => {
  const php = process.env.PHP_PATH || 'php';
  const data = Buffer.from(JSON.stringify(posts.slice(0, 2))).toString('base64');
  const renderer = path.resolve('frontend/blog-render.php').replaceAll('\\', '/');
  const template = path.resolve('frontend/blog/index.html').replaceAll('\\', '/');
  const code = (page, hasNext) => `require '${renderer}'; echo render_blog_index(file_get_contents('${template}'), json_decode(base64_decode('${data}'), true), 'https://nevco.online', ${page}, ${hasNext});`;
  let html;
  try { html = execFileSync(php, ['-r', code(2, true)], { encoding: 'utf8' }); }
  catch (error) { if (error.code === 'ENOENT') return t.skip('Install PHP or set PHP_PATH to test the cPanel renderer.'); throw error; }
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /href="\/journal\/article-0"/);
  assert.match(html, /rel="canonical" href="https:\/\/nevco.online\/blog\/index.html\?page=2"/);
  assert.match(html, /href="\/blog\/index.html\?page=3" rel="next"/);
  assert.match(html, /href="\/blog\/index.html" rel="prev"/);
  assert.doesNotMatch(html, /editorial-library|href="\/blog\/merge-pdfs-locally.html"/);
  for (const page of [1, 2]) {
    const lastPage = execFileSync(php, ['-r', code(page, false)], { encoding: 'utf8' });
    assert.match(lastPage, /id="blogsNext" hidden/);
    assert.doesNotMatch(lastPage, /rel="next"|href="\/blog\/index.html\?page=3"/);
    if (page === 1) {
      assert.match(lastPage, /id="blogsPrev" hidden/);
      assert.doesNotMatch(lastPage, /rel="prev"|href="\/blog\/index.html\?page=1"/);
    }
  }
});

test('retired static articles leave the catalog and sitemap; covered guides provide tool links', () => {
  const guides = JSON.parse(fs.readFileSync('scripts/site-generator/editorial-guides.json', 'utf8'));
  const index = fs.readFileSync('frontend/blog/index.html', 'utf8');
  const sitemap = fs.readFileSync('frontend/sitemap.xml', 'utf8');
  const apache = fs.readFileSync('frontend/.htaccess', 'utf8');
  const vercel = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.equal(guides.length, 12);
  for (const guide of guides) {
    assert.ok(Object.hasOwn(guide, 'retiredTo'));
    assert.ok(!fs.existsSync(`frontend/blog/${guide.slug}.html`));
    assert.ok(!index.includes(`/blog/${guide.slug}.html`));
    assert.ok(!sitemap.includes(`/blog/${guide.slug}.html`));
    assert.ok(fs.existsSync(`scripts/site-generator/editorial/${guide.slug}.html`));
    assert.ok(apache.includes(`RewriteRule ^blog/${guide.slug}\\.html`));
    const route = vercel.routes.find(route => route.src === `^/blog/${guide.slug}\\.html/?$`);
    assert.equal(route.status, guide.retiredTo ? 308 : 410);
  }
  const library = JSON.parse(fs.readFileSync('content/editorial/published-library.json', 'utf8'));
  assert.equal(library.length, 4);
  for (const guide of library) {
    assert.ok(index.includes(`/journal/${guide.slug}`));
    assert.ok(index.includes(`/journal-images/${guide.cover_image_id}`));
    assert.ok(guide.cover_alt.trim());
    for (const tool of guide.tools) assert.ok(fs.readFileSync(`frontend/tools/${tool}.html`, 'utf8').includes(`/journal/${guide.slug}`), tool);
  }
});
test('overlapping article URLs redirect directly and removed topics return a styled Gone page', async () => {
  const redirects = require('../backend/src/lib/article-redirects.json');
  const retained = new Set(require('../content/editorial/published-library.json').map(row => row.slug));
  assert.equal(Object.keys(redirects).length, 486);
  for (const target of Object.values(redirects).filter(Boolean)) assert.ok(retained.has(target));
  const beforeCount = queries.length;
  const old = '/api/public/articles/common-mistakes-with-background-removal-in-ecommerce';
  const response = await fetch(base + old, { redirect: 'manual', headers: { 'X-Frontend-Origin': 'https://nevco.online' } });
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://nevco.online/journal/best-practices-for-background-removal-when-working-with-design');
  const slug = Object.keys(redirects).find(key => redirects[key] === null);
  const gone = await fetch(base + '/api/public/articles/' + slug, { headers: { 'X-Frontend-Origin': 'https://nevco.online' } });
  assert.equal(gone.status, 410);
  assert.equal(gone.headers.get('x-robots-tag'), 'noindex, follow');
  assert.match(await gone.text(), /href="https:\/\/nevco.online\/assets\/css\/style.css\?v=/);
  assert.equal(queries.length, beforeCount);
});
