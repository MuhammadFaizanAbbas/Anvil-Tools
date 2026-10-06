const { test } = require('node:test');
const assert = require('node:assert/strict');
const { privateBucketGuard } = require('../backend/src/lib/private-media');

test('concurrent image requests establish a private bucket once through Storage API', async () => {
  const calls = [];
  const ensure = privateBucketGuard({ updateBucket: async (...args) => { calls.push(args); return { data: {} }; } });
  await Promise.all([ensure(), ensure(), ensure()]);
  assert.deepEqual(calls, [['editorial-media', { public: false }]]);
});

test('failed privacy configuration fails closed and can recover on the next request', async () => {
  let fail = true;
  const ensure = privateBucketGuard({ updateBucket: async () => fail ? { error: { message: 'private credentials' } } : { data: {} } });
  await assert.rejects(ensure(), /privacy could not be confirmed/);
  fail = false;
  await ensure();
});
