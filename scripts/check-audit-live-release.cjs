// Public production checks only; never reads credentials or sends messages.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const origin = 'https://anviltools.vercel.app';
const report = { checkedAt: new Date().toISOString(), origin, checks: [], failures: [] };
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
async function check(route, inspect) {
  try {
    const response = await fetch(origin + route, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, route);
    await inspect(response);
    report.checks.push({ route, passed: true });
  } catch (error) { report.failures.push({ route, error: error.message }); }
}
async function security(response) {
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
  const policy = response.headers.get('content-security-policy') || '';
  for (const directive of ["object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'"]) assert.ok(policy.includes(directive), directive);
  const permissions = response.headers.get('permissions-policy') || '';
  for (const directive of ['camera=()', 'microphone=()', 'geolocation=()']) assert.ok(permissions.includes(directive), directive);
}
(async () => {
  await Promise.all([
    check('/', async response => { await security(response); assert.match(await response.text(), /main\.js\?v=20261006-audit1/); }),
    check('/blog/index.html', async response => {
      await security(response);
      const html = await response.text();
      assert.doesNotMatch(html, /Try again|id="blogsRetry"|id="blogPagination"/);
      for (const article of require('../content/editorial/experiments.json')) assert.ok(html.includes('/blog/' + article.slug + '.html'));
    }),
    check('/about.html', async response => { await security(response); assert.match(await response.text(), /id="editorial-testing"/); }),
    check('/privacy-policy.html', async response => {
      await security(response);
      const html = await response.text();
      for (const text of ['jsDelivr', 'adssettings.google.com', 'youradchoices.com/control']) assert.ok(html.includes(text), text);
    }),
    ...['assets/js/main.js', 'assets/vendor/tool-libraries/pdf-lib-1.17.1.min.js', 'assets/vendor/tool-libraries/qrcode-1.0.0.min.js'].map(file => check('/' + file + '?v=20261006-audit1', async response => {
      const local = fs.readFileSync('frontend/' + file);
      const deployed = Buffer.from(await response.arrayBuffer());
      // Git normalizes source line endings in the deployed checkout. Licensed
      // bundles still require byte-for-byte identity with their pinned copies.
      const normalize = bytes => file === 'assets/js/main.js' ? Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n')) : bytes;
      const expected = digest(normalize(local));
      const actual = digest(normalize(deployed));
      assert.equal(actual, expected, 'Deployed asset must match the reviewed source: ' + file);
      report.checks.push({ asset: file, sha256: actual, comparison: file === 'assets/js/main.js' ? 'Source text with LF line endings' : 'Exact bytes', passed: true });
    }))
  ]);
  report.passed = !report.failures.length;
  report.limits = ['Checks apply to the Vercel frontend; the separate cPanel upload remains pending.', 'These public checks do not certify private account state, future ads or every security property.'];
  fs.writeFileSync('docs/audits/full-audit-live-release.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
