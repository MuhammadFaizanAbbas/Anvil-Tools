// Validate the earlier prepared correction transaction against current sources.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const sql = fs.readFileSync('deployment/crawler-recheck-2026-10-05/publish.sql', 'utf8');
const items = JSON.parse(sql.split('$audit_payload$')[1]);
const library = require('../content/editorial/published-library.json');
assert.equal(items.length, 4);
assert.doesNotMatch(sql, /\b(?:DELETE|TRUNCATE|DROP|ALTER|CREATE)\s+(?:TABLE|POLICY|FROM|FUNCTION|SCHEMA)/i);
const report = [];
for (const item of items) {
  const guide = library.find(guide => guide.slug === item.slug); assert.ok(guide);
  const body = fs.readFileSync('content/editorial/' + guide.bodyFile, 'utf8').replace(/\r\n?/g, '\n').trim();
  assert.equal(item.body, body);
  assert.equal(crypto.createHash('md5').update(body).digest('hex'), item.bodyMd5);
  assert.ok(item.metadata.cover_image_id && item.metadata.status === 'published');
  report.push({ slug: item.slug, expectedBodyMd5: item.expectedBodyMd5, bodyMd5: item.bodyMd5, bytes: Buffer.byteLength(body), metadata: item.metadata });
}
fs.writeFileSync('docs/audits/full-audit-publication-prepared.json', JSON.stringify({ checkedAt: new Date().toISOString(), articles: report, sqlSha256: crypto.createHash('sha256').update(sql).digest('hex'), sourceMatch: true, transactionSavesRevisions: sql.includes('INSERT INTO public.post_revisions') }, null, 2) + '\n');
console.log(JSON.stringify(report.map(item => ({ slug: item.slug, expectedBodyMd5: item.expectedBodyMd5, bodyMd5: item.bodyMd5, bytes: item.bytes }))));
