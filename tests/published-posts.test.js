const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.style = {}; }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.children = nodes; }
  querySelector(selector) {
    return this.children.find(node => selector === '[data-static-guide]' ? node.staticGuide : node.tagName === selector) || null;
  }
  insertBefore(fragment, before) {
    this.children.splice(before ? this.children.indexOf(before) : this.children.length, 0, ...fragment.children);
  }
  addEventListener(event, handler) { this.listeners[event] = handler; }
}

async function setup(responses, article = false) {
  const ids = article ? { publishedArticle: new Element('article'), articleStatus: new Element('p') } : {
    publishedGuideCards: new Element('div'), guidesStatus: new Element('p'), loadMoreGuides: new Element('button')
  };
  if (article) ids.publishedArticle.append(new Element('h1'), ids.articleStatus);
  else { const legacy = new Element('div'); legacy.staticGuide = true; ids.publishedGuideCards.append(legacy); }
  const calls = [];
  const document = { getElementById: id => ids[id], createElement: tag => new Element(tag), createDocumentFragment: () => new Element('fragment') };
  await vm.runInNewContext(fs.readFileSync('frontend/assets/js/published-posts.js', 'utf8'), {
    document, location: { search: '?slug=image-guide' }, URLSearchParams,
    AnvilAPI: { fetch: async path => {
      calls.push(path);
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return { ok: true, json: async () => response };
    } }
  });
  return { ids, calls, document };
}

test('guides include undated published posts, preserve static guides and load subsequent pages', async () => {
  const page = Array.from({ length: 12 }, (_, i) => ({ slug: `guide-${i}`, title: `Guide ${i}`, published_at: null, cover_image_id: `image-${i}`, cover_alt: `Cover ${i}` }));
  const { ids, calls } = await setup([page, [page[11], { slug: 'last-guide', title: 'Last guide' }]]);
  const cards = ids.publishedGuideCards;
  assert.equal(cards.children.length, 13);
  assert.equal(cards.children[0].children[0].src, '/journal-images/image-0');
  assert.equal(cards.children[0].children[0].alt, 'Cover 0');
  assert.equal(cards.children[0].children.at(-1).href, '/journal/guide-0');
  assert.equal(ids.loadMoreGuides.hidden, false);
  await ids.loadMoreGuides.listeners.click();
  assert.deepEqual(calls, ['/api/public/posts?limit=12&offset=0', '/api/public/posts?limit=12&offset=12']);
  assert.equal(cards.children.length, 14);
  assert.ok(cards.children.at(-1).staticGuide);
  assert.equal(ids.loadMoreGuides.hidden, true);
});

test('failed guide requests show an error and retry the same page', async () => {
  const { ids, calls } = await setup([new Error('Connection failed'), []]);
  assert.equal(ids.guidesStatus.textContent, 'Connection failed');
  assert.equal(ids.loadMoreGuides.disabled, false);
  assert.equal(ids.loadMoreGuides.hidden, false);
  await ids.loadMoreGuides.listeners.click();
  assert.equal(calls[0], calls[1]);
  assert.equal(ids.guidesStatus.textContent, '');
  assert.equal(ids.publishedGuideCards.children.length, 1);
});

test('legacy article page displays its cover and renders content as text', async () => {
  const { ids, calls } = await setup([{ title: 'Image guide', body: '<script>unsafe()</script>', cover_image_id: 'cover', cover_alt: 'Example image' }], true);
  assert.equal(calls[0], '/api/public/posts/image-guide');
  assert.equal(ids.publishedArticle.children[2].src, '/journal-images/cover');
  assert.equal(ids.publishedArticle.children[2].alt, 'Example image');
  assert.equal(ids.publishedArticle.children[3].textContent, '<script>unsafe()</script>');
});
