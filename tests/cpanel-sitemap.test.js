const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('cPanel routes public metadata through domain-aware handlers', () => {
  const htaccess = fs.readFileSync('frontend/.htaccess', 'utf8');
  for (const [route, extension] of [['sitemap', 'xml'], ['sitemap-index', 'xml'], ['robots', 'txt'], ['journal-sitemap', 'xml']]) {
    assert.ok(htaccess.includes(`RewriteRule ^${route}\\.${extension}$`), route);
  }
  assert.match(htaccess, /RewriteRule \^journal\/\(/);
  assert.match(htaccess, /journal\.php\?slug=\$1/);
  assert.match(htaccess, /RewriteRule \^journal-images\/\(/);
  assert.match(htaccess, /journal-image\.php\?id=\$1/);
  assert.match(htaccess, /RewriteRule \^\$ static-page\.php\?path=index\.html/);
  assert.match(htaccess, /RewriteRule \^\(\.\+\\\.html\)\$ static-page\.php\?path=\$1/);

  const staticPage = fs.readFileSync('frontend/static-page.php', 'utf8');
  assert.match(staticPage, /public_site_origin\(\)/);
  assert.match(staticPage, /str_replace\('https:\/\/anviltools\.vercel\.app', public_site_origin\(\), \$template\)/);
  assert.match(staticPage, /realpath\(__DIR__/);
  assert.match(staticPage, /Vary: Host/);

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

  for (const handler of ['journal.php', 'journal-image.php']) {
    const source = fs.readFileSync(`frontend/${handler}`, 'utf8');
    assert.match(source, /public_site_origin\(\)/);
    assert.match(source, /fetch_public_backend/);
  }
});
