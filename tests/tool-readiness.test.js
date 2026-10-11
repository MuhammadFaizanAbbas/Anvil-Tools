const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const readiness = require('../content/tool-readiness.json');
const read = relative => fs.readFileSync(path.join(frontend, relative), 'utf8');
const jsonLdBlocks = html => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
const types = value => (value['@graph'] || [value]).map(item => item['@type']);

test('homepage and directory indexes expose the requested JSON-LD types', () => {
  for (const [file, expected] of [
    ['index.html', ['WebSite', 'Organization', 'ItemList']],
    ['tools/index.html', ['CollectionPage', 'ItemList']],
    ['blog/index.html', ['Blog', 'ItemList']],
  ]) {
    const found = jsonLdBlocks(read(file)).flatMap(types);
    for (const type of expected) assert.ok(found.includes(type), `${file}: ${type}`);
  }
});

test('every tool has WebApplication data, a review date, privacy, limitations, and related evidence', () => {
  assert.equal(readiness.length, 20);
  for (const item of readiness) {
    const html = read(`tools/${item.slug}.html`);
    const found = jsonLdBlocks(html).flatMap(types);
    assert.ok(found.includes('WebApplication'), `${item.slug}: WebApplication`);
    assert.match(html, /Last reviewed:/, `${item.slug}: review`);
    assert.match(html, /How this tool handles your data/, `${item.slug}: data handling`);
    assert.match(html, /Known limitations/, `${item.slug}: limitations`);
    assert.match(html, /Related guide and Lab test/, `${item.slug}: related block`);
  }
});

test('Lab resource pages expose TechArticle and BreadcrumbList data', () => {
  for (const file of ['lab/index.html', 'lab/fixtures.html', 'lab/privacy.html', 'lab/compatibility.html']) {
    const found = jsonLdBlocks(read(file)).flatMap(types);
    assert.ok(found.includes('TechArticle'), `${file}: TechArticle`);
    assert.ok(found.includes('BreadcrumbList'), `${file}: BreadcrumbList`);
  }
});

test('temporary email is ad-free in the complete interface and scripts', () => {
  const combined = [read('tools/temp-mail.html'), read('assets/js/tools/temp-mail.js')].join('\n');
  assert.doesNotMatch(combined, /ad-slot|adsbygoogle|googlesyndication|doubleclick|data-ad-client/i);
  for (const state of ['Creating inbox', 'tm-messages', 'tm-viewer', 'tm-status']) assert.ok(combined.includes(state), state);
});

test('all public image elements provide alt text and intrinsic dimensions', () => {
  const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : full.endsWith('.html') ? [full] : [];
  });
  for (const file of walk(frontend)) {
    const html = fs.readFileSync(file, 'utf8');
    for (const [index, match] of [...html.matchAll(/<img\b[^>]*>/gi)].entries()) {
      const tag = match[0];
      assert.match(tag, /\balt="[^"]*"/i, `${path.relative(frontend, file)} image ${index + 1}: alt`);
      assert.match(tag, /\bwidth="\d+"/i, `${path.relative(frontend, file)} image ${index + 1}: width`);
      assert.match(tag, /\bheight="\d+"/i, `${path.relative(frontend, file)} image ${index + 1}: height`);
    }
  }
});
