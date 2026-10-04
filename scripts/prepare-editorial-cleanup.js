// Prepare an auditable content-only transaction and the matching public redirects.
const fs = require('node:fs');
const crypto = require('node:crypto');
const directory = 'deployment/editorial-cleanup-2026-10-04';
const baseline = JSON.parse(fs.readFileSync(directory + '/database-before.json', 'utf8'));
const backup = JSON.parse(fs.readFileSync(directory + '/published-before.json', 'utf8'));
const plan = JSON.parse(fs.readFileSync('content/editorial/consolidation-plan.json', 'utf8'));
const md5 = value => crypto.createHash('md5').update(value).digest('hex');
const canonical = [
  { key: 'temporary-email', slug: 'best-practices-for-temporary-email-when-working-with-signups', bodyFile: 'temporary-email.md', tools: ['temp-mail'] },
  { key: 'background-removal', slug: 'best-practices-for-background-removal-when-working-with-design', bodyFile: 'background-removal.md', tools: ['background-remover'] },
  { key: 'pdf-workflows', slug: 'simple-pdf-workflow-without-software', bodyFile: 'pdf-workflows.md', title: 'PDF Workflows: Merge Files, Convert Images, and Check the Result', excerpt: 'Prepare readable images, assemble PDFs in the right order, and check page dimensions, protected files, forms, signatures, and the final download.', tools: ['pdf-merge', 'image-to-pdf'] },
  { key: 'developer-data', slug: 'small-tools-that-save-developers-time', bodyFile: 'developer-data.md', title: 'Debug API Data with JSON, Base64, and Browser Tools', excerpt: 'Work through JSON types, encoding, URL components, JWT claims, hashes, CSV conversion, and timestamps with small reproducible examples.', tools: ['json-formatter', 'base64-tool', 'jwt-decoder', 'hash-generator', 'csv-to-json', 'url-encoder-decoder', 'text-diff-checker', 'unix-timestamp-converter', 'unit-converter', 'uuid-generator', 'user-agent-generator'] }
];
if (baseline.posts.length !== 490 || backup.posts.length !== 490) throw Error('Expected complete 490-post baseline.');
for (const post of baseline.posts) {
  const saved = backup.posts.find(row => row.id === post.id);
  if (!saved || md5(saved.body) !== post.body_md5) throw Error('Incomplete or changed backup: ' + post.slug);
}
const library = canonical.map(item => {
  const post = backup.posts.find(row => row.slug === item.slug);
  if (!post?.cover_image_id || !post.cover_alt?.trim()) throw Error('Canonical guide requires cover and alt text.');
  return { ...item, title: item.title || post.title, excerpt: item.excerpt || post.excerpt, cover_image_id: post.cover_image_id, cover_alt: post.cover_alt, category_slug: post.category_slug };
});
const retained = new Set(library.map(row => row.slug));
const destinations = Object.fromEntries(canonical.map(row => [row.key, row.slug]));
const redirects = {};
for (const group of plan.guides) for (const source of group.sources) {
  if (!retained.has(source.slug)) redirects[source.slug] = destinations[group.key] || null;
}
if (Object.keys(redirects).length !== 486) throw Error('Retirement map must cover every removed article.');
fs.writeFileSync('content/editorial/published-library.json', JSON.stringify(library, null, 2) + '\n');
fs.writeFileSync('backend/src/lib/article-redirects.json', JSON.stringify(redirects, null, 2) + '\n');
const staticDestinations = {
  'temporary-email-vs-aliases': destinations['temporary-email'],
  'background-removal-and-transparency': destinations['background-removal'],
  'merge-pdfs-locally': destinations['pdf-workflows'], 'images-to-clear-pdfs': destinations['pdf-workflows'],
  'format-and-check-json': destinations['developer-data'], 'jwt-decoding': destinations['developer-data'],
  'base64-text-encoding': destinations['developer-data'], 'sha256-text-checks': destinations['developer-data'],
  'url-encoding-components': destinations['developer-data']
};
const guides = JSON.parse(fs.readFileSync('scripts/site-generator/editorial-guides.json', 'utf8'));
fs.mkdirSync(directory + '/static-pages', { recursive: true });
for (const guide of guides) {
  guide.retiredTo = staticDestinations[guide.slug] ? '/journal/' + staticDestinations[guide.slug] : null;
  const file = 'frontend/blog/' + guide.slug + '.html';
  const saved = directory + '/static-pages/' + guide.slug + '.html';
  if (fs.existsSync(file) && !fs.existsSync(saved)) fs.copyFileSync(file, saved);
}
fs.writeFileSync('scripts/site-generator/editorial-guides.json', JSON.stringify(guides, null, 2) + '\n');
const payload = {
  baseline: baseline.posts.map(({ id, slug, updated_at, body_md5 }) => ({ id, slug, updated_at, body_md5 })),
  retained: [...retained],
  replacements: library.filter(row => row.bodyFile).map(row => {
    const body = fs.readFileSync('content/editorial/' + row.bodyFile, 'utf8').replace(/\r\n/g, '\n').trim();
    const result = { slug: row.slug, title: row.title, excerpt: row.excerpt, bodyMd5: md5(body) };
    if (['temporary-email', 'background-removal'].includes(row.key)) {
      const before = backup.posts.find(post => post.slug === row.slug).body.split('\n');
      const after = body.split('\n');
      if (before.length !== after.length) throw Error('Unexpected handbook structure change.');
      result.patches = before.flatMap((line, index) => line === after[index] ? [] : [{ before: line, after: after[index] }]);
      if (result.patches.length !== 1) throw Error('Expected one link correction in each handbook.');
    } else result.body = body;
    return result;
  })
};
const json = JSON.stringify(payload);
if (json.includes('$cleanup$')) throw Error('Unexpected SQL delimiter.');
const sql = `BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
DO $transaction$
DECLARE
  payload jsonb := $cleanup$${json}$cleanup$::jsonb;
  expected jsonb;
  previous public.posts%ROWTYPE;
  replacement jsonb;
  patch jsonb;
  new_body text;
  retained boolean;
  changed integer := 0;
BEGIN
  IF (SELECT count(*) FROM public.posts WHERE status = 'published') <> 490 THEN
    RAISE EXCEPTION 'Published library changed; refresh baseline';
  END IF;
  FOR expected IN SELECT value FROM jsonb_array_elements(payload->'baseline') ORDER BY value->>'id' LOOP
    SELECT * INTO STRICT previous FROM public.posts WHERE id = expected->>'id' FOR UPDATE;
    IF previous.status <> 'published' OR previous.slug <> expected->>'slug'
       OR previous.updated_at <> (expected->>'updated_at')::timestamptz
       OR md5(previous.body) <> expected->>'body_md5' THEN
      RAISE EXCEPTION 'Concurrent edit detected: %', previous.slug;
    END IF;
    retained := (payload->'retained') ? previous.slug;
    SELECT value INTO replacement FROM jsonb_array_elements(payload->'replacements') WHERE value->>'slug' = previous.slug;
    IF NOT retained OR replacement IS NOT NULL THEN
      INSERT INTO public.post_revisions(post_id, snapshot) VALUES(previous.id, to_jsonb(previous));
      IF NOT retained THEN
        UPDATE public.posts SET status = 'draft', updated_at = now() WHERE id = previous.id;
      ELSE
        new_body := COALESCE(replacement->>'body', previous.body);
        FOR patch IN SELECT value FROM jsonb_array_elements(COALESCE(replacement->'patches', '[]'::jsonb)) LOOP
          new_body := replace(new_body, patch->>'before', patch->>'after');
        END LOOP;
        IF md5(new_body) <> replacement->>'bodyMd5' THEN RAISE EXCEPTION 'Body verification failed: %', previous.slug; END IF;
        UPDATE public.posts SET title = replacement->>'title', excerpt = replacement->>'excerpt',
          body = new_body, seo_title = replacement->>'title', seo_description = replacement->>'excerpt',
          updated_at = now() WHERE id = previous.id;
      END IF;
      changed := changed + 1;
    END IF;
  END LOOP;
  IF changed <> 490 OR (SELECT count(*) FROM public.posts WHERE status = 'published') <> 4
     OR EXISTS(SELECT 1 FROM public.posts WHERE status = 'published' AND (cover_image_id IS NULL OR btrim(cover_alt) = '')) THEN
    RAISE EXCEPTION 'Final library invariants failed';
  END IF;
END $transaction$;
COMMIT;`;
fs.writeFileSync(directory + '/cleanup.sql', sql);
const summary = {
  projectId: 'epxzxcqsonxscyvbopqt', originalPublished: 490, coverlessRemoved: 424,
  overlappingCoveredRemoved: 62, finalPublished: 4, changedRecords: 490,
  redirects: Object.values(redirects).filter(Boolean).length,
  gone: Object.values(redirects).filter(value => value === null).length,
  staticRetired: guides.length,
  replacements: library.map(row => {
    const body = fs.readFileSync('content/editorial/' + row.bodyFile, 'utf8').replace(/\r\n/g, '\n').trim();
    return { slug: row.slug, words: body.split(/\s+/).length, md5: md5(body), characters: body.length };
  }),
  adsTxtSha256: crypto.createHash('sha256').update(fs.readFileSync('frontend/ads.txt')).digest('hex'),
  sqlCharacters: sql.length
};
fs.writeFileSync(directory + '/prepared.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
