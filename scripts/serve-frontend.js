const express = require('express');
const path = require('node:path');
const app = express();
const root = path.resolve(__dirname, '../frontend');
const retiredGuides = require('./site-generator/editorial-guides.json').filter(guide => Object.hasOwn(guide, 'retiredTo'));
for (const guide of retiredGuides) app.get(`/blog/${guide.slug}.html`, (req, res) => guide.retiredTo ? res.redirect(301, guide.retiredTo) : res.status(410).sendFile(path.join(root, '404.html')));
app.get(/^\/snowy-peaks-solitaire(?:\/(?:index\.(?:html?|php))?)?\/?$/i, (req, res) => res.redirect(301, '/'));
app.get(/^\/([a-z0-9/-]+\.html)\/+$/i, (req, res) => res.redirect(301, `/${req.params[0]}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`));
// Use the API renderer when available; the static guide library is always readable.
app.get(['/blog', '/blog/', '/blog/index.html'], async (req, res) => {
  try {
    const response = await fetch(`http://localhost:3000/api/public/blog${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`, {
      headers: { 'X-Frontend-Origin': `${req.protocol}://${req.get('host')}` }, signal: AbortSignal.timeout(3000)
    });
    if (response.ok) return res.type('html').send(await response.text());
  } catch (_) { /* Static guides are available without the local API. */ }
  res.sendFile(path.join(root, 'blog/index.html'));
});
app.get('/admin/login', (req, res) => res.redirect('/admin-panel/login.html'));
app.get('/admin', (req, res) => res.redirect('/admin-panel/index.html'));
app.use(express.static(root));
app.use((req, res) => res.status(404).sendFile(path.join(root, '404.html')));
const port = Number(process.env.FRONTEND_PORT || 8080);
app.listen(port, () => console.log(`Anvil frontend: http://localhost:${port}`));
