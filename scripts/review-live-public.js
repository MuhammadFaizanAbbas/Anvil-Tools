// Read-only pre-submission inspection. Posts and verification tags are excluded.
const fs = require('node:fs');
const path = require('node:path');
const base = 'https://anviltools.vercel.app';
const root = path.resolve(__dirname, '../frontend');
const walk = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? (['assets','admin-panel'].includes(e.name) ? [] : walk(path.join(dir,e.name))) : e.name.endsWith('.html') ? [path.join(dir,e.name)] : []);
(async () => {
 const files = walk(root).filter(f=>!f.includes(path.sep+'blog'+path.sep));
 const pages=[], missingLocalLinks=[], assets=new Set();
 let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{
  while(cursor<files.length){
   const file=files[cursor++], route='/'+path.relative(root,file).replace(/\\/g,'/');
   const response=await fetch(base+route,{signal:AbortSignal.timeout(25000)});
   const html=await response.text();
   pages.push({route,status:response.status,h1:(html.match(/<h1\b/g)||[]).length,hasPolicy:html.includes('privacy-policy.html'),hasAdLoader:/<script[^>]+src=["'][^"']*(?:adsbygoogle|googletagmanager|google-analytics)/i.test(html),inactiveChoices:html.includes('id="consent-personalized"')});
   for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const url=new URL(match[1].replace(/&amp;/g,'&'),base+route);
    if(url.origin!==base||url.pathname.startsWith('/journal')||url.pathname.startsWith('/blog')) continue;
    const local=path.join(root,decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!fs.existsSync(local)) missingLocalLinks.push({route,target:url.pathname});
    if(/\.(js|css)$/.test(url.pathname)) assets.add(url.pathname);
   }
  }
 }));
 const assetResults=[]; const paths=[...assets]; cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<paths.length){const route=paths[cursor++];const res=await fetch(base+route,{method:'HEAD',signal:AbortSignal.timeout(25000)});assetResults.push({route,status:res.status});}}));
 const missing=await fetch(base+'/audit-nonexistent-page-20260930',{signal:AbortSignal.timeout(25000)});
 const report={checkedAt:new Date().toISOString(),scope:'Static pages excluding blog/posts; no submissions or tool mutations',pages:pages.sort((a,b)=>a.route.localeCompare(b.route)),missingLocalLinks,assets:assetResults,unknownUrlStatus:missing.status};
 fs.writeFileSync('docs/audits/live-submission-review.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({pages:pages.length,pageFailures:pages.filter(p=>p.status!==200&&p.route!='/404.html'),missingLocalLinks,assets:assetResults.length,assetFailures:assetResults.filter(a=>a.status!==200),unexpectedAdLoaders:pages.filter(p=>p.hasAdLoader),inactiveChoices:pages.filter(p=>p.inactiveChoices).length,unknownUrlStatus:missing.status},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
