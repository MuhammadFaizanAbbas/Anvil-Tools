(async () => {
  const article = document.getElementById('publishedArticle');
  const cards = document.getElementById('publishedGuideCards');
  const status = document.getElementById(article ? 'articleStatus' : 'guidesStatus');
  const more = document.getElementById('loadMoreGuides');
  if (!article && !cards) return;
  const cover = (post, className) => {
    const image = document.createElement('img');
    image.src = `/journal-images/${encodeURIComponent(post.cover_image_id)}`;
    image.alt = post.cover_alt || '';
    image.className = className;
    image.loading = className === 'guide-cover' ? 'lazy' : 'eager';
    return image;
  };
  let offset = 0;
  const limit = 12;
  const seen = new Set();
  async function load() {
    if (more) more.disabled = true;
    if (status) status.textContent = article ? 'Loading article…' : 'Loading guides…';
    try {
      const slug = new URLSearchParams(location.search).get('slug');
      const path = article ? `/api/public/posts/${encodeURIComponent(slug || '')}` : `/api/public/posts?limit=${limit}&offset=${offset}`;
      const response = await AnvilAPI.fetch(path);
      if (!response.ok) throw new Error('Unable to load guides. Please try again.');
      const data = await response.json();
      if (article) {
        document.title = `${data.title} | Anvil Tools`;
        article.replaceChildren();
        const title = document.createElement('h1');
        title.textContent = data.title;
        const excerpt = document.createElement('p');
        excerpt.className = 'lede';
        excerpt.textContent = data.excerpt;
        article.append(title, excerpt);
        if (data.cover_image_id) article.append(cover(data, 'article-cover'));
        for (const paragraph of (data.body || '').split(/\n\s*\n/)) {
          const p = document.createElement('p');
          p.style.whiteSpace = 'pre-wrap';
          p.textContent = paragraph;
          article.append(p);
        }
      } else {
        const fragment = document.createDocumentFragment();
        for (const post of data) {
          if (seen.has(post.slug)) continue;
          seen.add(post.slug);
          const card = document.createElement('article');
          card.className = 'tool-card';
          const h = document.createElement('h3');
          h.textContent = post.title;
          const p = document.createElement('p');
          p.textContent = post.excerpt;
          const a = document.createElement('a');
          a.href = `/journal/${encodeURIComponent(post.slug)}`;
          a.textContent = 'Read guide →';
          a.className = 'tool-link';
          if (post.cover_image_id) card.append(cover(post, 'guide-cover'));
          card.append(h, p, a);
          fragment.append(card);
        }
        cards.insertBefore(fragment, cards.querySelector('[data-static-guide]'));
        offset += data.length;
        if (more) more.hidden = data.length < limit;
        if (status) status.textContent = cards.children.length ? '' : 'No guides published yet.';
      }
    } catch (error) {
      if (status) status.textContent = error.message;
      if (more) { more.hidden = false; more.textContent = 'Try again'; }
      if (article) article.querySelector('h1').textContent = 'Article unavailable';
    } finally {
      if (more) more.disabled = false;
    }
  }
  if (more) more.addEventListener('click', () => { more.textContent = 'Load more guides'; return load(); });
  await load();
})();
