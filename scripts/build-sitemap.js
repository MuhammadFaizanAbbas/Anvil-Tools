// Rebuild crawlable static URLs from the canonical links in public pages.
// Article URLs remain in the existing dynamic journal sitemap.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../frontend');
const read = file => fs.readFileSync(file, 'utf8');
const home = read(path.join(root, 'index.html'));
const canonicalPattern = /<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/i;
const homeCanonical = home.match(canonicalPattern)?.[1];
if (!homeCanonical) throw Error('Homepage needs a canonical URL before generating sitemaps.');
const origin = new URL(homeCanonical).origin;
const xml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  if (['admin-panel', 'assets'].includes(entry.name)) return [];
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
});
const urls = new Set();
for (const file of walk(root)) {
  const html = read(file);
  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  if (metas.some(meta => /name="(?:robots|googlebot)"/i.test(meta) && /content="[^"]*\bnoindex\b/i.test(meta))) continue;
  if (metas.some(meta => /http-equiv="refresh"/i.test(meta))) continue;
  if (path.basename(file) === '404.html') continue;
  const canonical = html.match(canonicalPattern)?.[1];
  if (!canonical) throw Error(`Missing canonical: ${path.relative(root, file)}`);
  const url = new URL(canonical);
  if (url.origin !== origin) throw Error(`Canonical domain mismatch: ${path.relative(root, file)}`);
  if (url.search || url.hash) throw Error(`Unexpected canonical query or fragment: ${canonical}`);
  urls.add(url.href);
}
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + [...urls].sort().map(url => `  <url><loc>${xml(url)}</loc></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(root, 'sitemap-index.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ['sitemap.xml', 'journal-sitemap.xml'].map(file => `  <sitemap><loc>${xml(origin + '/' + file)}</loc></sitemap>`).join('\n') + '\n</sitemapindex>\n');
const robotsPath = path.join(root, 'robots.txt');
const rules = (fs.existsSync(robotsPath) ? read(robotsPath) : 'User-agent: *\nAllow: /\nDisallow: /admin-panel/\n').replace(/^Sitemap:.*(?:\r?\n|$)/gmi, '').trimEnd();
fs.writeFileSync(robotsPath, rules + `\n\nSitemap: ${origin}/sitemap-index.xml\n`);
console.log(`Generated ${urls.size} static URLs and a sitemap index including the published-article sitemap.`);
