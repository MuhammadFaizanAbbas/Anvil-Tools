// Check actual bytes, not just HTTP status, of every linked public example.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const vm = require('node:vm');
const sharp = require('sharp');
const { PDFDocument } = require('../frontend/assets/vendor/tool-libraries/pdf-lib-1.17.1.min.js');
const { renderArticle } = require('../backend/src/lib/articles');
const library = require('../content/editorial/published-library.json');
const remote = process.argv.find(arg => arg.startsWith('--origin='))?.slice(9);
const origin = remote ? new URL(remote).origin : 'https://nevco.online';
const reportPath = process.argv.find(arg => arg.startsWith('--report='))?.slice(9) || `docs/audits/linked-fixtures-${remote ? 'live' : 'local'}.json`;
const report = { checkedAt: new Date().toISOString(), origin, mode: remote ? 'live GET requests' : 'local files and prepared guide bodies', pages: [], resources: [], failures: [] };
const resources = new Map();
const decode = value => value.replace(/&amp;/g, '&');
const mimeTypes = { '.json': 'application/json', '.csv': 'text/csv', '.txt': 'text/plain', '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
function collect(html, route) {
  for (const match of html.matchAll(/<(?:a|img|script|link)\b[^>]*\b(?:href|src)=["']([^"']+)["']/gi)) {
    const url = new URL(decode(match[1]), origin + route);
    if (url.origin !== origin || !(url.pathname.startsWith('/assets/') || (remote && url.pathname.startsWith('/journal-images/')))) continue;
    if (!mimeTypes[path.extname(url.pathname).toLowerCase()] && !url.pathname.startsWith('/journal-images/')) continue;
    url.hash = ''; url.search = '';
    if (!resources.has(url.pathname)) resources.set(url.pathname, new Set());
    resources.get(url.pathname).add(route);
  }
}
async function parallel(items, fn) {
  let cursor = 0;
  await Promise.all(Array.from({ length: 6 }, async () => { while (cursor < items.length) await fn(items[cursor++]); }));
}
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
  return { status: response.status, finalUrl: response.url, type: (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase(), buffer: Buffer.from(await response.arrayBuffer()) };
}
async function inspect(buffer, type) {
  if (!buffer.length) throw Error('Empty file');
  if (type === 'font/woff2') {
    if (buffer.subarray(0, 4).toString() !== 'wOF2' || buffer.readUInt32BE(8) !== buffer.length) throw Error('Invalid WOFF2 header or file length');
    return { validWoff2Header: true };
  }
  if (type === 'application/pdf') {
    if (buffer.subarray(0, 5).toString() !== '%PDF-' || !buffer.subarray(-1024).includes(Buffer.from('%%EOF'))) throw Error('Invalid PDF envelope');
    const pdf = await PDFDocument.load(buffer);
    if (!pdf.getPageCount()) throw Error('PDF has no pages');
    return { pages: pdf.getPageCount(), pageSizes: pdf.getPages().map(page => page.getSize()) };
  }
  if (['image/png', 'image/jpeg', 'image/webp'].includes(type)) {
    const image = sharp(buffer, { failOn: 'warning' });
    const metadata = await image.metadata();
    await image.raw().toBuffer();
    const expected = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/webp': 'webp' }[type];
    if (metadata.format !== expected) throw Error('Image bytes disagree with MIME type');
    return { width: metadata.width, height: metadata.height, format: metadata.format };
  }
  const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  if (/^\s*(?:<!doctype html|<html)/i.test(text)) throw Error('HTML returned instead of a fixture');
  if (type === 'application/json') { JSON.parse(text); return { validJson: true }; }
  if (['application/javascript', 'text/javascript'].includes(type)) { new vm.Script(text); return { validJavaScript: true }; }
  if (type === 'text/csv') {
    // Exercise the actual tool parser, including quoted commas and newlines.
    const elements = {};
    const element = id => elements[id] ||= { value: '', checked: false, textContent: '', addEventListener(event, fn) { this[event] = fn; } };
    element('csv-input').value = text;
    const document = { addEventListener(event, fn) { fn(); }, getElementById: element };
    vm.runInNewContext(fs.readFileSync('frontend/assets/js/tools/csv-to-json.js', 'utf8'), { document });
    element('csv-convert').click();
    if (!element('csv-output').textContent) throw Error(element('csv-status').textContent || 'CSV rejected by the tool');
    const rows = JSON.parse(element('csv-output').textContent);
    if (!rows.length) throw Error('CSV has no rows');
    return { rows: rows.length, columns: rows[0].length };
  }
  if (type === 'image/svg+xml' && !/<svg\b[\s\S]*<\/svg>/i.test(text)) throw Error('Invalid SVG document');
  return { validText: true };
}
(async () => {
  if (remote) {
    // Both URL families share the same hub but retain distinct canonical articles.
    const routes = [...fs.readFileSync('frontend/sitemap.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);
    routes.push(...library.map(item => '/journal/' + item.slug));
    await parallel([...new Set(routes)], async route => {
      try { const response = await get(origin + route); if (response.status !== 200 || response.type !== 'text/html') throw Error(`Page returned ${response.status} ${response.type}`); collect(response.buffer.toString('utf8'), route); report.pages.push({ route, status: response.status }); }
      catch (error) { report.failures.push({ route, error: error.message }); }
    });
  } else {
    const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      if (['assets', 'admin-panel'].includes(entry.name)) return [];
      const file = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
    });
    for (const file of walk('frontend')) {
      const route = '/' + path.relative('frontend', file).replaceAll('\\', '/');
      collect(fs.readFileSync(file, 'utf8'), route); report.pages.push({ route });
    }
    for (const item of library) collect(renderArticle({ ...item, body: fs.readFileSync('content/editorial/' + item.bodyFile, 'utf8') }, origin), '/journal/' + item.slug);
  }
  await parallel([...resources], async ([route, referrers]) => {
    const result = { route, referrers: [...referrers].sort() };
    try {
      let buffer, type = mimeTypes[path.extname(route).toLowerCase()];
      if (remote) {
        const response = await get(origin + route);
        Object.assign(result, { status: response.status, type: response.type, finalUrl: response.finalUrl });
        if (response.status !== 200) throw Error(`Resource returned HTTP ${response.status}`);
        if (type && response.type !== type && !(type === 'application/javascript' && response.type === 'text/javascript')) throw Error(`Expected ${type}; received ${response.type}`);
        type ||= response.type; buffer = response.buffer;
      } else { buffer = fs.readFileSync(path.join('frontend', route)); result.type = type; }
      result.bytes = buffer.length; result.sha256 = createHash('sha256').update(buffer).digest('hex');
      Object.assign(result, await inspect(buffer, type));
      const localFile = path.join('frontend', route);
      if (remote && fs.existsSync(localFile)) result.matchesLocalFile = result.sha256 === createHash('sha256').update(fs.readFileSync(localFile)).digest('hex');
      result.valid = true;
    } catch (error) { result.valid = false; result.error = error.message; report.failures.push({ route, error: error.message }); }
    report.resources.push(result);
  });
  report.pages.sort((a, b) => a.route.localeCompare(b.route)); report.resources.sort((a, b) => a.route.localeCompare(b.route));
  if (!resources.size) report.failures.push({ error: 'No linked fixtures discovered' });
  report.passed = report.failures.length === 0;
  report.fixtureAndCoverCount = report.resources.filter(item => /^\/assets\/(?:examples\/|images\/editorial\/)|^\/journal-images\//.test(item.route)).length;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.resources.length} linked fixtures checked; ${report.failures.length} failures. ${reportPath}`);
  for (const failure of report.failures) console.log(failure.route, failure.error);
  process.exitCode = report.passed ? 0 : 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
