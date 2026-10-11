const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const frontend = path.resolve(__dirname, '../frontend');
const siteOrigin = 'https://anviltools.vercel.app';
const alternateOrigin = 'https://nevco.online';
const guideSlugs = new Set(require('../content/editorial/published-library.json').map(item => item.slug));

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

const publicPages = walk(frontend)
  .filter(file => file.endsWith('.html') && !file.includes(`${path.sep}admin-panel${path.sep}`));

function pageUrl(file) {
  const relative = path.relative(frontend, file).replaceAll('\\', '/');
  return `${siteOrigin}${relative === 'index.html' ? '/' : `/${relative}`}`;
}

function localFileFor(pathname) {
  let relative = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!relative || relative.endsWith('/')) relative += 'index.html';
  const candidate = path.resolve(frontend, relative);
  assert.ok(candidate === frontend || candidate.startsWith(`${frontend}${path.sep}`), `unsafe local path: ${pathname}`);
  return candidate;
}

function isSupportedDynamicPath(pathname) {
  const journal = pathname.match(/^\/journal\/([a-z0-9-]+)\/?$/);
  if (journal) return guideSlugs.has(journal[1]);
  return /^\/journal-images\/[a-f0-9-]+\/?$/.test(pathname)
    || /^\/api\//.test(pathname);
}

function targets(html) {
  const values = [];
  for (const match of html.matchAll(/\b(?:href|src|action|poster)=["']([^"']+)["']/gi)) values.push(match[1]);
  for (const match of html.matchAll(/\bsrcset=["']([^"']+)["']/gi)) {
    for (const candidate of match[1].split(',')) values.push(candidate.trim().split(/\s+/, 1)[0]);
  }
  return values;
}

test('every internal public link, asset, form target, and fragment resolves', () => {
  for (const file of publicPages) {
    const html = fs.readFileSync(file, 'utf8');
    const base = pageUrl(file);
    for (const raw of targets(html)) {
      if (!raw || /^(?:mailto:|tel:|data:|javascript:)/i.test(raw)) continue;
      const url = new URL(raw, base);
      if (![siteOrigin, alternateOrigin].includes(url.origin)) continue;
      if (isSupportedDynamicPath(url.pathname)) continue;

      const target = localFileFor(url.pathname);
      assert.ok(fs.existsSync(target), `${path.relative(frontend, file)} -> ${raw}`);

      if (url.hash && target.endsWith('.html')) {
        const fragment = decodeURIComponent(url.hash.slice(1));
        const targetHtml = fs.readFileSync(target, 'utf8');
        const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        assert.match(targetHtml, new RegExp(`\\b(?:id|name)=["']${escaped}["']`), `${path.relative(frontend, file)} -> ${raw}`);
      }
    }
  }
});

test('every indexable non-article page has one complete metadata structure', () => {
  for (const file of publicPages) {
    const relative = path.relative(frontend, file).replaceAll('\\', '/');
    if (relative === '404.html' || relative === 'blog/article.html' || relative.startsWith('blog/') && relative !== 'blog/index.html') continue;
    const html = fs.readFileSync(file, 'utf8');
    assert.equal((html.match(/<title>/gi) || []).length, 1, `${relative}: title`);
    assert.equal((html.match(/<meta\s+name=["']description["']/gi) || []).length, 1, `${relative}: description`);
    assert.equal((html.match(/<link\s+rel=["']canonical["']/gi) || []).length, 1, `${relative}: canonical`);
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${relative}: h1`);
    const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1].trim() || '';
    const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1].trim() || '';
    const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i)?.[1];
    assert.ok(title.length <= 65, `${relative}: title is ${title.length} characters`);
    assert.ok(description.length <= 160, `${relative}: description is ${description.length} characters`);
    assert.equal(canonical, pageUrl(file), `${relative}: self-referencing canonical`);
    assert.doesNotMatch(html, /<meta\s+name=["']robots["'][^>]*\bnoindex\b/i, `${relative}: indexable`);
  }
});

test('page-served raster images stay reasonably compressed', () => {
  const referenced = new Set();
  for (const file of publicPages) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
      const url = new URL(match[1], pageUrl(file));
      if (url.origin !== siteOrigin || isSupportedDynamicPath(url.pathname)) continue;
      const target = localFileFor(url.pathname);
      if (/\.(?:png|jpe?g|webp|gif)$/i.test(target)) referenced.add(target);
    }
  }
  for (const file of referenced) {
    assert.ok(fs.statSync(file).size <= 250 * 1024, `${path.relative(frontend, file)} exceeds 250 KiB`);
  }
});
