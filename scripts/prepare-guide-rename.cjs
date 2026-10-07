// Prepare one guarded content update; the caller executes the reviewed SQL separately.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { renderArticle } = require('../backend/src/lib/articles');
const directory = 'deployment/guide-samples-2026-10-07';
const [{ snapshot: previous, body_md5: previousBodyHash }] = JSON.parse(fs.readFileSync(`${directory}/database-before.json`, 'utf8'));
const guide = require('../content/editorial/published-library.json').find(item => item.key === 'temporary-email');
assert.equal(previous.slug, 'best-practices-for-temporary-email-when-working-with-signups');
assert.equal(previous.status, 'published');
assert.equal(previous.cover_image_id, guide.cover_image_id);
const body = fs.readFileSync('content/editorial/' + guide.bodyFile, 'utf8').replace(/\r\n?/g, '\n').trim();
assert.doesNotMatch(body, /signup|verification email/i);
assert.match(body, /ban evasion, repeated registrations/);
const next = { slug: guide.slug, title: guide.title, excerpt: guide.excerpt, body,
  seo_title: guide.title, seo_description: guide.excerpt, tags: ['temporary email', 'authorized testing', 'email delivery', 'provider limits'] };
const payload = { previous, previousBodyHash, next, bodyMd5: createHash('md5').update(body).digest('hex') };
assert.ok(!JSON.stringify(payload).includes('$guide_payload$'));
const sql = `BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $guide_update$
DECLARE item jsonb := $guide_payload$${JSON.stringify(payload)}$guide_payload$::jsonb;
        previous public.posts%ROWTYPE;
        changed integer;
BEGIN
  SELECT * INTO STRICT previous FROM public.posts WHERE id = item->'previous'->>'id' FOR UPDATE;
  IF previous.slug IS DISTINCT FROM item->'previous'->>'slug'
    OR previous.updated_at IS DISTINCT FROM (item->'previous'->>'updated_at')::timestamptz
    OR previous.status <> 'published'
    OR md5(previous.body) <> item->>'previousBodyHash'
    OR to_jsonb(previous) IS DISTINCT FROM to_jsonb(jsonb_populate_record(NULL::public.posts, item->'previous')) THEN
    RAISE EXCEPTION 'Guide changed since the snapshot; refresh and review before publishing';
  END IF;
  IF EXISTS (SELECT 1 FROM public.posts WHERE slug = item->'next'->>'slug') THEN
    RAISE EXCEPTION 'New guide URL already exists';
  END IF;
  INSERT INTO public.post_revisions(post_id, snapshot, actor_id) VALUES(previous.id, to_jsonb(previous), null);
  UPDATE public.posts SET slug = item->'next'->>'slug', title = item->'next'->>'title',
    excerpt = item->'next'->>'excerpt', body = item->'next'->>'body',
    seo_title = item->'next'->>'seo_title', seo_description = item->'next'->>'seo_description',
    tags = ARRAY(SELECT jsonb_array_elements_text(item->'next'->'tags')), updated_at = now()
    WHERE id = previous.id;
  GET DIAGNOSTICS changed = ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Expected exactly one guide update'; END IF;
END $guide_update$;
COMMIT;
SELECT id,slug,title,published_at,cover_image_id,md5(body) AS body_md5 FROM public.posts WHERE id = '${previous.id}';
`;
fs.writeFileSync(`${directory}/publish.sql`, sql);
fs.writeFileSync(`${directory}/payload.json`, JSON.stringify(payload, null, 2) + '\n');
fs.writeFileSync(`${directory}/guide-preview.html`, renderArticle({ ...previous, ...next }, 'https://nevco.online'));
console.log('Prepared one guide update with a complete snapshot guard and revision backup; ID, cover, and publication date stay unchanged.');
