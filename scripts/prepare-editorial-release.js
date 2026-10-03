// Builds a guarded, reviewable SQL transaction; executing it is a separate step.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { renderMarkdown } = require('../backend/src/lib/editorial-markdown');
const { renderArticle } = require('../backend/src/lib/articles');
const release = require('../content/editorial/release-2026-10-04.json');
const output = 'deployment/editorial-2026-10-04';
fs.mkdirSync(`${output}/preview`, { recursive: true });
const report = { release: release.release, articles: [], redirects: 0, archived: 0 };
const posts = release.posts.map(post => {
  const body = fs.readFileSync(`content/editorial/${post.key}.md`, 'utf8').trim();
  assert.ok(body.length <= 100000, `${post.key}: admin editor character limit`);
  const rendered = renderMarkdown(body, { title: post.title });
  const text = rendered.html.replace(/<[^>]+>/g, ' ').replace(/&(?:#\d+|#x[0-9a-f]+|[a-z]+);/gi, ' ').trim();
  const words = text.split(/\s+/).filter(part => /[\p{L}\p{N}]/u.test(part)).length;
  assert.ok(words >= release.minimumWords, `${post.key}: ${words} words is below ${release.minimumWords}`);
  assert.ok(rendered.toc, `${post.key}: missing HTML outline`);
  assert.ok(post.seo_title.length <= 65 && post.seo_description.length >= 100 && post.seo_description.length <= 170);
  assert.ok(post.cover_image_id && post.cover_alt.length > 20);
  assert.ok(!/\b(?:TODO|TBD|lorem ipsum)\b/i.test(body));
  const links = [...rendered.html.matchAll(/href="([^"#]+)"/g)].map(match => match[1]);
  for (const link of links.filter(link => link.startsWith('/') && !link.startsWith('/journal/'))) assert.ok(fs.existsSync(`frontend${link}`), `${post.key}: ${link}`);
  const detail = { slug: post.slug, words, characters: body.length, chapters: rendered.headings.filter(h => h.level === 2).length, cover: post.cover_image_id, bodyMd5: createHash('md5').update(body).digest('hex') };
  report.articles.push(detail);
  fs.writeFileSync(`${output}/preview/${post.key}.html`, renderArticle({ ...post, body, published_at: '2026-09-29T00:00:00Z', updated_at: '2026-10-04T00:00:00Z' }, 'https://nevco.online'));
  return { ...post, body };
});
const payload = JSON.stringify(posts);
assert.ok(!payload.includes('$editorial_payload$'));
const sql = `begin;
do $editorial_release$
declare item jsonb; previous public.posts%rowtype;
begin
  for item in select value from jsonb_array_elements($editorial_payload$${payload}$editorial_payload$::jsonb) loop
    select * into previous from public.posts where slug = item->>'slug' for update;
    if not found then raise exception 'Article missing: %', item->>'slug'; end if;
    if previous.status <> 'published' or previous.updated_at <> (item->>'expectedUpdatedAt')::timestamptz or md5(previous.body) <> item->>'expectedBodyMd5' then
      raise exception 'Article changed since review: %; no release applied', item->>'slug';
    end if;
    if not exists (select 1 from public.media_assets where id = (item->>'cover_image_id')::uuid) then raise exception 'Cover missing'; end if;
    insert into public.post_revisions(post_id,snapshot,actor_id) values(previous.id,to_jsonb(previous),null);
    update public.posts set title=item->>'title',excerpt=item->>'excerpt',body=item->>'body',
      seo_title=item->>'seo_title',seo_description=item->>'seo_description',
      cover_image_id=(item->>'cover_image_id')::uuid,cover_alt=item->>'cover_alt',category_slug=item->>'category_slug',
      tags=array(select jsonb_array_elements_text(item->'tags')),updated_at=now()
    where id=previous.id;
  end loop;
end $editorial_release$;
commit;
select slug,title,status,cover_image_id,updated_at,md5(body) as body_md5 from public.posts where slug in (${posts.map(p => `'${p.slug}'`).join(',')}) order by slug;
`;
fs.writeFileSync(`${output}/publish-completed-guides.sql`, sql);
fs.writeFileSync(`${output}/completed-guides.json`, JSON.stringify(posts, null, 2));
fs.writeFileSync('docs/audits/editorial-release.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
