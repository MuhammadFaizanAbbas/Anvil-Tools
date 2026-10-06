const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { renderArticle } = require('../backend/src/lib/articles');
const { renderBlog } = require('../backend/src/lib/blog');
const { versionPublicStyles } = require('../backend/src/lib/public-assets');

test('missing pages resolve assets and recovery links from nested incoming URLs', () => {
  const html = fs.readFileSync('frontend/404.html', 'utf8');
  assert.doesNotMatch(html, /rel="canonical"|property="og:url"/);
  assert.match(html, /name="robots" content="noindex, follow"/);
  for (const incoming of ['/snowy-peaks-solitaire/', '/snowy-peaks-solitaire/tools/index.html', '/old/deep/link/', '/index.html/']) {
    for (const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)) {
      const url = new URL(match[1], `https://nevco.online${incoming}`);
      if (url.origin !== 'https://nevco.online') continue;
      assert.ok(fs.existsSync(path.join('frontend', url.pathname)), `${incoming}: ${url.pathname}`);
    }
    assert.match(html, /href="\/">Go home/);
    assert.match(html, /href="\/tools\/index\.html">Browse all tools/);
  }
});

test('PHP and Node renderers bypass old cached CSS and retain the same asset paths', () => {
  const sources = [
    renderArticle({ slug: 'guide', title: 'Guide', body: 'Useful article content.' }, 'https://nevco.online'),
    renderBlog([], 'https://nevco.online'),
    fs.readFileSync('frontend/404.html', 'utf8')
  ];
  const helper = path.resolve('frontend/public-assets.php').replaceAll('\\', '/');
  for (const html of sources) {
    const styles = [...html.matchAll(/href="([^"]*assets\/css\/[^"?]+\.css)(\?[^" ]+)"/g)];
    assert.equal(styles.length, 4);
    const legacy = html.replace(/(assets\/css\/[^"?]+\.css)\?[^" ]+/g, '$1');
    assert.equal(versionPublicStyles(legacy), html);
    assert.equal(versionPublicStyles(html), html);
    const input = Buffer.from(legacy).toString('base64');
    const phpHtml = execFileSync(process.env.PHP_PATH || 'php', ['-r', `require '${helper}'; echo version_public_styles(base64_decode('${input}'));`], { encoding: 'utf8' });
    assert.equal(phpHtml, html);
  }
});
