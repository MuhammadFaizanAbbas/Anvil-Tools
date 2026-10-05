const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
const pages=walk('frontend').filter(file=>file.endsWith('.html')&&!file.includes('admin-panel'));
test('public pages have readable metadata and no dormant ad boxes or placeholder policies',()=>{
 for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1,file);
  if (file.endsWith('article.html')) assert.match(html,/<meta name="robots" content="noindex, follow">/,file);
  else assert.match(html,/<link rel="canonical" href="https:\/\/anviltools\.vercel\.app\//,file);
  assert.match(html,/assets\/css\/content\.css/,file);
  assert.ok(!html.includes('class="ad-slot"'),file);
  assert.ok(!html.includes('replace this date'),file);
  assert.ok(!html.includes('adsbygoogle'),file);
 }
 assert.ok(!fs.readFileSync('frontend/ads.txt','utf8').includes('pub-0000000000000000'));
});
test('all tool pages contain specific accessible FAQ answers and functional destinations',()=>{
 const faqs=JSON.parse(fs.readFileSync('scripts/site-generator/tool-faqs.json','utf8'));
 assert.equal(Object.keys(faqs).length,20);
 for(const slug of Object.keys(faqs)){
  const html=fs.readFileSync(`frontend/tools/${slug}.html`,'utf8');
  const questions = [...html.matchAll(/<summary>(.*?)<\/summary>/g)].map(match => match[1]);
  assert.equal(new Set(questions).size, questions.length, `${slug}: FAQ questions must be distinct`);
  assert.match(html, /<!-- checked-example -->/, `${slug}: a specific worked example is required`);
  for(const [question] of faqs[slug])assert.ok(html.includes(question.replace(/&/g,'&amp;').replace(/'/g,'&#x27;')),slug);
  assert.match(html,/What to use next/,slug);
 }
});
test('upload zones expose keyboard focus and About matches the Contact layout',()=>{
 for(const [slug,id] of [['background-remover','bg'],['pdf-merge','pm'],['image-to-pdf','ip']]){
  const html=fs.readFileSync(`frontend/tools/${slug}.html`,'utf8');
  assert.match(html,new RegExp(`id="${id}-dropzone" role="button" tabindex="0"`));
  assert.match(html,new RegExp(`for="${id}-file-input"`));
  assert.match(fs.readFileSync(`frontend/assets/js/tools/${slug}.js`,'utf8'),/addEventListener\('keydown'/);
 }
 assert.match(fs.readFileSync('frontend/about.html','utf8'),/contact-layout about-layout/);
});
