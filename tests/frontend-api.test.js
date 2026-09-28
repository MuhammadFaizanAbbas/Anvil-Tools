const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  const storage = new Map();
  const calls = [];
  const context = { window: { ANVIL_CONFIG: { API_BASE_URL: 'https://backend.vercel.app/' } }, Headers,
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    fetch: async (url, options) => { calls.push({ url, options }); return { status: 200 }; },
  };
  vm.runInNewContext(fs.readFileSync('frontend/assets/js/api.js', 'utf8'), context);
  return { api: context.window.AnvilAPI, calls };
}
test('frontend targets configured API and sends token without cross-site cookies', async () => {
  const { api, calls } = setup();
  api.setSession({ accessToken: 'test-token', expiresAt: Date.now() / 1000 + 100 });
  await api.fetch('/api/admin/me');
  assert.equal(calls[0].url, 'https://backend.vercel.app/api/admin/me');
  assert.equal(calls[0].options.headers.get('Authorization'), 'Bearer test-token');
  assert.equal(calls[0].options.credentials, 'omit');
});
test('expired and cleared sessions do not send authorization', async () => {
  const { api, calls } = setup();
  api.setSession({ accessToken: 'expired', expiresAt: 1 });
  await api.fetch('/api/admin/me');
  api.setSession({ accessToken: 'valid', expiresAt: Date.now() / 1000 + 100 });
  api.clearSession();
  await api.fetch('/api/admin/me');
  assert.ok(calls.every(call => !call.options.headers.has('Authorization')));
});
