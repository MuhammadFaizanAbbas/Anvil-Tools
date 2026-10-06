const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const path = require('node:path');
const run = promisify(execFile);

test('PHP proxy retries transient public GET failures once without retrying a missing article', async () => {
  const counts = new Map();
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push(req.headers);
    const count = (counts.get(req.url) || 0) + 1; counts.set(req.url, count);
    res.writeHead(req.url === '/missing' ? 404 : req.url === '/transient' && count === 1 ? 503 : 200, { 'Content-Type': 'text/html' });
    res.end(req.url === '/missing' ? 'Missing' : count === 1 && req.url === '/transient' ? 'Unavailable' : 'Published article');
  });
  server.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try {
    const helper = path.resolve('frontend/backend-proxy.php').replaceAll('\\', '/');
    for (const route of ['/transient', '/missing']) {
      const url = `http://127.0.0.1:${server.address().port}${route}`;
      const result = await run('php', ['-r', `require '${helper}'; echo json_encode(fetch_public_backend('${url}', 'text/html', 'https://nevco.online'));`]);
      const data = JSON.parse(result.stdout);
      assert.equal(data.status, route === '/missing' ? 404 : 200);
      assert.equal(data.body, route === '/missing' ? 'Missing' : 'Published article');
    }
    assert.equal(counts.get('/transient'), 2); assert.equal(counts.get('/missing'), 1);
    assert.ok(requests.every(headers => headers['x-frontend-origin'] === 'https://nevco.online' && !headers.cookie && !headers.authorization));
  } finally { await new Promise(resolve => server.close(resolve)); }
});
