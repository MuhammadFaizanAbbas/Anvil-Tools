const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup(overrides = {}) {
  const storage = new Map();
  const calls = [];
  const context = { window: { ANVIL_CONFIG: { API_BASE_URL: 'https://backend.vercel.app/' }, location: { origin: 'https://site-one.example' } }, Headers,
    sessionStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => { calls.push({ url, options }); return Response.json({ ok: true }); },
    ...overrides,
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
  assert.equal(calls[0].options.headers.get('X-Frontend-Origin'), 'https://site-one.example');
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

test('blocked session storage leaves public API available and explains failed sign-in', async () => {
  const denied = () => { throw new Error('Storage denied'); };
  const { api, calls } = setup({ sessionStorage: { getItem: denied, setItem: denied, removeItem: denied } });
  assert.equal((await api.fetch('/api/public/posts')).status, 200);
  assert.equal(calls[0].options.headers.has('Authorization'), false);
  assert.throws(() => api.setSession({}), /Allow session storage/);
  api.clearSession();
});

test('a stalled request times out and a subsequent request can succeed', async () => {
  let stalled = true;
  const { api } = setup({ fetch: async (url, { signal }) => stalled ? new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  }) : Response.json({ ok: true }) });
  await assert.rejects(api.fetch('/api/public/posts', { timeoutMs: 20 }), /timed out/);
  stalled = false;
  assert.deepEqual(await (await api.fetch('/api/public/posts')).json(), { ok: true });
});

test('caller cancellation remains effective', async () => {
  const { api } = setup({ fetch: async (url, { signal }) => { if (signal.aborted) throw signal.reason; } });
  const controller = new AbortController();
  controller.abort(new Error('Navigation cancelled'));
  await assert.rejects(api.fetch('/api/public/posts', { signal: controller.signal }), /Navigation cancelled/);
});

test('a response that stalls after its headers also times out', async () => {
  const { api } = setup({ fetch: async (url, { signal }) => new Response(new ReadableStream({
    start(controller) { signal.addEventListener('abort', () => controller.error(signal.reason), { once: true }); }
  })) });
  await assert.rejects(api.fetch('/api/public/posts', { timeoutMs: 20 }), /timed out/);
});
