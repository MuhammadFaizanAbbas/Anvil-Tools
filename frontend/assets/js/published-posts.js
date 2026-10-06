(async () => {
  const article = document.getElementById('publishedArticle');
  const cards = document.getElementById('publishedGuideCards');
  const status = document.getElementById(article ? 'articleStatus' : 'blogsStatus');
  const pagination = document.getElementById('blogPagination');
  let previous = document.getElementById('blogsPrev');
  let next = document.getElementById('blogsNext');
  let pageLabel = document.getElementById('blogsPage');
  let retry = document.getElementById('blogsRetry');
  const retrySlot = document.getElementById('blogRetrySlot');
  if (!article && !cards) return;
  const siteBase = (window.ANVIL_CONFIG?.SITE_URL || location.origin || '').replace(/\/$/, '');

  const cover = (post, className) => {
    const image = document.createElement('img');
    image.src = `${siteBase}/journal-images/${encodeURIComponent(post.cover_image_id)}`;
    image.alt = post.cover_alt || '';
    image.className = className;
    image.loading = className === 'guide-cover' ? 'lazy' : 'eager';
    return image;
  };

  const limit = 30;
  const initialPage = Number(new URLSearchParams(location.search).get('page') || 1);
  let page = Number.isInteger(initialPage) && initialPage > 0 && initialPage <= 33334 ? initialPage - 1 : 0;
  const serverRendered = cards?.getAttribute?.('data-server-rendered') === 'true';

  function clearRetry() {
    if (retry) retry.remove();
    retry = null;
  }

  function showRetry() {
    if (!retry && retrySlot) {
      retry = document.createElement('button');
      retry.id = 'blogsRetry'; retry.className = 'btn'; retry.type = 'button';
      retry.textContent = 'Try again';
      retrySlot.append(retry);
      retry.addEventListener('click', () => load());
    }
    if (retry) { retry.hidden = false; retry.disabled = false; }
  }

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
    const fallback = document.querySelector?.('.editorial-library');
    if (fallback) fallback.hidden = posts.length > 0;
    cards.removeAttribute('aria-busy');
    const pages = Math.max(1, Math.ceil(total / limit));
    if (pagination && total > limit && !pageLabel) {
      previous = document.createElement('a'); previous.id = 'blogsPrev'; previous.className = 'btn'; previous.textContent = 'Previous'; previous.rel = 'prev';
      pageLabel = document.createElement('span'); pageLabel.id = 'blogsPage';
      next = document.createElement('a'); next.id = 'blogsNext'; next.className = 'btn'; next.textContent = 'Next'; next.rel = 'next';
      pagination.append(previous, pageLabel, next);
    }
    if (pagination) pagination.hidden = total <= limit;
    if (pageLabel) pageLabel.textContent = `Page ${page + 1} of ${pages} · ${total} blog${total === 1 ? '' : 's'}`;
    if (previous) { previous.disabled = page === 0; previous.hidden = page === 0; if (page > 0) previous.href = `/blog/index.html${page > 1 ? `?page=${page}` : ''}`; else previous.removeAttribute('href'); }
    if (next) { next.disabled = page + 1 >= pages; next.hidden = page + 1 >= pages; if (page + 1 < pages) next.href = `/blog/index.html?page=${page + 2}`; else next.removeAttribute('href'); }
    if (status) status.textContent = posts.length ? '' : 'No articles published yet.';
  }

  async function load(allowPageRecovery = true) {
    clearRetry();
    if (status) status.textContent = article ? 'Loading article…' : 'Updating articles…';
    if (cards) {
      cards.setAttribute('aria-busy', 'true');
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
        const totalValue = response.headers?.get('X-Total-Count');
        const totalHeader = Number(totalValue);
        const hasTotal = totalValue != null && /^\d+$/.test(totalValue) && Number.isSafeInteger(totalHeader);
        const total = hasTotal ? totalHeader : page * limit + data.length;
        if (!data.length && page > 0 && allowPageRecovery) {
          page = hasTotal ? Math.max(0, Math.min(page - 1, Math.ceil(total / limit) - 1)) : 0;
          return await load(false);
        }
        renderBlogPage(data, total);
        window.history?.replaceState(null, '', `/blog/index.html${page ? `?page=${page + 1}` : ''}`);
      }
    } catch (error) {
      if (cards) cards.removeAttribute('aria-busy');
      if (status) status.textContent = ['localhost', '127.0.0.1'].includes(location.hostname)
        ? 'Local API unavailable. Start npm run dev:api and npm run dev:frontend, then try again.'
        : error.message;
      if (article) article.querySelector('h1').textContent = 'Article unavailable';
      if (pagination) pagination.hidden = true;
      showRetry();
    }
  }

  // Numbered pages use normal links so history, canonical metadata, and crawlers
  // all receive the server-rendered document for that page.
  if (retry) retry.addEventListener('click', () => load());
  if (!serverRendered || article) await load();
})();
