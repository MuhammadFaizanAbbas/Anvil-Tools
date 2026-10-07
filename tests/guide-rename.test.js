const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const express = require('express');
const library = require('../content/editorial/published-library.json');
const guide = library.find(item => item.key === 'temporary-email');
const oldSlug = 'best-practices-for-temporary-email-when-working-with-signups';
const post = { ...guide, id: oldSlug, body: fs.readFileSync('content/editorial/temporary-email.md', 'utf8'), published_at: '2026-09-29T06:00:31.666188+00:00' };
let reads = 0;
let legacyOnly = false;
const clientPath = require.resolve('../backend/src/lib/supabase');
require.cache[clientPath] = { id: clientPath, filename: clientPath, loaded: true, exports: { supabaseAdmin: {
  from(table) {
    assert.equal(table, 'posts');
    const filters = [];
    return { select() { return this; }, eq(key, value) { filters.push([key, value]); return this; },
      async maybeSingle() {
        reads++;
        assert.equal(filters[1][0], 'status'); assert.equal(filters[1][1], 'published');
        assert.ok([guide.slug, oldSlug].includes(filters[0][1]));
        return { data: legacyOnly ? filters[0][1] === oldSlug ? { ...post, slug: oldSlug } : null : post };
      } };
  }
} } };
let server, base;
before(async () => {
  server = express().use('/api/public', require('../backend/src/routes/articles')).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

test('indexed temporary-email URL redirects permanently and directly on each frontend host', async () => {
  const beforeReads = reads;
  for (const origin of ['https://nevco.online', 'https://anviltools.vercel.app']) {
    const response = await fetch(`${base}/api/public/articles/${oldSlug}`, { redirect: 'manual', headers: { 'X-Frontend-Origin': origin } });
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), `${origin}/journal/${guide.slug}`);
  }
  assert.equal(reads, beforeReads);
});

test('new URL renders authorized-use content, canonical, review date, and original publication date', async () => {
  const response = await fetch(`${base}/api/public/articles/${guide.slug}`, { headers: { 'X-Frontend-Origin': 'https://nevco.online' } });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.ok(html.includes(`rel="canonical" href="https://nevco.online/journal/${guide.slug}"`));
  assert.ok(html.includes(`<h1>${guide.title}</h1>`));
  assert.match(html, /2026-09-29/);
  assert.match(html, /Last reviewed/);
  assert.match(html, /ban evasion, repeated registrations/);
  assert.doesNotMatch(html, /working-with-signups|Best Practices for Signups|More from the blog/);
  assert.doesNotMatch(post.body, /signup form/);
  assert.doesNotMatch(html, /adsbygoogle|pagead2\.googlesyndication/);
});

test('new canonical URL remains readable before the database slug rename is applied', async () => {
  legacyOnly = true;
  try {
    const beforeReads = reads;
    const response = await fetch(`${base}/api/public/articles/${guide.slug}`, { headers: { 'X-Frontend-Origin': 'https://nevco.online' } });
    assert.equal(response.status, 200);
    assert.equal(reads - beforeReads, 2);
    assert.ok((await response.text()).includes(`rel="canonical" href="https://nevco.online/journal/${guide.slug}"`));
  } finally { legacyOnly = false; }
});
