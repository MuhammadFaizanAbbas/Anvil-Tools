// Read-only before/after rollout check. --after fails if the release is missing.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const experiments = require('../content/editorial/experiments.json');
const after = process.argv.includes('--after');
const origin = 'https://nevco.online';
const report = { checkedAt: new Date().toISOString(), state: after ? 'after-deployment-check' : 'before-deployment-observation', redirects: [], pages: [], problems: [] };
async function read(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
  return { status: response.status, location: response.headers.get('location'), type: response.headers.get('content-type'), body: await response.text() };
}
(async () => {
  const variants = ['http://nevco.online','http://www.nevco.online','https://www.nevco.online','https://nevco.online'];
  for (const host of variants) {
    for (const route of ['/', '/tools/json-formatter.html?review-check=1']) {
      const start = host + route;
      let url = start;
      const steps = [];
      for (let hop = 0; hop < 5; hop++) {
        const response = await read(url, { redirect: 'manual' });
        steps.push({ url, status: response.status, location: response.location });
        if (![301,302,307,308].includes(response.status) || !response.location) break;
        url = new URL(response.location,url).href;
      }
      const canonical = url === origin + route && steps.at(-1).status === 200;
      const permanent = steps.slice(0,-1).every(step=>[301,308].includes(step.status));
      report.redirects.push({start,steps,canonical,permanent});
      if(!canonical||!permanent)report.problems.push(`Noncanonical or temporary redirect chain: ${start}`);
    }
  }
  const routes = ['/robots.txt','/sitemap.xml','/sitemap-index.xml','/journal-sitemap.xml','/blog/index.html','/privacy-policy.html','/about.html', ...experiments.map(item=>`/blog/${item.slug}.html`), '/assets/examples/experiments/results.json', '/assets/examples/experiments/pdf-inspection.json'];
  const observations = await Promise.allSettled(routes.map(async route=>{
    const response = await read(origin+route);
    const record = {route,status:response.status,type:response.type};
    if(route === '/blog/index.html'){
      record.retryInHtml = /Try again|id="blogsRetry"/.test(response.body);
      record.unnecessaryPagination = /id="blogPagination"/.test(response.body);
      record.experimentLinks = experiments.filter(item=>response.body.includes(`/blog/${item.slug}.html`)).length;
      if(record.retryInHtml||record.unnecessaryPagination||record.experimentLinks!==4)report.problems.push('Blog release absent or successful HTML includes unnecessary controls');
    }
    if(route === '/privacy-policy.html'){
      record.adsSettings = response.body.includes('https://adssettings.google.com/');
      if(!record.adsSettings)report.problems.push('Explicit Ads Settings privacy link absent');
    }
    if(route === '/about.html'){
      record.editorialDisclosure = response.body.includes('id="editorial-testing"');
      if(!record.editorialDisclosure)report.problems.push('Editorial disclosure absent');
    }
    if(route.endsWith('.xml'))record.wrongHost = [...response.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]).filter(url=>new URL(url).origin!==origin);
    if(response.status!==200)report.problems.push(`${route} returned ${response.status}`);
    return record;
  }));
  observations.forEach((item,index)=>{
    if(item.status==='fulfilled')report.pages.push(item.value);
    else { report.pages.push({route:routes[index],error:item.reason.message});report.problems.push(`${routes[index]}: ${item.reason.message}`); }
  });
  const response = await read('https://anvil-tools-backend.vercel.app/api/public/posts/best-practices-for-temporary-email-when-working-with-signups');
  const post=JSON.parse(response.body);
  report.temporaryEmail={status:response.status,words:String(post.body||'').trim().split(/\s+/).length,updatedAt:post.updated_at};
  if(after){
    assert.ok(report.temporaryEmail.words < 3500);
    for(const page of report.pages)if(page.wrongHost?.length)report.problems.push(`Wrong sitemap host: ${page.route}`);
  }
  fs.writeFileSync(`docs/audits/readiness-live-${after?'after':'before'}.json`,JSON.stringify(report,null,2)+'\n');
  console.log(`${report.redirects.length} redirect chains and ${report.pages.length} public routes checked. Temporary-email article: ${report.temporaryEmail.words} whitespace words.`);
  console.log(after ? `Unresolved live problems: ${report.problems.length}` : 'Before-deployment observations recorded; missing new files are expected until upload.');
  if(after)assert.deepEqual(report.problems,[],'The complete release is not yet verified live.');
})().catch(error=>{console.error(error);process.exitCode=1;});
