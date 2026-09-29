const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.style = {}; this.attributes = {}; this.hidden = false; this.disabled = false; }
  append(...nodes) { for (const node of nodes) this.children.push(...(node.tagName === 'fragment' ? node.children : [node])); }
  replaceChildren(...nodes) { this.children = nodes.flatMap(node => node.tagName === 'fragment' ? node.children : [node]); }
  querySelector(selector) { return this.children.find(node => node.tagName === selector) || null; }
  addEventListener(event, handler) { this.listeners[event] = handler; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  set innerHTML(value) { this._innerHTML = value; this.children = value ? [new Element('loading')] : []; }
  get innerHTML() { return this._innerHTML || ''; }
}

async function setup(responses, article = false) {
  const ids = article ? { publishedArticle: new Element('article'), articleStatus: new Element('p') } : {
    publishedGuideCards: new Element('div'), blogsStatus: new Element('p'), blogPagination: new Element('nav'),
    blogsPrev: new Element('button'), blogsNext: new Element('button'), blogsPage: new Element('span'), blogsRetry: new Element('button')
  };
  if (article) ids.publishedArticle.append(new Element('h1'), ids.articleStatus);
  const calls = [];
  const document = { getElementById: id => ids[id], createElement: tag => new Element(tag), createDocumentFragment: () => new Element('fragment') };
  await vm.runInNewContext(fs.readFileSync('frontend/assets/js/published-posts.js', 'utf8'), {
    document, location: { search: '?slug=image-blog', hostname: 'example.test' }, URLSearchParams,
    AnvilAPI: { fetch: async path => {
      calls.push(path); const response = responses.shift(); if (response instanceof Error) throw response;
      return { ok: true, headers: { get: name => name === 'X-Total-Count' ? String(response.total ?? response.data.length) : null }, json: async () => response.data };
    } }
  });
  return { ids, calls };
}

test('blogs show 30 database posts and use numbered pagination without hardcoded cards', async () => {
  const first = Array.from({ length: 30 }, (_, i) => ({ slug: `blog-${i}`, title: `Blog ${i}`, cover_image_id: `image-${i}`, cover_alt: `Cover ${i}` }));
  const { ids, calls } = await setup([{ data: first, total: 31 }, { data: [{ slug: 'last-blog', title: 'Last blog' }], total: 31 }]);
  assert.equal(ids.publishedGuideCards.children.length, 30);
  assert.equal(ids.publishedGuideCards.children[0].children[0].src, '/journal-images/image-0');
  assert.equal(ids.blogsPage.textContent, 'Page 1 of 2 · 31 blogs');
  assert.equal(ids.blogsPrev.disabled, true); assert.equal(ids.blogsNext.disabled, false);
  await ids.blogsNext.listeners.click();
  assert.deepEqual(calls, ['/api/public/posts?limit=30&offset=0', '/api/public/posts?limit=30&offset=30']);
  assert.equal(ids.publishedGuideCards.children.length, 1); assert.equal(ids.blogsPrev.disabled, false); assert.equal(ids.blogsNext.disabled, true);
});

test('failed blog requests show an error and retry the same page', async () => {
  const { ids, calls } = await setup([new Error('Connection failed'), { data: [], total: 0 }]);
  assert.equal(ids.blogsStatus.textContent, 'Connection failed'); assert.equal(ids.blogsRetry.hidden, false);
  await ids.blogsRetry.listeners.click();
  assert.equal(calls[0], calls[1]); assert.equal(ids.blogsStatus.textContent, 'No blogs published yet.');
});

test('legacy article page displays its cover and renders content as text', async () => {
  const post = { title: 'Image blog', body: '<script>unsafe()</script>', cover_image_id: 'cover', cover_alt: 'Example image' };
  const { ids, calls } = await setup([{ data: post }], true);
  assert.equal(calls[0], '/api/public/posts/image-blog'); assert.equal(ids.publishedArticle.children[2].src, '/journal-images/cover');
  assert.equal(ids.publishedArticle.children[3].textContent, '<script>unsafe()</script>');
});
