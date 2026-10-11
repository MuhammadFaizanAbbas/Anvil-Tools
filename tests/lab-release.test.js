const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { escape } = require('../backend/src/lib/articles');

const frontend = path.resolve(__dirname, '../frontend');
const read = relative => fs.readFileSync(path.join(frontend, relative), 'utf8');
const library = require('../content/editorial/published-library.json');

test('editorial policy identifies the maintainer and documents the full review process', () => {
  const html = read('editorial-policy.html');
  for (const phrase of [
    'operated and maintained by VelloxTech',
    'How tools are tested',
    'Browsers, devices, and coverage',
    'How sources are selected',
    'AI assistance and fact-checking',
    'manually reviews the final text',
    'Review dates, updates, and corrections',
    'Report an error or suggest a correction',
  ]) assert.ok(html.includes(phrase), phrase);
  assert.match(html, /"@type":"Organization"/);
});

test('Lab ships six category reports with reproducibility and correction sections', () => {
  const directory = path.join(frontend, 'lab/reports');
  const reports = fs.readdirSync(directory).filter(file => file.endsWith('.html'));
  assert.equal(reports.length, 6);
  for (const report of reports) {
    const html = fs.readFileSync(path.join(directory, report), 'utf8');
    for (const phrase of ['Test environment', 'Fixture and expected result', 'Reproduction steps', 'Observed result', 'Downloadable evidence', 'What this test does not establish', 'Related tool and guide', 'Last tested:', 'Change history', 'Report an error or suggest a correction']) {
      assert.ok(html.includes(phrase), `${report}: ${phrase}`);
    }
  }
});

test('every Lab report exposes complete TechArticle and breadcrumb structured data', () => {
  const directory = path.join(frontend, 'lab/reports');
  const reports = fs.readdirSync(directory).filter(file => file.endsWith('.html'));
  for (const report of reports) {
    const html = fs.readFileSync(path.join(directory, report), 'utf8');
    const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(block, `${report}: JSON-LD`);
    const graph = JSON.parse(block)['@graph'];
    const article = graph.find(item => item['@type'] === 'TechArticle');
    const breadcrumbs = graph.find(item => item['@type'] === 'BreadcrumbList');
    const author = graph.find(item => item.name === 'VelloxTech Editorial Team');
    assert.ok(article?.headline, `${report}: headline`);
    assert.ok(article?.description, `${report}: description`);
    assert.ok(article?.datePublished, `${report}: datePublished`);
    assert.ok(article?.dateModified, `${report}: dateModified`);
    assert.match(article?.image || '', /^https:\/\/anviltools\.vercel\.app\//, `${report}: image`);
    assert.equal(article?.mainEntityOfPage?.['@id'], `https://anviltools.vercel.app/lab/reports/${report}`);
    assert.equal(article?.author?.['@id'], author?.['@id']);
    assert.equal(breadcrumbs?.itemListElement?.length, 3, `${report}: breadcrumbs`);
  }
});

test('guides index features the Lab prominently and the static sitemap contains all Lab URLs', () => {
  const blog = read('blog/index.html');
  assert.equal((blog.match(/<!-- lab-feature -->/g) || []).length, 1);
  assert.ok(blog.indexOf('<!-- lab-feature -->') < blog.indexOf('id="publishedBlogs"'));
  assert.match(blog, /Explore the Anvil Tools Lab/);
  assert.match(blog, /href="\/lab\/index\.html"/);

  const sitemap = read('sitemap.xml');
  const expected = ['index.html', 'fixtures.html', 'privacy.html', 'compatibility.html', ...fs.readdirSync(path.join(frontend, 'lab/reports')).filter(file => file.endsWith('.html')).map(file => `reports/${file}`)];
  assert.equal(expected.length, 10);
  for (const relative of expected) assert.ok(sitemap.includes(`/lab/${relative}`), relative);
});

test('Lab and editorial pages reuse the established public header navigation', () => {
  const expected = ['Home', 'All tools', 'Guides &amp; experiments', 'About', 'Contact'];
  for (const relative of ['editorial-policy.html', 'lab/index.html', 'lab/fixtures.html', 'lab/privacy.html', 'lab/compatibility.html']) {
    const html = read(relative);
    const nav = html.match(/<nav class="main-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
    assert.deepEqual([...nav.matchAll(/<a[^>]*>(.*?)<\/a>/g)].map(match => match[1]), expected, relative);
    assert.doesNotMatch(nav, />Lab<\/a>/, relative);
  }
});

test('fixture manifest records exact sizes and SHA-256 hashes', () => {
  const manifest = JSON.parse(read('assets/examples/lab/fixture-manifest.json'));
  assert.ok(manifest.files.length >= 12);
  for (const item of manifest.files) {
    const relative = item.href.replace(/^\//, '');
    const bytes = fs.readFileSync(path.join(frontend, relative));
    assert.equal(item.bytes, bytes.length, relative);
    assert.equal(item.sha256, crypto.createHash('sha256').update(bytes).digest('hex'), relative);
    assert.ok(item.tool, `${relative}: tool`);
    assert.ok(item.expected, `${relative}: expected result`);
  }
});

test('fixture library provides every requested safe test-data format', () => {
  const html = read('lab/fixtures.html');
  assert.match(html, /Safe to use for testing; contains no personal data/);
  for (const id of ['csv', 'json', 'transparent-png', 'pdf', 'qr-payload', 'text-diff', 'unicode-text']) {
    assert.match(html, new RegExp(`id="${id}"`), id);
  }
});

test('every category page lists every published guide with category, date, and related tool', () => {
  const categories = ['developer-tools', 'email-tools', 'generators', 'image-tools', 'pdf-tools', 'text-tools'];
  for (const category of categories) {
    const html = read(`categories/${category}.html`);
    assert.equal((html.match(/<!-- category-guide-hub -->/g) || []).length, 1, category);
    for (const guide of library.filter(item => item.category_slug === category)) {
      assert.ok(html.includes(`/journal/${guide.slug}`), guide.slug);
      assert.ok(html.includes(escape(guide.title)), guide.title);
    }
    assert.match(html, /Last updated October 9, 2026/);
    assert.match(html, /Related tool:/);
  }
});

test('six important tools expose an evidence card and related Lab report', () => {
  for (const slug of ['json-formatter', 'temp-mail', 'qr-code-generator', 'image-to-pdf', 'pdf-merge', 'word-counter']) {
    const html = read(`tools/${slug}.html`);
    assert.equal((html.match(/<!-- lab-test-card -->/g) || []).length, 1, slug);
    for (const label of ['Tested', 'Input types', 'Processing', 'Maximum tested size', 'Observed limitation', 'Privacy note']) assert.ok(html.includes(`<dt>${label}</dt>`), `${slug}: ${label}`);
    assert.match(html, /\/lab\/reports\/[a-z0-9-]+\.html/);
  }
});
