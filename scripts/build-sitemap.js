// Rebuild crawlable static URLs from the canonical links in public pages.
// Article URLs remain in the existing dynamic journal sitemap.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../frontend');
const lastmodFile = path.resolve(__dirname, '../content/sitemap-lastmod.json');
const read = file => fs.readFileSync(file, 'utf8');
const lastmods = JSON.parse(read(lastmodFile));
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
const validDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};
const urls = new Map();
const usedPaths = new Set();
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
  if (urls.has(url.href)) throw Error(`Duplicate canonical URL: ${canonical}`);
  const lastmod = lastmods[url.pathname];
  if (!validDate(lastmod)) throw Error(`Missing or invalid lastmod for ${url.pathname} in ${path.relative(process.cwd(), lastmodFile)}`);
  urls.set(url.href, lastmod);
  usedPaths.add(url.pathname);
}
const unusedPaths = Object.keys(lastmods).filter(urlPath => !usedPaths.has(urlPath));
if (unusedPaths.length) throw Error(`Unused sitemap lastmod entries: ${unusedPaths.join(', ')}`);
const sortedUrls = [...urls].sort(([left], [right]) => left.localeCompare(right));
const staticLastmod = sortedUrls.reduce((latest, [, lastmod]) => lastmod > latest ? lastmod : latest, '0000-00-00');
fs.writeFileSync(path.join(root, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + sortedUrls.map(([url, lastmod]) => `  <url><loc>${xml(url)}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n') + '\n</urlset>\n');
// The journal sitemap is generated from live article records, so its index entry deliberately omits a guessed date.
fs.writeFileSync(path.join(root, 'sitemap-index.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + [`  <sitemap><loc>${xml(origin + '/sitemap.xml')}</loc><lastmod>${staticLastmod}</lastmod></sitemap>`, `  <sitemap><loc>${xml(origin + '/journal-sitemap.xml')}</loc></sitemap>`].join('\n') + '\n</sitemapindex>\n');
const robotsPath = path.join(root, 'robots.txt');
const rules = (fs.existsSync(robotsPath) ? read(robotsPath) : 'User-agent: *\nAllow: /\nDisallow: /admin-panel/\n').replace(/^Sitemap:.*(?:\r?\n|$)/gmi, '').trimEnd();
fs.writeFileSync(robotsPath, rules + `\n\nSitemap: ${origin}/sitemap-index.xml\n`);
console.log(`Generated ${urls.size} dated static URLs and a sitemap index including the published-article sitemap.`);
