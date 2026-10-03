// Read-only snapshot of public content before an editorial consolidation.
const fs = require('node:fs');
const path = require('node:path');
const base = 'https://anvil-tools-backend.vercel.app/api/public';
const output = path.resolve('deployment/editorial-2026-10-04');
async function get(route) {
  const response = await fetch(base + route, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw Error(`${route}: HTTP ${response.status}`);
  return { data: await response.json(), count: Number(response.headers.get('x-total-count')) };
}
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const file = path.join(output, 'published-before.json');
  if (fs.existsSync(file)) throw Error('Snapshot already exists; preserve it and choose a new export directory.');
  const posts = [];
  for (let offset = 0, total = Infinity; offset < total; offset += 100) {
    const result = await get(`/posts?limit=100&offset=${offset}`);
    posts.push(...result.data); total = result.count;
    if (!result.data.length) break;
  }
  const complete = []; let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < posts.length) {
      const post = posts[cursor++];
      const { data } = await get(`/posts/${encodeURIComponent(post.slug)}`);
      complete.push({ ...post, ...data });
      if (complete.length % 100 === 0) console.log(`Exported ${complete.length}/${posts.length} articles`);
    }
  }));
  complete.sort((a,b) => a.slug.localeCompare(b.slug));
  fs.writeFileSync(file, JSON.stringify({ exportedAt: new Date().toISOString(), posts: complete }, null, 2));
  const groups = {};
  for (const post of complete) {
    const group = post.category_slug || 'uncategorized';
    groups[group] ||= { count: 0, words: 0, missingCovers: 0 };
    groups[group].count++;
    groups[group].words += post.body.trim().split(/\s+/).length;
    groups[group].missingCovers += !post.cover_image_id;
  }
  console.log(JSON.stringify({ saved: file, posts: complete.length, groups }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
