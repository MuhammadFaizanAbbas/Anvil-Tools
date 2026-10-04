const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { renderMarkdown } = require('../backend/src/lib/editorial-markdown');
const library = require('../content/editorial/published-library.json');
const directory = 'deployment/editorial-cleanup-2026-10-04';
const prepared = JSON.parse(fs.readFileSync(directory + '/prepared.json', 'utf8'));
const before = JSON.parse(fs.readFileSync('docs/audits/editorial-cleanup-before.json', 'utf8'));
const md5 = value => crypto.createHash('md5').update(value).digest('hex');
const normalize = text => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
async function check() {
  const paragraphs = new Map();
  const report = { checkedAt: new Date().toISOString(), projectId: prepared.projectId, retained: [], repeatedParagraphs: [], headingFlags: [], live: [] };
  assert.equal(library.length, 4);
  for (const guide of library) {
    const body = fs.readFileSync('content/editorial/' + guide.bodyFile, 'utf8').replace(/\r\n/g, '\n').trim();
    const rendered = renderMarkdown(body, { title: guide.title });
    const expected = prepared.replacements.find(row => row.slug === guide.slug);
    assert.equal(md5(body), expected.md5);
    assert.ok(body.length <= 100000);
    assert.ok(before.covers.find(row => row.slug === guide.slug)?.valid);
    assert.ok(guide.cover_alt.trim() && rendered.toc);
    assert.ok(!/leaves? nothing behind|completely anonymous|deleted forever|\b(?:TODO|TBD|lorem ipsum)\b/i.test(body));
    for (const paragraph of body.split(/\n\s*\n/)) {
      const text = normalize(paragraph);
      if (text.split(/\s+/).length < 35) continue;
      const slugs = paragraphs.get(text) || new Set(); slugs.add(guide.slug); paragraphs.set(text, slugs);
    }
    for (const heading of rendered.headings) if (heading.text.length > 100 || / for (?:Background Removal|Temporary Email|Base64|JSON Formatter).*(?:Mistakes|Tips|Workflow|Guide|Best Practices)/i.test(heading.text)) report.headingFlags.push({ slug: guide.slug, heading: heading.text });
    for (const match of rendered.html.matchAll(/href="(\/[^"#]+)"/g)) {
      const target = match[1].split('#')[0];
      if (target.startsWith('/journal/')) assert.ok(library.some(row => '/journal/' + row.slug === target), target);
      else assert.ok(fs.existsSync('frontend' + target), target);
    }
    report.retained.push({ slug: guide.slug, bodyMd5: md5(body), words: rendered.html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length, headings: rendered.headings.length, cover: guide.cover_image_id });
    if (process.argv.includes('--live')) {
      const response = await fetch('https://anvil-tools-backend.vercel.app/api/public/posts/' + guide.slug);
      assert.equal(response.status, 200);
      const saved = await response.json();
      assert.equal(md5(saved.body), expected.md5);
      assert.equal(saved.cover_image_id, guide.cover_image_id);
      const page = await fetch('https://nevco.online/journal/' + guide.slug);
      const html = await page.text();
      assert.equal(page.status, 200);
      assert.ok(html.includes(guide.title));
      assert.ok(html.includes('/assets/css/content.css?v=20261004-css'));
      report.live.push({ slug: guide.slug, status: page.status, bodyMd5: md5(saved.body), versionedStyles: true });
    }
  }
  report.repeatedParagraphs = [...paragraphs].filter(([,slugs]) => slugs.size > 1).map(([text,slugs]) => ({ slugs: [...slugs], words: text.split(/\s+/).length }));
  assert.equal(report.repeatedParagraphs.length, 0);
  assert.equal(report.headingFlags.length, 0);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync('frontend/ads.txt')).digest('hex'), prepared.adsTxtSha256);
  fs.writeFileSync('docs/audits/editorial-cleanup-after.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
check().catch(error => { console.error(error); process.exitCode = 1; });
