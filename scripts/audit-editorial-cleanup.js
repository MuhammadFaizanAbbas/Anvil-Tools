// Read-only export and editorial inventory before a guarded publication change.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { renderMarkdown } = require('../backend/src/lib/editorial-markdown');
const directory = 'deployment/editorial-cleanup-2026-10-04';
const base = 'https://anvil-tools-backend.vercel.app/api/public';
const baseline = JSON.parse(fs.readFileSync(`${directory}/database-before.json`, 'utf8'));
const normalize = text => text.toLowerCase().replace(/<[^>]*>/g, ' ').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const hash = text => crypto.createHash('md5').update(text).digest('hex');
async function get(route) {
  const response = await fetch(base + route, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`${route}: HTTP ${response.status}`);
  return await response.json();
}
(async () => {
  const file = `${directory}/published-before.json`;
  let posts;
  if (fs.existsSync(file)) posts = JSON.parse(fs.readFileSync(file, 'utf8')).posts;
  else {
    const published = baseline.posts.filter(p => p.status === 'published');
    const fetched = []; let cursor = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (cursor < published.length) {
        const row = published[cursor++];
        const post = await get(`/posts/${encodeURIComponent(row.slug)}`);
        if (hash(post.body) !== row.body_md5) throw Error(`Article changed during export: ${row.slug}`);
        fetched.push({ ...row, ...post });
        if (fetched.length % 100 === 0) console.log(`Backed up ${fetched.length}/${published.length} articles`);
      }
    }));
    posts = fetched.sort((a,b) => a.slug.localeCompare(b.slug));
    fs.writeFileSync(file, JSON.stringify({ projectId: 'epxzxcqsonxscyvbopqt', exportedAt: new Date().toISOString(), posts }, null, 2));
  }
  if (posts.length !== baseline.posts.filter(p => p.status === 'published').length) throw Error('Incomplete backup.');
  const paragraphs = new Map(), headings = [], privacy = [];
  for (const post of posts) {
    for (const paragraph of post.body.split(/\n\s*\n/)) {
      const text = normalize(paragraph);
      if (text.split(/\s+/).length < 35) continue;
      const list = paragraphs.get(text) || [];
      if (!list.includes(post.slug)) list.push(post.slug);
      paragraphs.set(text, list);
    }
    const rendered = renderMarkdown(post.body, { title: post.title });
    for (const heading of rendered.headings) {
      if (heading.text.length > 100 || / for (?:Background Removal|Temporary Email|Base64|JSON Formatter).*(?:Mistakes|Tips|Workflow|Guide|Best Practices)/i.test(heading.text)) headings.push({ slug: post.slug, heading: heading.text });
    }
    for (const line of post.body.split('\n')) if (/leaves? nothing behind|leav(?:e|es|ing) no (?:trace|record)|completely anonymous|guarantee.{0,30}(?:anonym|delet)|deleted forever|untraceable/i.test(line)) privacy.push({ slug: post.slug, text: line });
  }
  const repeated = [...paragraphs].filter(([,slugs]) => slugs.length > 1).map(([text,slugs]) => ({ words: text.split(/\s+/).length, slugs, sample: text.slice(0,200) }));
  const covers = []; let cursor = 0;
  const covered = posts.filter(p => p.cover_image_id);
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < covered.length) {
      const post = covered[cursor++];
      const response = await fetch(`${base}/post-images/${post.cover_image_id}`, { signal: AbortSignal.timeout(30000) });
      const bytes = Buffer.from(await response.arrayBuffer());
      let dimensions = {};
      try { dimensions = await require('sharp')(bytes).metadata(); } catch (_) {}
      covers.push({ slug: post.slug, cover_image_id: post.cover_image_id, status: response.status, mime: response.headers.get('content-type'), width: dimensions.width || 0, height: dimensions.height || 0, valid: response.ok && Boolean(dimensions.width && dimensions.height) });
    }
  }));
  const report = { checkedAt: new Date().toISOString(), posts: posts.length, withoutCovers: posts.filter(p => !p.cover_image_id).length, covers: covers.sort((a,b)=>a.slug.localeCompare(b.slug)), repeatedParagraphs: repeated, headings, privacy };
  fs.writeFileSync('docs/audits/editorial-cleanup-before.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ backup: file, posts: posts.length, withoutCovers: report.withoutCovers, invalidCovers: covers.filter(p=>!p.valid), repeatedParagraphs: repeated.length, headingFlags: headings.length, privacyFlags: privacy.length }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
