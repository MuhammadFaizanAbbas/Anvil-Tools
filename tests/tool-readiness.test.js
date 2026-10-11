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

test('all generated schema uses one Anvil Tools publisher organization and its verified 180px logo', () => {
  const files = [
    'index.html', 'tools/index.html', 'blog/index.html', 'editorial-policy.html',
    ...readiness.map(item => `tools/${item.slug}.html`),
    ...['index.html', 'fixtures.html', 'privacy.html', 'compatibility.html'].map(file => `lab/${file}`),
    ...fs.readdirSync(path.join(frontend, 'lab/reports')).filter(file => file.endsWith('.html')).map(file => `lab/reports/${file}`),
    ...require('../content/editorial/experiments.json').map(item => `blog/${item.slug}.html`),
  ];
  for (const file of files) {
    const nodes = jsonLdBlocks(read(file)).flatMap(value => value['@graph'] || [value]);
    const publisher = nodes.find(item => item['@id']?.endsWith('/#organization'));
    assert.ok(publisher, `${file}: publishing organization`);
    const origin = publisher['@id'].slice(0, -'/#organization'.length);
    const parentId = `${origin}/about.html#velloxtech`;
    const team = nodes.find(item => item.name === 'VelloxTech Editorial Team');
    assert.equal(publisher.name, 'Anvil Tools', `${file}: publisher name`);
    assert.equal(publisher.url, `${origin}/`, `${file}: publisher URL`);
    assert.deepEqual(publisher.logo, {
      '@type': 'ImageObject', url: `${origin}/assets/images/apple-touch-icon.png`, width: 180, height: 180,
    }, `${file}: publisher logo`);
    assert.equal(publisher.parentOrganization?.['@id'], parentId, `${file}: publisher parent`);
    assert.equal(nodes.find(item => item['@id'] === parentId)?.name, 'VelloxTech', `${file}: parent entity`);
    if (team) assert.equal(team.parentOrganization?.['@id'], publisher['@id'], `${file}: editorial team parent`);
    for (const node of nodes) {
      if (['BlogPosting', 'TechArticle', 'Blog', 'WebSite'].includes(node['@type'])) {
        assert.equal(node.publisher?.['@id'], publisher['@id'], `${file}: ${node['@type']} publisher`);
      }
      if (node['@type'] === 'WebApplication') {
        assert.equal(node.author?.['@id'], publisher['@id'], `${file}: WebApplication author`);
      }
    }
  }
});

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
      const alt = tag.match(/\balt="([^"]*)"/i)[1].trim();
      assert.ok(alt || /\bsrc="[^"]*anvil-mark\.svg"/i.test(tag), `${path.relative(frontend, file)} image ${index + 1}: meaningful alt or decorative brand mark`);
      assert.match(tag, /\bwidth="\d+"/i, `${path.relative(frontend, file)} image ${index + 1}: width`);
      assert.match(tag, /\bheight="\d+"/i, `${path.relative(frontend, file)} image ${index + 1}: height`);
    }
  }
});
