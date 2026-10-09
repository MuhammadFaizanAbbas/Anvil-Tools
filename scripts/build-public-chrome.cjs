const fs = require('node:fs');
const path = require('node:path');
const { applyPublicChrome } = require('./public-chrome.cjs');

const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (['admin-panel', 'assets'].includes(entry.name)) return [];
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
  });
}

let count = 0;
for (const file of walk(frontend)) {
  const relative = path.relative(frontend, file).replaceAll('\\', '/');
  const pathname = relative === 'index.html' ? '/' : `/${relative}`;
  const before = fs.readFileSync(file, 'utf8');
  const after = applyPublicChrome(before, pathname);
  if (after !== before) fs.writeFileSync(file, after);
  count += 1;
}

const blogTemplate = path.join(root, 'backend/src/templates/blog.html');
const before = fs.readFileSync(blogTemplate, 'utf8');
const after = applyPublicChrome(before, '/blog/index.html');
if (after !== before) fs.writeFileSync(blogTemplate, after);

console.log(`Applied the canonical homepage header and footer to ${count} public pages and the server blog template.`);
