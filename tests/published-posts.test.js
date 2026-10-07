const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

class Element {
  constructor(tag) { this.tagName = tag; this.children = []; this.listeners = {}; this.style = {}; this.attributes = {}; this.hidden = false; this.disabled = false; }
  append(...nodes) { for (const node of nodes) for (const child of node.tagName === 'fragment' ? node.children : [node]) { child.parentElement = this; this.children.push(child); } }
  remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter(node => node !== this); }
  replaceChildren(...nodes) { this.children = nodes.flatMap(node => node.tagName === 'fragment' ? node.children : [node]); }
  querySelector(selector) { return this.children.find(node => node.tagName === selector) || null; }
  addEventListener(event, handler) { this.listeners[event] = handler; }
  setAttribute(name, value) { this.attributes[name] = value; }
  removeAttribute(name) { delete this.attributes[name]; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  set href(value) { this.setAttribute('href', value); }
  get href() { return this.getAttribute('href') || ''; }
  set innerHTML(value) { this._innerHTML = value; this.children = value ? [new Element('loading')] : []; }
  get innerHTML() { return this._innerHTML || ''; }
}

async function setup(responses, article = false, { serverRendered = false, existingCard = null, search = '?slug=image-blog' } = {}) {
  const ids = article ? { publishedArticle: new Element('article'), articleStatus: new Element('p') } : {
    publishedGuideCards: new Element('div'), blogsStatus: new Element('p'), blogPagination: new Element('nav'),
    blogsPrev: new Element('a'), blogsNext: new Element('a'), blogsPage: new Element('span'), blogRetrySlot: new Element('div')
  };
  if (!article) Object.defineProperty(ids, 'blogsRetry', { get: () => ids.blogRetrySlot.children[0] });
  if (article) ids.publishedArticle.append(new Element('h1'), ids.articleStatus);
  if (!article && serverRendered) ids.publishedGuideCards.setAttribute('data-server-rendered', 'true');
  if (!article && existingCard) ids.publishedGuideCards.append(existingCard);
  const calls = [];
  const urls = [];
  const document = { getElementById: id => ids[id], createElement: tag => new Element(tag), createDocumentFragment: () => new Element('fragment') };
  await vm.runInNewContext(fs.readFileSync('frontend/assets/js/published-posts.js', 'utf8'), {
    document, location: { search, hostname: 'example.test', origin: 'https://site.example' }, URLSearchParams,
    window: { ANVIL_CONFIG: { API_BASE_URL: 'https://api.example', SITE_URL: 'https://site.example' }, history: { replaceState: (state, title, url) => urls.push(url) } },
    AnvilAPI: { fetch: async path => {
      calls.push(path); const response = responses.shift(); if (response instanceof Error) throw response;
      return { ok: true, headers: { get: name => name === 'X-Total-Count' ? (Object.hasOwn(response, 'totalHeader') ? response.totalHeader : String(response.total ?? response.data.length)) : null }, json: async () => response.data };
    } }
  });
  return { ids, calls, urls };
}

test('blogs show 30 posts and use ordinary numbered links with page-specific documents', async () => {
  const first = Array.from({ length: 30 }, (_, i) => ({ slug: `blog-${i}`, title: `Blog ${i}`, cover_image_id: `image-${i}`, cover_alt: `Cover ${i}` }));
  const { ids, calls } = await setup([{ data: first, total: 31 }]);
  assert.equal(ids.publishedGuideCards.children.length, 30);
  assert.equal(ids.publishedGuideCards.children[0].children[0].src, 'https://site.example/journal-images/image-0');
  assert.equal(ids.blogsPage.textContent, 'Page 1 of 2 · 31 guides');
  assert.equal(ids.blogsPrev.disabled, true); assert.equal(ids.blogsNext.disabled, false);
  assert.equal(ids.blogsPrev.getAttribute('href'), null);
  assert.equal(ids.blogsNext.href, '/blog/index.html?page=2');
  assert.equal(ids.blogsNext.listeners.click, undefined);
  assert.deepEqual(calls, ['/api/public/posts?limit=30&offset=0']);
  const second = await setup([{ data: [{ slug: 'last-blog', title: 'Last blog' }], total: 31 }], false, { search: '?page=2' });
  assert.deepEqual(second.calls, ['/api/public/posts?limit=30&offset=30']);
  assert.equal(second.ids.publishedGuideCards.children.length, 1);
  assert.equal(second.ids.blogsPrev.href, '/blog/index.html');
  assert.equal(second.ids.blogsNext.getAttribute('href'), null);
});

