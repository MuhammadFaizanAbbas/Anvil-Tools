const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const report = { checkedAt: new Date().toISOString(), files: 0, checks: [], issues: [], externalScripts: [],
  limits: ['A targeted source scan cannot prove absence of every possible vulnerability or editorial error.', 'Licensed vendor bundles are preserved; npm advisories are checked separately.'] };
function visit(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) { if (entry.name !== 'vendor') visit(file); continue; }
    if (!/\.(?:html|js|php|css|xml)$/.test(file)) continue;
    const text = fs.readFileSync(file, 'utf8'); report.files++;
    if (/\uFFFD|Ã[\x80-\xBF]|â€|Â[\x80-\xBF]/.test(text)) report.issues.push({ file, issue: 'Possible corrupted UTF-8 text' });
    if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|sb_secret_[\w-]{15,}|SUPABASE_SERVICE_ROLE_KEY\s*[:=]\s*['"][^'"]{20}/.test(text)) report.issues.push({ file, issue: 'Potential private credential in public source' });
    if (/\.html$/.test(file)) {
      for (const match of text.matchAll(/<(?:script)\b[^>]*\bsrc=["'](https?:[^"']+)/gi)) report.externalScripts.push({ file, url: match[1] });
      for (const match of text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) {
        const dynamic = match[1].match(/import\("(https?:[^"]+)"\)/);
        if (dynamic) report.externalScripts.push({ file, url: dynamic[1], deferred: true });
      }
      if (/<script\b[^>]*src=["'][^"']*(?:adsbygoogle|fundingchoices|\/ads\.js|\/cmp\.js)/i.test(text)) report.issues.push({ file, issue: 'Advertising/consent loader is active unexpectedly' });
    }
  }
}
visit('frontend');
report.checks.push({ name: 'local pinned PDF and QR bundles and licenses', passed: ['pdf-lib-1.17.1.min.js','qrcode-1.0.0.min.js','pdf-lib-LICENSE.txt','qrcode-LICENSE.txt'].every(name => fs.existsSync('frontend/assets/vendor/tool-libraries/' + name)) });
report.checks.push({ name: 'only intended deferred background module uses a CDN', passed: report.externalScripts.length === 1 && report.externalScripts[0].deferred && report.externalScripts[0].url === 'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm' });
report.passed = !report.issues.length && report.checks.every(check => check.passed);
fs.writeFileSync('docs/audits/full-audit-public-source.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ files: report.files, passed: report.passed, issues: report.issues, externalScripts: report.externalScripts }));
assert.equal(report.passed, true);
