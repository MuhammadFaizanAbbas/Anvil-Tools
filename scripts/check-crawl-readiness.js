// Read-only checks of deployed public HTML, crawl directives, and sitemap files.
const fs = require('node:fs');
const target = new URL(process.argv[2] || 'https://nevco.online');
if (!['https:', 'http:'].includes(target.protocol) || target.username || target.password) throw Error('Provide a public HTTP(S) site origin.');
const origin = target.origin;
async function read(path) {
  const response = await fetch(`${origin}${path}`, { signal: AbortSignal.timeout(20000) });
  return { status: response.status, headers: response.headers, text: await response.text() };
}
(async () => {
  const paths = ['/blog/', '/robots.txt', '/sitemap.xml', '/sitemap-index.xml', '/journal-sitemap.xml', '/ads.txt'];
  const checks = await Promise.allSettled(paths.map(read));
  const report = { checkedAt: new Date().toISOString(), origin, checks: [] };
  checks.forEach((result, index) => {
    if (result.status === 'rejected') {
      report.checks.push({ path: paths[index], error: result.reason.message });
      process.exitCode = 1;
      return;
    }
    const { status, text, headers } = result.value;
    const check = { path: paths[index], status };
    if (index === 0) {
      check.articleLinks = [...new Set([...text.matchAll(/href="(\/(?:journal\/[^"?#]+|blog\/[^"?#]+\.html))"/g)].map(match => match[1]).filter(link => !link.endsWith('/index.html')))];
      check.serverRendered = /data-server-rendered="true"/.test(text);
      check.requiresJavaScriptForListing = /Enable JavaScript to see the latest published blogs/.test(text);
      check.noindex = /noindex/i.test(headers.get('x-robots-tag') || '');
      if (!check.articleLinks.length || check.requiresJavaScriptForListing || check.noindex) process.exitCode = 1;
    } else if (index === 1) {
      check.sitemap = text.match(/^Sitemap:\s*(.+)$/m)?.[1]?.trim();
      check.blocksBlog = /^Disallow:\s*\/(?:\s*$|blog)/m.test(text);
      if (check.blocksBlog || !check.sitemap) process.exitCode = 1;
    } else if (index >= 2 && index <= 4) {
      check.urls = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
      check.wrongOrigin = check.urls.filter(url => new URL(url).origin !== origin);
      if (check.wrongOrigin.length || !check.urls.length) process.exitCode = 1;
    } else {
      check.advertisingDisabled = /Advertising is (?:not enabled|disabled)/i.test(text);
      check.hasSeller = /^google\.com,\s*pub-\d{16},\s*DIRECT,\s*f08c47fec0942fa0\s*$/m.test(text);
    }
    if (status !== 200) process.exitCode = 1;
    report.checks.push(check);
  });
  fs.mkdirSync('docs/audits', { recursive: true });
  fs.writeFileSync('docs/audits/crawl-readiness.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, checks: report.checks.map(check => {
    if (!check.urls) return check;
    const { urls, ...details } = check;
    return { ...details, urlCount: urls.length, sampleUrls: urls.slice(0, 3) };
  }) }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
