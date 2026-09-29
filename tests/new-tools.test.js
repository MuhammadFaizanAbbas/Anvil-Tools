const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const tools = [
  ['url-encoder-decoder', 'URL Encoder & Decoder'],
  ['jwt-decoder', 'JWT Decoder'],
  ['unix-timestamp-converter', 'Unix Timestamp Converter'],
  ['hash-generator', 'Hash Generator'],
  ['csv-to-json', 'CSV to JSON Converter'],
  ['text-case-converter', 'Text Case Converter'],
  ['text-diff-checker', 'Text Difference Checker'],
  ['uuid-generator', 'UUID Generator'],
];

test('eight new browser tools have complete pages, scripts, catalog entries and sitemap URLs', () => {
  const home = fs.readFileSync('frontend/index.html', 'utf8');
  const catalog = fs.readFileSync('frontend/tools/index.html', 'utf8');
  const sitemap = fs.readFileSync('frontend/sitemap.xml', 'utf8');
  const seed = fs.readFileSync('supabase/seed.sql', 'utf8');
  assert.match(home, /20 free browser tools/);
  assert.match(home, /20 useful tools/);
  for (const [slug, name] of tools) {
    const page = fs.readFileSync(`frontend/tools/${slug}.html`, 'utf8');
    const script = fs.readFileSync(`frontend/assets/js/tools/${slug}.js`, 'utf8');
    assert.match(page, new RegExp(`<h1>${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/h1>`));
    assert.match(page, new RegExp(`assets/js/tools/${slug}\\.js`));
    assert.match(page, /id="consent-banner" hidden aria-hidden="true"/);
    assert.match(page, /Nothing entered into this tool is sent/);
    assert.ok(script.length > 400, `${slug} script is unexpectedly small`);
    assert.match(home, new RegExp(`tools/${slug}\\.html`));
    assert.match(catalog, new RegExp(`tools/${slug}\\.html`));
    assert.match(sitemap, new RegExp(`/tools/${slug}\\.html`));
    assert.match(seed, new RegExp(`'${slug}'`));
  }
});
