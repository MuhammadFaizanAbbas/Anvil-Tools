const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { renderBlog } = require('../backend/src/lib/blog');

test('one-page successful blogs omit retry and pagination from HTML; genuine outages expose retry', () => {
  const post = { slug: 'recorded-guide', title: 'Recorded guide' };
  const successful = renderBlog([post], 'https://nevco.online');
  assert.doesNotMatch(successful, /Try again|id="blogsRetry"|id="blogPagination"|Previous|Page 1|>Next</);
  assert.match(successful, /href="\/journal\/recorded-guide"/);
  const outage = renderBlog([], 'https://nevco.online', { unavailable: true });
  assert.match(outage, /id="blogsRetry" type="button">Try again/);
  assert.match(outage, /temporarily unavailable/);
});

test('recorded experiment pages and fixtures are discoverable without JavaScript', () => {
  const catalog = require('../content/editorial/experiments.json');
  const sitemap = fs.readFileSync('frontend/sitemap.xml', 'utf8');
  const blog = fs.readFileSync('frontend/blog/index.html', 'utf8');
  assert.equal(catalog.length, 4);
  for (const item of catalog) {
    const url = `/blog/${item.slug}.html`;
    assert.ok(sitemap.includes(url)); assert.ok(blog.includes(url));
    const html = fs.readFileSync('frontend' + url, 'utf8');
    assert.match(html, /results\.json/); assert.match(html, /<h2/);
    assert.ok(html.includes(item.cover_path));
    const structuredData = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const article = structuredData['@graph'].find(entry => entry['@type'] === 'BlogPosting');
    assert.equal(article.keywords, item.tags.join(', '));
    assert.ok(article.keywords.trim());
    for (const tool of item.tools) assert.ok(fs.readFileSync(`frontend/tools/${tool}.html`, 'utf8').includes(url));
  }
  const results = JSON.parse(fs.readFileSync('frontend/assets/examples/experiments/results.json', 'utf8'));
  assert.ok(results.runs.length >= 1);
  for (const run of results.runs) {
    assert.equal(run.json.length, 14); assert.equal(run.csv.length, 13); assert.equal(run.wordCounter.length, 12);
    assert.ok([...run.json, ...run.csv, ...run.wordCounter].every(row => row.passed));
  }
});
