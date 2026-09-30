(async () => {
  const article = document.getElementById('publishedArticle');
  const cards = document.getElementById('publishedGuideCards');
  const status = document.getElementById(article ? 'articleStatus' : 'blogsStatus');
  const pagination = document.getElementById('blogPagination');
  const previous = document.getElementById('blogsPrev');
  const next = document.getElementById('blogsNext');
  const pageLabel = document.getElementById('blogsPage');
  const retry = document.getElementById('blogsRetry');
  if (!article && !cards) return;
  const apiBase = (window.ANVIL_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');

  const cover = (post, className) => {
    const image = document.createElement('img');
    image.src = `${apiBase}/api/public/post-images/${encodeURIComponent(post.cover_image_id)}`;
    image.alt = post.cover_alt || '';
    image.className = className;
    image.loading = className === 'guide-cover' ? 'lazy' : 'eager';
    return image;
  };

  const limit = 30;
  let page = 0;

  function renderBlogPage(posts, total) {
    const fragment = document.createDocumentFragment();
    for (const post of posts) {
      const card = document.createElement('article'); card.className = 'tool-card';
      const title = document.createElement('h3'); title.textContent = post.title;
      const excerpt = document.createElement('p'); excerpt.textContent = post.excerpt;
      const link = document.createElement('a'); link.href = `/journal/${encodeURIComponent(post.slug)}`; link.textContent = 'Read blog →'; link.className = 'tool-link';
      if (post.cover_image_id) card.append(cover(post, 'guide-cover'));
      card.append(title, excerpt, link); fragment.append(card);
    }
    cards.replaceChildren(fragment);
    cards.removeAttribute('aria-busy');
    const pages = Math.max(1, Math.ceil(total / limit));
    if (pagination) pagination.hidden = total <= limit;
    if (pageLabel) pageLabel.textContent = `Page ${page + 1} of ${pages} · ${total} blog${total === 1 ? '' : 's'}`;
    if (previous) previous.disabled = page === 0;
    if (next) next.disabled = page + 1 >= pages;
    if (status) status.textContent = posts.length ? '' : 'No blogs published yet.';
  }

  async function load() {
    if (retry) { retry.hidden = true; retry.disabled = true; }
    if (status) status.textContent = article ? 'Loading article…' : 'Loading blogs…';
    if (cards) {
      cards.setAttribute('aria-busy', 'true');
      cards.innerHTML = '<div class="blog-loading"><span></span><p>Loading blogs…</p></div>';
    }
    if (previous) previous.disabled = true;
    if (next) next.disabled = true;
    try {
      const slug = new URLSearchParams(location.search).get('slug');
      const path = article ? `/api/public/posts/${encodeURIComponent(slug || '')}` : `/api/public/posts?limit=${limit}&offset=${page * limit}`;
      const response = await AnvilAPI.fetch(path);
      if (!response.ok) throw new Error('Unable to load blogs. Please try again.');
      const data = await response.json();
      if (article) {
        document.title = `${data.title} | Anvil Tools`;
        article.replaceChildren();
        const title = document.createElement('h1'); title.textContent = data.title;
        const excerpt = document.createElement('p'); excerpt.className = 'lede'; excerpt.textContent = data.excerpt;
        article.append(title, excerpt);
        if (data.cover_image_id) article.append(cover(data, 'article-cover'));
        for (const paragraph of (data.body || '').split(/\n\s*\n/)) {
          const text = document.createElement('p'); text.style.whiteSpace = 'pre-wrap'; text.textContent = paragraph; article.append(text);
        }
      } else {
        const totalHeader = Number(response.headers?.get('X-Total-Count'));
        const total = Number.isFinite(totalHeader) ? totalHeader : page * limit + data.length;
        if (!data.length && page > 0) { page--; return load(); }
        renderBlogPage(data, total);
      }
    } catch (error) {
      if (cards) { cards.replaceChildren(); cards.removeAttribute('aria-busy'); }
      if (status) status.textContent = ['localhost', '127.0.0.1'].includes(location.hostname)
        ? 'Local API unavailable. Start npm run dev:api and npm run dev:frontend, then try again.'
        : error.message;
      if (article) article.querySelector('h1').textContent = 'Article unavailable';
      if (pagination) pagination.hidden = false;
      if (retry) { retry.hidden = false; retry.disabled = false; }
    }
  }

  if (previous) previous.addEventListener('click', () => { if (page > 0) { page--; return load(); } });
  if (next) next.addEventListener('click', () => { page++; return load(); });
  if (retry) retry.addEventListener('click', load);
  await load();
})();
