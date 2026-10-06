// Bounded, sequential requests. No valid contact submission or outgoing mail.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = 'https://anvil-tools-backend.vercel.app';
const report = { checkedAt: new Date().toISOString(), origin: base, latency: [], checks: [], limits: [
  'Five sequential samples per endpoint are a latency sample, not a stress/load test.',
  'No administrator credentials, outgoing mail, or contact submissions are used.',
  'Desktop network measurements are separate from browser phone emulation.'
] };
async function request(path, options = {}) {
  const started = performance.now();
  const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(30000) });
  const body = await response.text();
  return { response, body, ms: Math.round(performance.now() - started) };
}
(async () => {
  for (const path of ['/api/health', '/api/tools', '/api/public/posts', '/api/public/recommendations?limit=6', '/api/public/blog', '/api/public/articles/best-practices-for-background-removal-when-working-with-design']) {
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const { response, body, ms } = await request(path, { headers: { 'X-Frontend-Origin': 'https://nevco.online' } });
      samples.push({ status: response.status, ms, bytes: Buffer.byteLength(body) });
    }
    const sorted = samples.map(sample => sample.ms).sort((a, b) => a - b);
    report.latency.push({ path, samples, p50Ms: sorted[2], maxMs: sorted[4], successful: samples.every(sample => sample.status === 200) });
    console.log(JSON.stringify(report.latency.at(-1)));
  }
  for (const path of ['/api/admin/me', '/api/admin/users', '/api/admin/contacts', '/api/admin/media', '/api/admin/audit', '/api/admin/system']) {
    for (const invalidToken of [false, true]) {
      const { response, body } = await request(path, invalidToken ? { headers: { Authorization: 'Bearer invalid-audit-token' } } : {});
      report.checks.push({ name: 'private endpoint rejects unauthenticated access', path, invalidToken, status: response.status, passed: response.status === 401 && !/service_role|sb_secret_/.test(body) });
    }
  }
  for (const [path, expected] of [['/api/temp-mail/messages', 404], ['/api/temp-mail/messages/42', 404], ['/api/public/posts/does-not-exist-audit', 404], ['/api/public/posts?limit=banana&offset=0', 400], ['/api/public/post-images/not-an-id', 404]]) {
    const { response } = await request(path);
    report.checks.push({ name: 'invalid public input fails safely', path, status: response.status, expected, passed: response.status === expected });
  }
  const preflight = await request('/api/temp-mail/messages', { method: 'OPTIONS', headers: { Origin: 'https://nevco.online', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'X-Inbox-Capability' } });
  report.checks.push({ name: 'cross-origin inbox header allowed', status: preflight.response.status, allowed: preflight.response.headers.get('access-control-allow-headers'), passed: preflight.response.status === 204 && /X-Inbox-Capability/i.test(preflight.response.headers.get('access-control-allow-headers') || '') });
  const auth = await request('/api/auth/config');
  const config = JSON.parse(auth.body);
  let role;
  try { role = JSON.parse(Buffer.from(config.anonKey.split('.')[1], 'base64url').toString()).role; } catch (_) { role = config.anonKey?.startsWith('sb_publishable_') ? 'publishable' : 'unknown'; }
  report.checks.push({ name: 'public auth config contains only a public key', status: auth.response.status, role, passed: auth.response.status === 200 && ['anon', 'publishable'].includes(role) });
  if (['anon', 'publishable'].includes(role)) {
    for (const table of ['contacts', 'contact_requests', 'temp_mail_sessions', 'media_assets', 'posts_removed_backup']) {
      const response = await fetch(`${config.url}/rest/v1/${table}?select=*&limit=0`, { headers: { apikey: config.anonKey, Authorization: `Bearer ${config.anonKey}` }, signal: AbortSignal.timeout(20000) });
      await response.arrayBuffer();
      report.checks.push({ name: 'anonymous REST role has no private table access', table, status: response.status, passed: [401, 403, 404].includes(response.status) });
    }
  }
  report.passed = report.latency.every(item => item.successful) && report.checks.every(item => item.passed);
  assert.equal(report.passed, true, 'Inspect API audit findings');
})().catch(error => { report.error = error.message; process.exitCode = 1; }).finally(() => {
  const file = process.argv.find(arg => arg.startsWith('--report='))?.slice(9) || 'docs/audits/full-audit-api.json';
  fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ passed: report.passed, checks: report.checks.length, error: report.error }));
});
