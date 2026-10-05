// Prepare, but never execute, a guarded update against the reviewed DB snapshot.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { renderArticle } = require('../backend/src/lib/articles');
const { renderMarkdown } = require('../backend/src/lib/editorial-markdown');
const library = require('../content/editorial/published-library.json');
const directory = 'deployment/crawler-recheck-2026-10-05';
const before = JSON.parse(fs.readFileSync(`${directory}/database-before.json`, 'utf8'));
const md5 = text => createHash('md5').update(text).digest('hex');
fs.mkdirSync(`${directory}/preview`, { recursive: true });
assert.equal(before.length, library.length);
const updates = library.map(guide => {
  const previous = before.find(post => post.slug === guide.slug);
  assert.ok(previous && previous.status === 'published');
  assert.equal(previous.cover_image_id, guide.cover_image_id);
  const body = fs.readFileSync(`content/editorial/${guide.bodyFile}`, 'utf8').replace(/\r\n?/g, '\n').trim();
  assert.ok(body.length <= 100000 && renderMarkdown(body, { title: guide.title }).toc);
  const metadata = { ...previous }; delete metadata.body;
  fs.writeFileSync(`${directory}/preview/${guide.key}.html`, renderArticle({ ...previous, body }, 'https://nevco.online'));
  return { slug: guide.slug, expectedBodyMd5: md5(previous.body), metadata, body, bodyMd5: md5(body) };
});
assert.ok(updates.every(item => item.expectedBodyMd5 !== item.bodyMd5));
const payload = JSON.stringify(updates);
assert.ok(!payload.includes('$audit_payload$') && !payload.includes('$audit_release$'));
const sql = `BEGIN;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '60s';
DO $audit_release$
DECLARE item jsonb; previous public.posts%ROWTYPE; changed integer := 0;
BEGIN
  IF (SELECT count(*) FROM public.posts WHERE status = 'published') <> ${library.length} THEN
    RAISE EXCEPTION 'Published catalog changed; refresh the release scope';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements($audit_payload$${payload}$audit_payload$::jsonb) ORDER BY value->>'slug' LOOP
    SELECT * INTO STRICT previous FROM public.posts WHERE slug = item->>'slug' FOR UPDATE;
    IF previous.status <> 'published' OR md5(previous.body) <> item->>'expectedBodyMd5'
       OR NOT (to_jsonb(previous) @> (item->'metadata')) THEN
      RAISE EXCEPTION 'Concurrent article edit detected: %; no changes applied', previous.slug;
    END IF;
    IF md5(item->>'body') <> item->>'bodyMd5' THEN RAISE EXCEPTION 'Prepared body hash mismatch'; END IF;
    INSERT INTO public.post_revisions(post_id, snapshot, actor_id) VALUES(previous.id, to_jsonb(previous), null);
    UPDATE public.posts SET body = item->>'body', updated_at = now() WHERE id = previous.id;
    changed := changed + 1;
  END LOOP;
  IF changed <> ${updates.length} THEN RAISE EXCEPTION 'Unexpected update count'; END IF;
END $audit_release$;
COMMIT;
SELECT slug, updated_at, md5(body) AS body_md5 FROM public.posts WHERE status = 'published' ORDER BY slug;
`;
fs.writeFileSync(`${directory}/publish.sql`, sql);
fs.writeFileSync('docs/audits/crawler-recheck-publication-prepared.json', JSON.stringify({ preparedAt: new Date().toISOString(), projectId: 'epxzxcqsonxscyvbopqt', state: 'prepared-not-published', articles: updates.map(({ body, metadata, ...item }) => ({ ...item, bytes: Buffer.byteLength(body), h2Sections: renderMarkdown(body).headings.filter(heading => heading.level === 2).length })) }, null, 2) + '\n');
console.log(`Prepared ${updates.length} guarded body updates with complete revision backups.`);
