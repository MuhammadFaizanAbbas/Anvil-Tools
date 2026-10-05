// Fetch public baselines and prepare a guarded body-only update. Never executes SQL.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { renderMarkdown } = require('../backend/src/lib/editorial-markdown');
const { renderArticle } = require('../backend/src/lib/articles');
const library = require('../content/editorial/published-library.json');
const directory = 'deployment/adsense-followup-2026-10-05';
const api = 'https://anvil-tools-backend.vercel.app';
const md5 = body => createHash('md5').update(body).digest('hex');
const stats = (body, title) => {
  const rendered = renderMarkdown(body, { title });
  const text = rendered.html.replace(/<[^>]+>/g, ' ').replace(/&(?:#\d+|#x[0-9a-f]+|[a-z]+);/gi, ' ').trim();
  return { words: text.split(/\s+/).filter(part => /[\p{L}\p{N}]/u.test(part)).length,
    headings: rendered.headings.length, paragraphs: (rendered.html.match(/<p>/g) || []).length,
    tables: (rendered.html.match(/<table>/g) || []).length, screenshots: (rendered.html.match(/<figure /g) || []).length };
};
async function read(endpoint) {
  const response = await fetch(api + endpoint, { signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, 'Public baseline request failed');
  return response;
}

(async () => {
  fs.mkdirSync(`${directory}/preview`, { recursive: true });
  const listing = await read('/api/public/posts?limit=30');
  const catalog = await listing.json();
  assert.equal(catalog.length, 4, 'Refresh the release scope if the public catalog changes');
  const changedGuides = library.filter(guide => ['background-removal', 'temporary-email', 'pdf-workflows'].includes(guide.key));
  const before = await Promise.all(changedGuides.map(async guide => (await read(`/api/public/posts/${guide.slug}`)).json()));
  const backupFile = `${directory}/database-before.json`;
  if (fs.existsSync(backupFile)) {
    const saved = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    for (const post of before) assert.equal(md5(saved.find(row => row.slug === post.slug)?.body || ''), md5(post.body), 'A saved baseline changed; preserve it and prepare a fresh release directory');
  } else fs.writeFileSync(backupFile, JSON.stringify(before, null, 2) + '\n');

  const report = { preparedAt: new Date().toISOString(), projectId: 'epxzxcqsonxscyvbopqt', status: 'prepared-not-published', articles: [] };
  const seen = new Map(), duplicates = [];
  for (const guide of library) {
    const body = fs.readFileSync(`content/editorial/${guide.bodyFile}`, 'utf8');
    for (const match of renderMarkdown(body).html.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
      const text = match[1].replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      if (text.split(/\s+/).length < 12) continue;
      if (seen.has(text)) duplicates.push({ firstGuide: seen.get(text), repeatedGuide: guide.key });
      else seen.set(text, guide.key);
    }
  }
  report.exactInternalDuplicateParagraphs = duplicates;
  report.duplicationCheckScope = 'Normalized body paragraphs of at least 12 words, within and across the four local guides; not an internet originality check.';
  assert.equal(duplicates.length, 0, 'Review repeated body paragraphs');
  const replacements = changedGuides.map(guide => {
    const previous = before.find(post => post.slug === guide.slug);
    assert.equal(previous.cover_image_id, guide.cover_image_id, 'Preserve the existing reviewed cover');
    const body = fs.readFileSync(`content/editorial/${guide.bodyFile}`, 'utf8').replace(/\r\n?/g, '\n').trim();
    const rendered = renderMarkdown(body, { title: guide.title });
    assert.ok(body.length <= 100000 && rendered.toc, 'Editor limit and readable outline required');
    for (const source of [...rendered.html.matchAll(/(?:href|src)="(\/[^"#]+)"/g)].map(match => match[1])) {
      assert.ok(fs.existsSync(path.join('frontend', source)), `Missing authored example or tool: ${source}`);
    }
    const metadata = Object.fromEntries(Object.entries(previous).filter(([key]) => key !== 'body'));
    report.articles.push({ slug: guide.slug, before: stats(previous.body, previous.title), after: stats(body, guide.title), bodyMd5: md5(body), originalPublicationDate: previous.published_at });
    fs.writeFileSync(`${directory}/preview/${guide.key}.html`, renderArticle({ ...previous, ...guide, body }, 'https://nevco.online'));
    return { slug: guide.slug, expectedBodyMd5: md5(previous.body), metadata, body, bodyMd5: md5(body) };
  });
  const payload = JSON.stringify(replacements);
  assert.ok(!payload.includes('$audit_payload$') && !payload.includes('$audit_release$'), 'SQL delimiter appears in the content');
  const sql = `BEGIN;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
DO $audit_release$
DECLARE item jsonb; previous public.posts%ROWTYPE; changed integer := 0;
BEGIN
  IF (SELECT count(*) FROM public.posts WHERE status = 'published') <> 4 THEN
    RAISE EXCEPTION 'Published catalog changed; refresh the release scope';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements($audit_payload$${payload}$audit_payload$::jsonb) ORDER BY value->>'slug' LOOP
    SELECT * INTO STRICT previous FROM public.posts WHERE slug = item->>'slug' FOR UPDATE;
    IF previous.status <> 'published' OR md5(previous.body) <> item->>'expectedBodyMd5'
       OR NOT (to_jsonb(previous) @> (item->'metadata')) THEN
      RAISE EXCEPTION 'Concurrent article edit detected: %; no changes applied', previous.slug;
    END IF;
    INSERT INTO public.post_revisions(post_id, snapshot, actor_id) VALUES(previous.id, to_jsonb(previous), null);
    UPDATE public.posts SET body = item->>'body', updated_at = now() WHERE id = previous.id;
    IF md5(item->>'body') <> item->>'bodyMd5' THEN RAISE EXCEPTION 'Prepared body hash mismatch'; END IF;
    changed := changed + 1;
  END LOOP;
  IF changed <> 3 THEN RAISE EXCEPTION 'Expected exactly three body updates'; END IF;
END $audit_release$;
COMMIT;
SELECT slug, updated_at, md5(body) AS body_md5 FROM public.posts
WHERE slug IN (${replacements.map(row => `'${row.slug}'`).join(', ')}) ORDER BY slug;
`;
  fs.writeFileSync(`${directory}/publish.sql`, sql);
  fs.writeFileSync('docs/audits/adsense-followup-editorial.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
