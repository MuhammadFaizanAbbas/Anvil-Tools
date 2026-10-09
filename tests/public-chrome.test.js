const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { canonicalFooter, canonicalHeader } = require('../backend/src/lib/public-chrome');
const { renderArticle } = require('../backend/src/lib/articles');

const frontend = path.resolve(__dirname, '../frontend');
const extract = (html, element) => html.match(new RegExp(`<${element} class="site-${element}">[\\s\\S]*?<\\/${element}>`))?.[0];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['admin-panel', 'assets'].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
  });
}

test('every public static page uses the canonical homepage header and footer', () => {
  const pages = walk(frontend);
  assert.ok(pages.length >= 50);
  for (const file of pages) {
    const relative = path.relative(frontend, file).replaceAll('\\', '/');
    const pathname = relative === 'index.html' ? '/' : `/${relative}`;
    const html = fs.readFileSync(file, 'utf8');
    assert.equal(extract(html, 'header'), canonicalHeader(pathname), `${relative}: header`);
    assert.equal(extract(html, 'footer'), canonicalFooter(), `${relative}: footer`);
  }
});

test('server-rendered articles use the same canonical chrome with their public origin', () => {
  const origin = 'https://nevco.online';
  const html = renderArticle({ slug: 'consistent-guide', title: 'Consistent guide', body: 'Reviewed body.' }, origin);
  assert.equal(extract(html, 'header'), canonicalHeader('/journal/consistent-guide', origin));
  assert.equal(extract(html, 'footer'), canonicalFooter(origin));
});