test('failed blog requests show an error and retry the same page', async () => {
  const { ids, calls } = await setup([new Error('Connection failed'), { data: [], total: 0 }]);
  assert.equal(ids.blogsStatus.textContent, 'Connection failed'); assert.equal(ids.blogsRetry.hidden, false);
  await ids.blogsRetry.listeners.click();
  assert.equal(calls[0], calls[1]); assert.equal(ids.blogsStatus.textContent, 'No articles published yet.');
  assert.equal(ids.blogRetrySlot.children.length, 0);
});

test('legacy article page displays its cover and renders content as text', async () => {
  const post = { title: 'Image blog', body: '<script>unsafe()</script>', cover_image_id: 'cover', cover_alt: 'Example image' };
  const { ids, calls } = await setup([{ data: post }], true);
  assert.equal(calls[0], '/api/public/posts/image-blog'); assert.equal(ids.publishedArticle.children[2].src, 'https://site.example/journal-images/cover');
  assert.equal(ids.publishedArticle.children[3].textContent, '<script>unsafe()</script>');
});

test('server-rendered cards stay visible without an initial browser request', async () => {
  const existingCard = new Element('article');
  const { ids, calls } = await setup([], false, { serverRendered: true, existingCard });
  assert.equal(calls.length, 0);
  assert.equal(ids.publishedGuideCards.children[0], existingCard);
  assert.equal(ids.blogRetrySlot.children.length, 0);
});

test('a failed enhancement request preserves existing article cards', async () => {
  const existingCard = new Element('article');
  const { ids } = await setup([new Error('Connection failed')], false, { existingCard });
  assert.equal(ids.publishedGuideCards.children[0], existingCard);
  assert.equal(ids.blogsRetry.hidden, false);
});

test('an old distant page jumps directly to the last current page with one retry', async () => {
  const { calls, ids, urls } = await setup([{ data: [], total: 4 }, { data: [{ slug: 'current-guide', title: 'Current guide' }], total: 4 }], false, { search: '?page=30000' });
  assert.deepEqual(calls, ['/api/public/posts?limit=30&offset=899970', '/api/public/posts?limit=30&offset=0']);
  assert.equal(ids.publishedGuideCards.children.length, 1);
  assert.equal(ids.blogPagination.hidden, true);
  assert.deepEqual(urls, ['/blog/index.html']);
});

test('missing or invalid totals recover an old page with a single request to page one', async () => {
  for (const totalHeader of [null, '', 'unknown', '-1', '1.5', 'Infinity', '9007199254740992']) {
    const { calls, ids, urls } = await setup([{ data: [], totalHeader }, { data: [], total: 0 }], false, { search: '?page=30000' });
    assert.deepEqual(calls, ['/api/public/posts?limit=30&offset=899970', '/api/public/posts?limit=30&offset=0']);
    assert.equal(ids.blogsStatus.textContent, 'No articles published yet.');
    assert.equal(ids.blogPagination.hidden, true);
    assert.deepEqual(urls, ['/blog/index.html']);
  }
});

test('a changing count cannot cause an unbounded chain of empty-page requests', async () => {
  const { calls } = await setup([{ data: [], total: 1000 }, { data: [], total: 1000 }], false, { search: '?page=30000' });
  assert.deepEqual(calls, ['/api/public/posts?limit=30&offset=899970', '/api/public/posts?limit=30&offset=990']);
});
