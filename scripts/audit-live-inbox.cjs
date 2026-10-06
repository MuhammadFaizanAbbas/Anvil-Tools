// Allocate and forget one test inbox. No outgoing email or external sender test.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = 'https://anvil-tools-backend.vercel.app/api/temp-mail';
const report = { checkedAt: new Date().toISOString(), steps: [], limits: ['One fresh inbox; this is not a delivery, throughput or sender-to-reader test.', 'Inbox address and access capability are kept in memory and excluded from this report.'] };
let capability;
async function request(path, options = {}) {
  const started = performance.now();
  const response = await fetch(base + path, { ...options, signal: AbortSignal.timeout(30000) });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data, ms: Math.round(performance.now() - started) };
}
(async () => {
  const created = await request('/create', { method: 'POST' });
  report.steps.push({ name: 'create one real provider-backed inbox', status: created.status, ms: created.ms });
  assert.equal(created.status, 200); capability = created.data.capability;
  assert.ok(typeof capability === 'string' && /^[a-f0-9]{64}$/.test(capability), 'Inbox capability format is invalid');
  assert.ok(typeof created.data.address === 'string' && created.data.address.includes('@'), 'Inbox address format is invalid');
  const read = await request('/messages', { headers: { 'X-Inbox-Capability': capability } });
  report.steps.push({ name: 'restore and poll with header capability', status: read.status, ms: read.ms, sameAddress: read.data.address === created.data.address, messageCount: read.data.messages?.length });
  assert.equal(read.status, 200); assert.ok(read.data.address === created.data.address, 'Restored inbox identity differs');
  const rejected = await request('/messages', { headers: { 'X-Inbox-Capability': '0'.repeat(64) } });
  report.steps.push({ name: 'another capability cannot access the test inbox', status: rejected.status, ms: rejected.ms });
  assert.equal(rejected.status, 404);
  const removed = await request('/delete', { method: 'POST', headers: { 'X-Inbox-Capability': capability } });
  report.steps.push({ name: 'forget own test inbox', status: removed.status, ms: removed.ms });
  assert.equal(removed.status, 200);
  const gone = await request('/messages', { headers: { 'X-Inbox-Capability': capability } });
  report.steps.push({ name: 'deleted capability no longer works', status: gone.status, ms: gone.ms });
  assert.equal(gone.status, 404); capability = null;
  report.passed = true;
})().catch(error => { report.error = error.message; process.exitCode = 1; }).finally(async () => {
  if (capability) {
    try { const removed = await request('/delete', { method: 'POST', headers: { 'X-Inbox-Capability': capability } }); report.cleanupStatus = removed.status; }
    catch (_) { report.cleanupStatus = 'failed; provider/website expiry still applies'; }
  }
  fs.writeFileSync('docs/audits/full-audit-inbox-live.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
});
