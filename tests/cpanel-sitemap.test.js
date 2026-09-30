const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('cPanel routes public metadata through domain-aware handlers', () => {
  const htaccess = fs.readFileSync('frontend/.htaccess', 'utf8');
  for (const [route, extension] of [['sitemap', 'xml'], ['sitemap-index', 'xml'], ['robots', 'txt'], ['journal-sitemap', 'xml']]) {
    assert.ok(htaccess.includes(`RewriteRule ^${route}\\.${extension}$`), route);
  }

  const metadata = fs.readFileSync('frontend/site-metadata.php', 'utf8');
  assert.match(metadata, /str_replace\('https:\/\/anviltools\.vercel\.app', \$origin/);
  assert.match(metadata, /'sitemap' =>/);
  assert.match(metadata, /'index' =>/);
  assert.match(metadata, /'robots' =>/);

  const journal = fs.readFileSync('frontend/journal-sitemap.php', 'utf8');
  assert.match(journal, /anvil-tools-backend\.vercel\.app\/api\/public\/sitemap\.xml/);
  assert.match(journal, /'X-Frontend-Origin: ' \. \$origin/);
  assert.match(journal, /CURLOPT_CONNECTTIMEOUT/);
  assert.match(journal, /http_response_code\(502\)/);
});
