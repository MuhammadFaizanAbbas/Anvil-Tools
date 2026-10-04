const fs = require('node:fs');
const guides = require('./site-generator/editorial-guides.json').filter(guide => Object.hasOwn(guide, 'retiredTo'));
const marker = 'Retired unillustrated guides';
const rules = guides.map(guide => guide.retiredTo
  ? `  RewriteRule ^blog/${guide.slug}\\.html/?$ ${guide.retiredTo} [R=301,L,NC]`
  : `  RewriteRule ^blog/${guide.slug}\\.html/?$ - [G,L,NC]`).join('\n');
let apache = fs.readFileSync('frontend/.htaccess', 'utf8').replace(/\r\n/g, '\n');
apache = apache.replace(new RegExp(`  # ${marker}\\n[\\s\\S]*?  # End ${marker}\\n`), '');
apache = apache.replace('  RewriteEngine On\n', `  RewriteEngine On\n  # ${marker}\n${rules}\n  # End ${marker}\n`);
if (!apache.includes('ErrorDocument 410')) apache = apache.replace('ErrorDocument 404 /404.html', 'ErrorDocument 404 /404.html\nErrorDocument 410 /404.html');
fs.writeFileSync('frontend/.htaccess', apache);
for (const file of ['vercel.json', 'frontend/vercel.json']) {
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const retiredPatterns = new Set(guides.map(guide => `^/blog/${guide.slug}\\.html/?$`));
  config.routes = config.routes.filter(route => !retiredPatterns.has(route.src));
  config.routes.unshift(...guides.map(guide => guide.retiredTo
    ? { src: `^/blog/${guide.slug}\\.html/?$`, status: 308, headers: { Location: guide.retiredTo } }
    : { src: `^/blog/${guide.slug}\\.html/?$`, dest: '/404.html', status: 410, headers: { 'X-Robots-Tag': 'noindex, follow' } }));
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
console.log(`Configured ${guides.length} retired static paths on Apache and Vercel.`);
