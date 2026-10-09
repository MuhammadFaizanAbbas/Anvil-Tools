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

test('fixture manifest records exact sizes and SHA-256 hashes', () => {
  const manifest = JSON.parse(read('assets/examples/lab/fixture-manifest.json'));
  assert.ok(manifest.files.length >= 12);
  for (const item of manifest.files) {
    const relative = item.href.replace(/^\//, '');
    const bytes = fs.readFileSync(path.join(frontend, relative));
    assert.equal(item.bytes, bytes.length, relative);
    assert.equal(item.sha256, crypto.createHash('sha256').update(bytes).digest('hex'), relative);
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
