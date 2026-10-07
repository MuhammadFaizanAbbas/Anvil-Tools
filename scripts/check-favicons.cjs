const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const sharp = require('sharp');
const express = require('express');
const { renderArticle } = require('../backend/src/lib/articles');
const { renderBlog } = require('../backend/src/lib/blog');

const frontend = path.resolve(__dirname, '../frontend');
const icons = [
  { url: '/assets/images/favicon-48.png', size: 48, rel: 'icon', mime: ['image/png'] },
  { url: '/favicon.ico', rel: 'shortcut icon', mime: ['image/x-icon', 'image/vnd.microsoft.icon'] },
  { url: '/assets/images/apple-touch-icon.png', size: 180, rel: 'apple-touch-icon', mime: ['image/png'] }
];

function checkLinks(html, origin) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, 'HTML must have a head');
  const links = [...head.matchAll(/<link\b[^>]*>/gi)].map(([tag]) =>
    Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])));
  for (const icon of icons) {
    const matches = links.filter(link => link.rel === icon.rel);
    assert.equal(matches.length, 1, `Expected one ${icon.rel} link`);
    assert.equal(new URL(matches[0].href, origin).href, origin + icon.url);
    if (icon.size) assert.equal(matches[0].sizes, `${icon.size}x${icon.size}`);
    if (icon.rel === 'icon') assert.equal(matches[0].type, 'image/png');
  }
}

// Respect agent-specific groups, wildcard rules, and longest-path Allow overrides.
function isAllowed(robots, agent, url) {
  const groups = [];
  let group;
  for (const line of robots.split(/\r?\n/)) {
    const match = line.split('#')[0].trim().match(/^(user-agent|allow|disallow)\s*:\s*(.*)$/i);
    if (!match) continue;
    const [, rawKey, value] = match;
    const key = rawKey.toLowerCase();
    if (key === 'user-agent') {
      if (!group || group.rules.length) groups.push(group = { agents: [], rules: [] });
      group.agents.push(value.toLowerCase());
    } else if (group && value) group.rules.push({ allow: key === 'allow', value });
  }
  const specificity = group => Math.max(-1, ...group.agents.map(name => name === '*' ? 0 : agent.toLowerCase().includes(name) ? name.length : -1));
  const best = Math.max(-1, ...groups.map(specificity));
  if (best < 0) return true;
  const rules = groups.filter(group => specificity(group) === best).flatMap(group => group.rules)
    .filter(rule => new RegExp('^' + rule.value.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')).test(url))
    .sort((a, b) => b.value.length - a.value.length || Number(b.allow) - Number(a.allow));
  return !rules.length || rules[0].allow;
}

async function checkPixels(png, size) {
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.format, 'png');
  assert.equal(metadata.width, size);
  assert.equal(metadata.height, size);
  const pixels = await sharp(png).ensureAlpha().raw().toBuffer();
  const expected = await sharp(path.join(frontend, 'assets/images/anvil-mark.svg'), { density: 384 })
    .resize(size, size).ensureAlpha().raw().toBuffer();
  assert.deepEqual(pixels, expected, 'Icon must reproduce the existing Anvil mark');
}

async function checkOrigin(origin) {
  const get = async url => {
    const response = await fetch(origin + url, { headers: { 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(20000) });
    assert.equal(response.status, 200, origin + url);
    assert.equal(response.redirected, false, 'Stable favicon URLs should return files directly');
    assert.doesNotMatch(response.headers.get('x-robots-tag') || '', /noindex|noimageindex|none/i);
    return response;
  };
  checkLinks(await (await get('/')).text(), origin);
  const robots = await (await get('/robots.txt')).text();
  assert.ok(isAllowed(robots, 'Googlebot', '/'), 'Homepage must be crawlable');
  const resources = [];
  for (const icon of icons) {
    assert.ok(isAllowed(robots, 'Googlebot-Image', icon.url), icon.url + ' must be crawlable');
    const response = await get(icon.url);
    const mime = response.headers.get('content-type')?.split(';')[0];
    assert.ok(icon.mime.includes(mime), `Unexpected MIME type ${mime} for ${icon.url}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(bytes, fs.readFileSync(path.join(frontend, icon.url)), 'Served asset must match this release');
    const sizes = [];
    if (icon.size) {
      await checkPixels(bytes, icon.size);
      sizes.push(icon.size);
    } else {
      assert.equal(bytes.readUInt16LE(0), 0);
      assert.equal(bytes.readUInt16LE(2), 1);
      const count = bytes.readUInt16LE(4);
      assert.equal(count, 6);
      for (let index = 0; index < count; index++) {
        const entry = 6 + 16 * index;
        const size = bytes[entry] || 256;
        assert.equal(bytes[entry + 1] || 256, size);
        const length = bytes.readUInt32LE(entry + 8);
        const offset = bytes.readUInt32LE(entry + 12);
        assert.ok(offset >= 6 + 16 * count && offset + length <= bytes.length);
        await checkPixels(bytes.subarray(offset, offset + length), size);
        sizes.push(size);
      }
      assert.deepEqual(sizes, [16, 32, 48, 64, 128, 256]);
    }
    resources.push({ url: icon.url, status: response.status, mime, squareSizes: sizes, matchesAnvilMark: true, crawlable: true });
  }
  return { origin, homepageLinks: 'passed', resources };
}

async function main() {
  const origins = process.argv.slice(2).map(value => new URL(value).origin);
  let server;
  try {
    if (!origins.length) {
      const walk = folder => fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(folder, entry.name);
        return entry.isDirectory() ? entry.name === 'assets' ? [] : walk(file) : file.endsWith('.html') ? [file] : [];
      });
      const pages = walk(frontend);
      for (const file of pages) checkLinks(fs.readFileSync(file, 'utf8'), 'https://nevco.online');
      for (const origin of ['https://nevco.online', 'https://anviltools.vercel.app']) {
        checkLinks(renderArticle({ slug: 'favicon-check', title: 'Check', body: '' }, origin), origin);
        checkLinks(renderBlog([], origin), origin);
      }
      console.log(`Checked favicon links in ${pages.length} static pages and both server renderers on both hostnames.`);
      server = express().use(express.static(frontend)).listen(0, '127.0.0.1');
      await once(server, 'listening');
      origins.push(`http://127.0.0.1:${server.address().port}`);
    }
    for (const origin of origins) console.log(JSON.stringify(await checkOrigin(origin), null, 2));
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
