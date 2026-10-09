// Apply reviewed metadata/body corrections from a published-post snapshot to local sources.
// This script never connects to Supabase.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const snapshotArg = process.argv.find((argument) => argument.startsWith('--snapshot='));
if (!snapshotArg) throw new Error('Pass --snapshot=deployment/<review-directory>.');

const snapshotDirectory = path.resolve(root, snapshotArg.slice('--snapshot='.length));
const snapshot = JSON.parse(fs.readFileSync(path.join(snapshotDirectory, 'manifest.json'), 'utf8'));
const libraryFile = path.join(root, 'content/editorial/published-library.json');
const reviewFile = path.join(root, 'backend/src/lib/article-reviews.json');
const library = JSON.parse(fs.readFileSync(libraryFile, 'utf8'));
const experiments = JSON.parse(fs.readFileSync(path.join(root, 'content/editorial/experiments.json'), 'utf8'));
const snapshotBySlug = new Map(snapshot.posts.map((post) => [post.slug, post]));
const experimentSlugs = new Set(experiments.map((post) => post.slug));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalize = (value) => String(value || '').replace(/\r\n?/g, '\n').trim();

const correctedCoverAlt = {
  'are-uuid-v4-identifiers-unique-collisions-security': 'Two applications generating UUIDv4 identifiers independently and writing them to a database protected by a unique constraint, with notes about collision risk and access control.',
};

const corrections = [];
for (const post of library) {
  const before = snapshotBySlug.get(post.slug);
  if (!before) throw new Error(`Published baseline missing: ${post.slug}`);
  const body = normalize(fs.readFileSync(path.join(root, 'content/editorial', post.bodyFile), 'utf8'));
  const excerpt = before.excerpt.length >= 100 && before.excerpt.length <= 170
    ? before.excerpt
    : before.seo_description;
  const coverAlt = correctedCoverAlt[post.slug] || before.cover_alt;
  const changedFields = [];
  if (excerpt !== before.excerpt) changedFields.push('excerpt');
  if (coverAlt !== before.cover_alt) changedFields.push('cover_alt');
  if (sha256(body) !== before.body_sha256) changedFields.push('body');

  post.title = before.title;
  post.excerpt = excerpt;
  post.seo_title = before.seo_title;
  post.seo_description = before.seo_description;
  post.tags = before.tags;
  post.cover_image_id = before.cover_image_id;
  post.cover_alt = coverAlt;
  post.category_slug = before.category_slug;
  post.published_at = before.published_at;

  if (changedFields.length) {
    corrections.push({
      id: before.id,
      slug: post.slug,
      expected_updated_at: before.updated_at,
      expected_body_sha256: before.body_sha256,
      expected: {
        title: before.title,
        excerpt: before.excerpt,
        seo_title: before.seo_title,
        seo_description: before.seo_description,
        cover_image_id: before.cover_image_id,
        cover_alt: before.cover_alt,
        category_slug: before.category_slug,
        tags: before.tags,
        published_at: before.published_at,
      },
      next: {
        excerpt,
        cover_alt: coverAlt,
        ...(changedFields.includes('body') ? { body } : {}),
        body_sha256: sha256(body),
      },
      changed_fields: changedFields,
    });
  }
}

const reviews = Object.fromEntries([...library, ...experiments].map((post) => {
  const body = normalize(fs.readFileSync(path.join(root, 'content/editorial', post.bodyFile), 'utf8'));
  return [post.slug, {
    title: post.title,
    excerpt: post.excerpt,
    reviewed_at: experimentSlugs.has(post.slug) ? '2026-10-07' : '2026-10-09',
    body_sha256: sha256(body),
  }];
}));

fs.writeFileSync(libraryFile, `${JSON.stringify(library, null, 2)}\n`);
fs.writeFileSync(reviewFile, `${JSON.stringify(reviews, null, 2)}\n`);
fs.writeFileSync(path.join(snapshotDirectory, 'corrections.json'), `${JSON.stringify({
  release: 'published-editorial-audit-2026-10-09',
  corrections,
}, null, 2)}\n`);
console.log(JSON.stringify({ corrections: corrections.length, fields: corrections.map((item) => ({ slug: item.slug, fields: item.changed_fields })) }));
