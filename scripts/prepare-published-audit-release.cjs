// Prepare a guarded SQL transaction for corrections reviewed in a published snapshot.
// This script writes SQL locally; it never connects to Supabase.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const snapshotArg = process.argv.find((argument) => argument.startsWith('--snapshot='));
if (!snapshotArg) throw new Error('Pass --snapshot=deployment/<review-directory>.');
const directory = path.resolve(root, snapshotArg.slice('--snapshot='.length));
const release = JSON.parse(fs.readFileSync(path.join(directory, 'corrections.json'), 'utf8'));
const payload = JSON.stringify(release.corrections);
const delimiter = '$published_audit_payload$';
if (payload.includes(delimiter)) throw new Error('SQL payload delimiter collision.');
if (!release.corrections.length) throw new Error('No reviewed corrections found.');

const sql = `BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
DO $published_audit$
DECLARE
  item jsonb;
  previous public.posts%ROWTYPE;
  changed integer := 0;
BEGIN
  FOR item IN SELECT value FROM jsonb_array_elements(${delimiter}${payload}${delimiter}::jsonb) LOOP
    SELECT * INTO STRICT previous
    FROM public.posts
    WHERE slug = item->>'slug'
    FOR UPDATE;

    IF previous.status <> 'published'
      OR encode(extensions.digest(convert_to(previous.body, 'UTF8'), 'sha256'), 'hex') <> item->>'expected_body_sha256'
      OR previous.title IS DISTINCT FROM item->'expected'->>'title'
      OR previous.excerpt IS DISTINCT FROM item->'expected'->>'excerpt'
      OR previous.seo_title IS DISTINCT FROM item->'expected'->>'seo_title'
      OR previous.seo_description IS DISTINCT FROM item->'expected'->>'seo_description'
      OR previous.cover_image_id::text IS DISTINCT FROM item->'expected'->>'cover_image_id'
      OR previous.cover_alt IS DISTINCT FROM item->'expected'->>'cover_alt'
      OR previous.category_slug IS DISTINCT FROM item->'expected'->>'category_slug'
      OR previous.published_at IS DISTINCT FROM (item->'expected'->>'published_at')::timestamptz
      OR previous.tags IS DISTINCT FROM ARRAY(SELECT jsonb_array_elements_text(item->'expected'->'tags')) THEN
      RAISE EXCEPTION 'Published article changed since review: %', item->>'slug';
    END IF;

    IF encode(extensions.digest(convert_to(COALESCE(item->'next'->>'body', previous.body), 'UTF8'), 'sha256'), 'hex') <> item->'next'->>'body_sha256' THEN
      RAISE EXCEPTION 'Prepared body hash mismatch: %', item->>'slug';
    END IF;

    INSERT INTO public.post_revisions(post_id, snapshot, actor_id)
    VALUES(previous.id, to_jsonb(previous), null);

    UPDATE public.posts
    SET body = COALESCE(item->'next'->>'body', previous.body),
        excerpt = item->'next'->>'excerpt',
        cover_alt = item->'next'->>'cover_alt',
        updated_at = clock_timestamp()
    WHERE id = previous.id AND status = 'published';

    INSERT INTO public.audit_logs(actor_id, action, target, details)
    VALUES(null, 'post.editorial_audit_corrected', previous.id,
      jsonb_build_object('release', '${release.release}', 'fields', item->'changed_fields'));
    changed := changed + 1;
  END LOOP;

  IF changed <> ${release.corrections.length} THEN
    RAISE EXCEPTION 'Unexpected correction count: %', changed;
  END IF;
END $published_audit$;
COMMIT;

SELECT slug, status, updated_at,
       char_length(excerpt) AS excerpt_length,
       encode(extensions.digest(convert_to(body, 'UTF8'), 'sha256'), 'hex') AS body_sha256,
       cover_alt
FROM public.posts
WHERE slug IN (${release.corrections.map((item) => `'${item.slug.replaceAll("'", "''")}'`).join(', ')})
ORDER BY slug;
`;

fs.writeFileSync(path.join(directory, 'publish-corrections.sql'), sql);
console.log(JSON.stringify({ prepared: true, release: release.release, corrections: release.corrections.length, file: path.join(directory, 'publish-corrections.sql') }));
