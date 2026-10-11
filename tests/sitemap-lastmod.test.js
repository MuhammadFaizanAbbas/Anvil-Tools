const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const sitemap = fs.readFileSync('frontend/sitemap.xml', 'utf8');
const sitemapIndex = fs.readFileSync('frontend/sitemap-index.xml', 'utf8');
const lastmods = require('../content/sitemap-lastmod.json');

const isCalendarDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
};

test('every main sitemap URL has its explicit tracked YYYY-MM-DD lastmod', () => {
  const entries = [...sitemap.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)]
    .map(([, loc, lastmod]) => ({ loc, lastmod }));

  assert.equal(entries.length, (sitemap.match(/<url>/g) || []).length, 'every URL entry must include lastmod');
  assert.equal(entries.length, Object.keys(lastmods).length, 'lastmod manifest must exactly cover the sitemap');
  assert.equal(new Set(entries.map(entry => entry.loc)).size, entries.length, 'canonical URLs must be unique');

  for (const { loc, lastmod } of entries) {
    const url = new URL(loc);
    assert.equal(lastmod, lastmods[url.pathname], url.pathname);
    assert.ok(isCalendarDate(lastmod), `${url.pathname}: ${lastmod}`);
  }
});

test('sitemap index dates the static sitemap without guessing a live journal date', () => {
  const staticLastmod = Object.values(lastmods).sort().at(-1);
  assert.match(sitemapIndex, new RegExp(`<sitemap><loc>https://anviltools\\.vercel\\.app/sitemap\\.xml</loc><lastmod>${staticLastmod}</lastmod></sitemap>`));
  assert.match(sitemapIndex, /<sitemap><loc>https:\/\/anviltools\.vercel\.app\/journal-sitemap\.xml<\/loc><\/sitemap>/);
});
