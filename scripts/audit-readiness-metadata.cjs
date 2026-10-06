const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { renderArticle } = require('../backend/src/lib/articles');
const root = 'frontend';
const walk = folder => fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry => {
  if(['assets','admin-panel'].includes(entry.name))return [];
  const file=path.join(folder,entry.name);return entry.isDirectory()?walk(file):file.endsWith('.html')?[file]:[];
});
const report={checkedAt:new Date().toISOString(),scope:'repository metadata and canonical sources; Google search cache is external',pages:[]};
const sitemap=new Set([...fs.readFileSync('frontend/sitemap.xml','utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]));
for(const file of walk(root)){
  const html=fs.readFileSync(file,'utf8');
  if(/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html))continue;
  const title=html.match(/<title>([^<]+)<\/title>/i)?.[1];
  const description=html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i)?.[1];
  const ogTitle=html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/i)?.[1];
  const ogDescription=html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"/i)?.[1];
  const canonical=html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1];
  for(const [label,value] of Object.entries({title,description,ogTitle,ogDescription}))assert.ok(value?.includes('Anvil Tools'),`${file} ${label}`);
  assert.ok(canonical?.startsWith('https://anviltools.vercel.app/'),file);
  assert.ok(sitemap.has(canonical),`${file} absent from sitemap`);
  assert.doesNotMatch(html,/Decide Once|weighted decision matrix|Nevco\s*[-–—]/i,file);
  const schemas=[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
  report.pages.push({file:file.replaceAll('\\','/'),title,canonical,schemas:schemas.length,passed:true});
}
assert.equal(report.pages.length,sitemap.size);
const article=renderArticle({slug:'test',title:'Test',excerpt:'Recorded example',body:'## Example\n\nSource text'},'https://nevco.online');
assert.match(article,/content="Anvil Tools: Recorded example"/);
assert.match(article,/property="og:title" content="Test \| Anvil Tools"/);
const robots=fs.readFileSync('frontend/robots.txt','utf8');
assert.match(robots,/User-agent: \*[\s\S]*Allow: \//);
assert.doesNotMatch(robots,/Disallow: \/(?:\s|$)|User-agent: (?:Mediapartners-Google|Google-Display-Ads-Bot)/);
const apache=fs.readFileSync('frontend/.htaccess','utf8');
assert.ok(apache.indexOf('www\\.nevco\\.online')<apache.indexOf('# Retired unillustrated guides'));
assert.match(apache,/https:\/\/nevco.online%\{REQUEST_URI\} \[R=301,L,NE\]/);
assert.match(apache,/HTTP:X-Forwarded-Proto/);
for(const file of ['vercel.json','frontend/vercel.json']){
  const first=JSON.parse(fs.readFileSync(file,'utf8')).routes[0];
  assert.equal(first.has[0].value,'www.nevco.online');assert.equal(first.status,308);
  assert.equal(first.headers.Location,'https://nevco.online/$1');
}
fs.writeFileSync('docs/audits/readiness-metadata.json',JSON.stringify(report,null,2)+'\n');
console.log(`${report.pages.length} canonical public pages passed branding, social metadata, schema parsing, and sitemap consistency checks.`);
