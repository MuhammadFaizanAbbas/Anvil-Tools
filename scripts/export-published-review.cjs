// Read-only export of every currently published article for editorial review.
// This script reads the public API only and never changes Supabase data.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const apiBase = process.env.ANVIL_PUBLIC_API_BASE || 'https://anvil-tools-backend.vercel.app/api/public';
const outputArg = process.argv.find((argument) => argument.startsWith('--output='));
const outputDirectory = path.resolve(outputArg ? outputArg.slice('--output='.length) : 'deployment/published-review');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readableWords(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

async function get(route) {
  const response = await fetch(apiBase + route, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${route}: HTTP ${response.status}`);
  return {
    data: await response.json(),
    total: Number(response.headers.get('x-total-count')),
  };
}

(async () => {
  if (fs.existsSync(outputDirectory) && fs.readdirSync(outputDirectory).length) {
    throw new Error(`Review export already exists: ${outputDirectory}`);
  }

  const listing = [];
  for (let offset = 0, total = Infinity; offset < total; offset += 100) {
    const page = await get(`/posts?limit=100&offset=${offset}`);
    listing.push(...page.data);
    total = page.total;
    if (!page.data.length) break;
  }

  const posts = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (cursor < listing.length) {
      const summary = listing[cursor++];
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(summary.slug)) {
        throw new Error(`Unsafe article slug returned by API: ${JSON.stringify(summary.slug)}`);
      }
      const detail = await get(`/posts/${encodeURIComponent(summary.slug)}`);
      posts.push({ ...summary, ...detail.data });
    }
  }));

  posts.sort((left, right) => left.slug.localeCompare(right.slug));
  fs.mkdirSync(path.join(outputDirectory, 'articles'), { recursive: true });

  const manifest = posts.map((post) => {
    const body = String(post.body || '').replace(/\r\n?/g, '\n').trim();
    fs.writeFileSync(path.join(outputDirectory, 'articles', `${post.slug}.md`), `${body}\n`);
    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      status: post.status,
      category_slug: post.category_slug,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      tags: post.tags,
      cover_image_id: post.cover_image_id,
      cover_alt: post.cover_alt,
      created_at: post.created_at,
      published_at: post.published_at,
      updated_at: post.updated_at,
      body_file: `articles/${post.slug}.md`,
      words: readableWords(body),
      body_sha256: sha256(body),
    };
  });

  const snapshot = {
    exported_at: new Date().toISOString(),
    api_base: apiBase,
    count: posts.length,
    posts: manifest,
  };
  fs.writeFileSync(path.join(outputDirectory, 'manifest.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
  console.log(JSON.stringify({ output: outputDirectory, count: posts.length }));
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
