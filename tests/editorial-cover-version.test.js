const { test } = require('node:test');
const assert = require('node:assert/strict');
const { imageUrl, renderArticle } = require('../backend/src/lib/articles');
const { renderBlog } = require('../backend/src/lib/blog');
const release = require('../content/editorial/release-2026-10-07.json');
test('article and hub covers use the same content version to bypass stale frontend image caches', () => {
  for (const cover of release.covers) for (const origin of ['https://nevco.online','https://anviltools.vercel.app']) {
    const post = { slug:cover.slug,title:'Test cover',body:'Test body',cover_image_id:cover.id,cover_alt:cover.alt };
    const url = `${origin}/journal-images/${cover.id}?v=${cover.sha256.slice(0,12)}`;
    assert.equal(imageUrl(post,origin),url);
    assert.ok(renderArticle(post,origin).includes(`class="article-cover" src="${url}"`));
    assert.ok(renderBlog([post],origin).includes(`class="guide-cover" src="${url}"`));
  }
});
test('unversioned uploads and static experiment covers retain their existing URLs', () => {
  assert.equal(imageUrl({cover_image_id:'other-image'},'https://nevco.online'),'https://nevco.online/journal-images/other-image');
  assert.equal(imageUrl({cover_path:'/assets/images/editorial/example.png'},'https://nevco.online'),'https://nevco.online/assets/images/editorial/example.png');
  assert.equal(imageUrl({},'https://nevco.online'),null);
});
