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
  assert.match(html, /href="\/blog\/merge-pdfs-locally.html"/);
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
  assert.match(html, /href="\/blog\/index.html\?page=1" rel="prev"/);
  assert.match(html, /rel="next" hidden/);
  for (const page of ['0', '-1', '1.5', 'abc', '33335', '1&page=2']) assert.equal((await get(`?page=${page}`)).status, 400);
  assert.equal((await get('?page=3')).status, 404);
});

test('a database outage leaves the authored guides readable and allows a browser retry', async () => {
  fail = true;
  try {
    const response = await get();
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Latest articles are temporarily unavailable/);
    assert.match(html, /data-server-rendered="false"/);
    assert.match(html, /href="\/blog\/format-and-check-json.html"/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  } finally { fail = false; }
});

test('cPanel renderer escapes database content and preserves no-JS guide links and pagination', t => {
  const php = process.env.PHP_PATH || 'php';
  const data = Buffer.from(JSON.stringify(posts.slice(0, 2))).toString('base64');
  const renderer = path.resolve('frontend/blog-render.php').replaceAll('\\', '/');
  const template = path.resolve('frontend/blog/index.html').replaceAll('\\', '/');
  const code = `require '${renderer}'; echo render_blog_index(file_get_contents('${template}'), json_decode(base64_decode('${data}'), true), 'https://nevco.online', 2, true);`;
  let html;
  try { html = execFileSync(php, ['-r', code], { encoding: 'utf8' }); }
  catch (error) { if (error.code === 'ENOENT') return t.skip('Install PHP or set PHP_PATH to test the cPanel renderer.'); throw error; }
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /href="\/journal\/article-0"/);
  assert.match(html, /rel="canonical" href="https:\/\/nevco.online\/blog\/index.html\?page=2"/);
  assert.match(html, /href="\/blog\/index.html\?page=3" rel="next"/);
  assert.match(html, /href="\/blog\/merge-pdfs-locally.html"/);
});

test('authored articles have real local destinations, tool links, metadata, and sitemap entries', () => {
  const guides = JSON.parse(fs.readFileSync('scripts/site-generator/editorial-guides.json', 'utf8'));
  const index = fs.readFileSync('frontend/blog/index.html', 'utf8');
  const sitemap = fs.readFileSync('frontend/sitemap.xml', 'utf8');
  for (const guide of guides) {
    const file = `frontend/blog/${guide.slug}.html`;
    const html = fs.readFileSync(file, 'utf8');
    assert.match(index, new RegExp(`href="/blog/${guide.slug}\\.html"`));
    assert.match(html, /<div class="article-content"><p class="article-meta">/);
    assert.match(html, /<h2>/);
    assert.match(html, new RegExp(`href="/tools/${guide.tool}\\.html"`));
    assert.ok(sitemap.includes(`https://anviltools.vercel.app/blog/${guide.slug}.html`));
    for (const match of html.matchAll(/(?:href|src)="(\/[^"?#]*)/g)) {
      if (match[1] === '/') continue;
      assert.ok(fs.existsSync(path.join('frontend', match[1])), `${file}: ${match[1]}`);
    }
    const tool = fs.readFileSync(`frontend/tools/${guide.tool}.html`, 'utf8');
    assert.ok(tool.includes(`/blog/${guide.slug}.html`), guide.tool);
  }
});
