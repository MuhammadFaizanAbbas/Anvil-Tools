// Import missing live published articles into the canonical local editorial library.
// Run only from a reviewed snapshot created by export-published-review.cjs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const snapshotArg = process.argv.find((argument) => argument.startsWith('--snapshot='));
if (!snapshotArg) throw new Error('Pass --snapshot=deployment/<review-directory>.');

const snapshotDirectory = path.resolve(root, snapshotArg.slice('--snapshot='.length));
const manifest = JSON.parse(fs.readFileSync(path.join(snapshotDirectory, 'manifest.json'), 'utf8'));
const libraryFile = path.join(root, 'content/editorial/published-library.json');
const currentLibrary = JSON.parse(fs.readFileSync(libraryFile, 'utf8'));
const currentBySlug = new Map(currentLibrary.map((post) => [post.slug, post]));
const publishedDirectory = path.join(root, 'content/editorial/published');
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalize = (value) => String(value || '').replace(/\r\n?/g, '\n').trim();

fs.mkdirSync(publishedDirectory, { recursive: true });
const imported = [];
const library = manifest.posts.map((post) => {
  const existing = currentBySlug.get(post.slug);
  let bodyFile = existing?.bodyFile;
  let tools = existing?.tools;
  const snapshotBody = normalize(fs.readFileSync(path.resolve(snapshotDirectory, post.body_file), 'utf8'));

  if (existing) {
    const localBody = normalize(fs.readFileSync(path.join(root, 'content/editorial', bodyFile), 'utf8'));
    if (sha256(localBody) !== post.body_sha256 || sha256(snapshotBody) !== post.body_sha256) {
      throw new Error(`Existing local source has drifted from the reviewed live snapshot: ${post.slug}`);
    }
  } else {
    bodyFile = `published/${post.slug}.md`;
    const destination = path.join(root, 'content/editorial', bodyFile);
    if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite existing source: ${destination}`);
    fs.writeFileSync(destination, `${snapshotBody}\n`);
    tools = [...new Set([...snapshotBody.matchAll(/\]\(\/tools\/([a-z0-9-]+)\.html(?:#[^)]+)?\)/g)].map((match) => match[1]))];
    if (!tools.length && post.slug === 'qr-codes-scan-reliably-print-screen-guide') tools = ['qr-code-generator'];
    if (!tools.length && post.slug === 'valid-json-api-errors-types-nulls-structure') tools = ['json-formatter'];
    if (!tools.length) throw new Error(`No related tool could be derived for ${post.slug}`);
    imported.push(post.slug);
  }

  return {
    key: existing?.key || post.slug,
    slug: post.slug,
    bodyFile,
    tools,
    title: post.title,
    excerpt: post.excerpt,
    seo_title: post.seo_title,
    tags: post.tags,
    cover_image_id: post.cover_image_id,
    cover_alt: post.cover_alt,
    category_slug: post.category_slug,
    published_at: post.published_at,
  };
}).sort((left, right) => String(right.published_at || '').localeCompare(String(left.published_at || '')) || left.slug.localeCompare(right.slug));

fs.writeFileSync(libraryFile, `${JSON.stringify(library, null, 2)}\n`);
console.log(JSON.stringify({ published: library.length, imported: imported.length, imported_slugs: imported }));
