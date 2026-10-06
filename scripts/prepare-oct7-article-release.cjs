// Build a reviewable, concurrency-guarded update. Never execute this SQL here.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { renderArticle } = require('../backend/src/lib/articles');
const library = require('../content/editorial/published-library.json');
const directory = 'deployment/adsense-audit-2026-10-07';
const before = JSON.parse(fs.readFileSync(`${directory}/database-before.json`, 'utf8'));
const md5 = value => createHash('md5').update(value).digest('hex');
const updates = [];
for (const guide of library) {
  const previous = before.find(post => post.slug === guide.slug);
  assert.ok(previous && previous.status === 'published');
  assert.equal(previous.cover_image_id, guide.cover_image_id);
  const body = fs.readFileSync('content/editorial/' + guide.bodyFile, 'utf8').replace(/\r\n?/g, '\n').trim();
  const next = { ...previous, body, title: guide.title, excerpt: guide.excerpt };
  if (guide.key === 'temporary-email') {
    next.seo_title = guide.title; next.seo_description = guide.excerpt;
    updates.push({ slug: guide.slug, before: previous, expectedBodyMd5: md5(previous.body), bodyMd5: md5(body), next: { body, title: next.title, excerpt: next.excerpt, seo_title: next.seo_title, seo_description: next.seo_description } });
  } else {
    assert.equal(body, previous.body.replace(/\r\n?/g, '\n').trim(), `Unexpected scope change: ${guide.slug}`);
    assert.equal(guide.title, previous.title); assert.equal(guide.excerpt, previous.excerpt);
  }
  fs.writeFileSync(`${directory}/preview/${guide.key}.html`, renderArticle(next, 'https://nevco.online'));
}
assert.equal(updates.length, 1);
const payload = JSON.stringify(updates);
assert.ok(!payload.includes('$oct7_payload$') && !payload.includes('$oct7_release$'));
const sql = `BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
DO $oct7_release$
DECLARE item jsonb; previous public.posts%ROWTYPE; changed integer := 0;
BEGIN
  FOR item IN SELECT value FROM jsonb_array_elements($oct7_payload$${payload}$oct7_payload$::jsonb) LOOP
    SELECT * INTO STRICT previous FROM public.posts WHERE slug = item->>'slug' FOR UPDATE;
    IF previous.status <> 'published'
      OR md5(previous.body) <> item->>'expectedBodyMd5'
      OR previous.updated_at IS DISTINCT FROM (item->'before'->>'updated_at')::timestamptz
      OR previous.title IS DISTINCT FROM item->'before'->>'title'
      OR previous.excerpt IS DISTINCT FROM item->'before'->>'excerpt'
      OR previous.cover_image_id::text IS DISTINCT FROM item->'before'->>'cover_image_id'
      OR previous.cover_alt IS DISTINCT FROM item->'before'->>'cover_alt'
      OR previous.published_at IS DISTINCT FROM (item->'before'->>'published_at')::timestamptz
      OR previous.seo_title IS DISTINCT FROM item->'before'->>'seo_title'
      OR previous.seo_description IS DISTINCT FROM item->'before'->>'seo_description' THEN
      RAISE EXCEPTION 'Concurrent guide edit detected; refresh the release snapshot: %', previous.slug;
    END IF;
    IF md5(item->'next'->>'body') <> item->>'bodyMd5' THEN RAISE EXCEPTION 'Prepared body hash mismatch'; END IF;
    INSERT INTO public.post_revisions(post_id, snapshot, actor_id) VALUES(previous.id, to_jsonb(previous), null);
    UPDATE public.posts SET body = item->'next'->>'body', title = item->'next'->>'title', excerpt = item->'next'->>'excerpt',
      seo_title = item->'next'->>'seo_title', seo_description = item->'next'->>'seo_description', updated_at = now()
      WHERE id = previous.id;
    changed := changed + 1;
  END LOOP;
  IF changed <> 1 THEN RAISE EXCEPTION 'Unexpected update count'; END IF;
END $oct7_release$;
COMMIT;
SELECT slug, title, published_at, updated_at, cover_image_id, md5(body) AS body_md5
FROM public.posts WHERE slug = 'best-practices-for-temporary-email-when-working-with-signups';
`;
fs.writeFileSync(`${directory}/publish.sql`, sql);
fs.writeFileSync(`${directory}/publication-prepared.json`, JSON.stringify({ preparedAt: new Date().toISOString(), projectId: 'epxzxcqsonxscyvbopqt', state: 'prepared-not-published', articles: updates.map(item => ({ slug: item.slug, title: item.next.title, expectedBodyMd5: item.expectedBodyMd5, bodyMd5: item.bodyMd5, publishedAt: item.before.published_at, coverImageId: item.before.cover_image_id })) }, null, 2) + '\n');
console.log('Prepared one guarded guide update and four full article previews; publication dates and covers preserved. No database writes.');
