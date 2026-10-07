// Prepare the already-reviewed release; this script does not execute SQL or upload.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { renderMarkdown } = require('../backend/src/lib/editorial-markdown');
const { renderArticle } = require('../backend/src/lib/articles');
const release = require('../content/editorial/release-2026-10-07.json');
const directory = 'deployment/editorial-expansion-2026-10-07';
const postsBefore = JSON.parse(fs.readFileSync(`${directory}/database-before.json`, 'utf8'));
const mediaBefore = JSON.parse(fs.readFileSync(`${directory}/media-before.json`, 'utf8'));
fs.mkdirSync(`${directory}/preview`, { recursive: true });
const posts = release.posts.map(post => {
  const body = fs.readFileSync(`content/editorial/${post.bodyFile}`, 'utf8').replace(/\r\n?/g, '\n').trim();
  const rendered = renderMarkdown(body, { title: post.title });
  assert.ok(rendered.toc && rendered.headings.length >= 8);
  assert.ok(body.length <= 100000 && !/\b(?:TODO|TBD|lorem ipsum)\b/i.test(body));
  assert.ok(post.seo_title.length <= 65 && post.excerpt.length >= 100 && post.excerpt.length <= 170);
  for (const [, href] of rendered.html.matchAll(/href="([^"#]+)"/g)) {
    if (href.startsWith('/') && !href.startsWith('/journal/')) assert.ok(fs.existsSync('frontend' + href), href);
    if (href.startsWith('/journal/')) assert.ok(require('../content/editorial/published-library.json').some(item => '/journal/' + item.slug === href), href);
    if (href.includes('/api/public/experiment-assets/')) assert.ok(fs.existsSync('backend/assets/experiments/' + href.split('/experiment-assets/')[1]), href);
  }
  fs.writeFileSync(`${directory}/preview/${post.key}.html`, renderArticle({ ...post, body, published_at: new Date().toISOString(), updated_at: new Date().toISOString() }, 'https://nevco.online'));
  return { ...post, id: post.slug, body, body_md5: createHash('md5').update(body).digest('hex') };
});
const covers = release.covers.map(cover => {
  assert.equal(createHash('sha256').update(fs.readFileSync(cover.source)).digest('hex'), cover.sha256);
  const prior = mediaBefore.find(item => item.snapshot.id === cover.id)?.snapshot;
  assert.equal(Boolean(prior), cover.replace);
  return { ...cover, previous: prior || null };
});
const previousPosts = covers.filter(item => item.replace).map(cover => {
  const prior = postsBefore.find(item => item.snapshot.slug === cover.slug); assert.ok(prior);
  assert.equal(prior.snapshot.cover_image_id, cover.id); return { ...prior, cover };
});
const payload = { covers, previousPosts, posts };
assert.ok(!JSON.stringify(payload).includes('$expansion_payload$'));
const sql = `BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
DO $expansion$
DECLARE payload jsonb := $expansion_payload$${JSON.stringify(payload)}$expansion_payload$::jsonb;
        item jsonb; old_media public.media_assets%ROWTYPE; old_post public.posts%ROWTYPE; new_post public.posts%ROWTYPE;
BEGIN
  FOR item IN SELECT value FROM jsonb_array_elements(payload->'covers') LOOP
    IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id='editorial-media' AND name=item->>'storage_path') THEN RAISE EXCEPTION 'Uploaded cover missing: %', item->>'key'; END IF;
    IF (item->>'replace')::boolean THEN
      SELECT * INTO STRICT old_media FROM public.media_assets WHERE id=(item->>'id')::uuid FOR UPDATE;
      IF to_jsonb(old_media) IS DISTINCT FROM to_jsonb(jsonb_populate_record(NULL::public.media_assets,item->'previous')) THEN RAISE EXCEPTION 'Cover changed since review: %', item->>'key'; END IF;
      UPDATE public.media_assets SET storage_path=item->>'storage_path',alt_text=item->>'alt',file_name=item->>'key'||'.webp',mime_type='image/webp',width=(item->>'width')::integer,height=(item->>'height')::integer WHERE id=old_media.id;
    ELSE
      IF EXISTS (SELECT 1 FROM public.media_assets WHERE id=(item->>'id')::uuid OR storage_path=item->>'storage_path') THEN RAISE EXCEPTION 'New cover already registered'; END IF;
      INSERT INTO public.media_assets(id,storage_path,alt_text,file_name,mime_type,width,height) VALUES((item->>'id')::uuid,item->>'storage_path',item->>'alt',item->>'key'||'.webp','image/webp',(item->>'width')::integer,(item->>'height')::integer);
    END IF;
  END LOOP;
  FOR item IN SELECT value FROM jsonb_array_elements(payload->'previousPosts') LOOP
    SELECT * INTO STRICT old_post FROM public.posts WHERE id=item->'snapshot'->>'id' FOR UPDATE;
    IF to_jsonb(old_post) IS DISTINCT FROM to_jsonb(jsonb_populate_record(NULL::public.posts,item->'snapshot')) OR md5(old_post.body)<>item->>'body_md5' THEN RAISE EXCEPTION 'Article changed since review: %', old_post.slug; END IF;
    INSERT INTO public.post_revisions(post_id,snapshot,actor_id) VALUES(old_post.id,to_jsonb(old_post),null);
    UPDATE public.posts SET cover_alt=item->'cover'->>'alt',updated_at=now() WHERE id=old_post.id;
    INSERT INTO public.audit_logs(actor_id,action,target,details) VALUES(null,'post.cover_updated',old_post.id,jsonb_build_object('release','editorial-expansion-2026-10-07','original_object_preserved',true));
  END LOOP;
  FOR item IN SELECT value FROM jsonb_array_elements(payload->'posts') LOOP
    IF EXISTS (SELECT 1 FROM public.posts WHERE id=item->>'id' OR slug=item->>'slug') THEN RAISE EXCEPTION 'New article already exists: %', item->>'slug'; END IF;
    INSERT INTO public.posts(id,slug,title,excerpt,body,status,category_slug,seo_title,seo_description,published_at,cover_image_id,cover_alt,tags)
    VALUES(item->>'id',item->>'slug',item->>'title',item->>'excerpt',item->>'body','published',item->>'category_slug',item->>'seo_title',item->>'excerpt',now(),(item->>'cover_image_id')::uuid,item->>'cover_alt',ARRAY(SELECT jsonb_array_elements_text(item->'tags'))) RETURNING * INTO new_post;
    IF md5(new_post.body)<>item->>'body_md5' THEN RAISE EXCEPTION 'Article body transfer mismatch'; END IF;
    INSERT INTO public.post_revisions(post_id,snapshot,actor_id) VALUES(new_post.id,to_jsonb(new_post),null);
    INSERT INTO public.audit_logs(actor_id,action,target,details) VALUES(null,'post.published',new_post.id,jsonb_build_object('release','editorial-expansion-2026-10-07','synthetic_browser_experiment',true));
  END LOOP;
END $expansion$;
COMMIT;
SELECT slug,title,cover_image_id,published_at,md5(body) AS body_md5 FROM public.posts WHERE slug IN (${[...previousPosts.map(item => item.snapshot.slug), ...posts.map(item => item.slug)].map(slug => `'${slug}'`).join(',')}) ORDER BY slug;
`;
fs.writeFileSync(`${directory}/publish.sql`, sql);
fs.writeFileSync(`${directory}/payload.json`, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ prepared: true, coverReplacements: 2, newArticles: posts.map(item => ({ slug: item.slug, words: item.body.split(/\s+/).length, bodyMd5: item.body_md5 })), originalCoverUrlsAndObjectsPreserved: true }));
