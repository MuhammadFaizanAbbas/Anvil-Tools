/* Public recommendations use article metadata only, never tool inputs. */
(async () => {
  const currentSlug = new URLSearchParams(location.search).get('slug') || location.pathname.split('/').filter(Boolean).pop().replace(/\.html$/, '');
  const main = document.querySelector('main');
  if (!main) return;
  let section = document.getElementById('suggested-guides');
  const keywords = value => new Set(String(value || '').toLowerCase().match(/[a-z]{4,}/g) || []);
  const currentWords = keywords(document.querySelector('h1')?.textContent);
  function render(posts) {
    const unique = new Map();
    for (const post of posts) {
      if (!post.slug || post.slug === currentSlug || unique.has(post.slug)) continue;
      const words = keywords(`${post.title} ${post.excerpt || ''} ${(post.tags || []).join(' ')}`);
      unique.set(post.slug, { ...post, score: [...words].filter(word => currentWords.has(word)).length });
    }
    const suggestions = [...unique.values()].sort((a,b) => b.score-a.score).slice(0,6);
    if (!suggestions.length) return;
    if (!section) { section = document.createElement('section'); section.id = 'suggested-guides'; section.className = 'info-section'; main.append(section); }
    const heading = document.createElement('h2'); heading.textContent = 'More guides to explore';
    const grid = document.createElement('div'); grid.className = 'tool-grid';
    suggestions.forEach(post => {
      const card = document.createElement('article'); card.className = 'tool-card';
      const title = document.createElement('h3'); title.textContent = post.title;
      const description = document.createElement('p'); description.textContent = post.excerpt || 'Explore the practical steps, common pitfalls, and tools for this workflow.';
      const link = document.createElement('a'); link.className = 'tool-link'; link.textContent = 'Read the guide →';
      link.href = post.staticGuide ? `/blog/posts/${encodeURIComponent(post.slug)}.html` : `/journal/${encodeURIComponent(post.slug)}`;
      card.append(title,description,link); grid.append(card);
    });
    section.replaceChildren(heading,grid);
  }
  const fallback = (window.AnvilGuideCatalog || []).map(post => ({...post,staticGuide:true}));
  render(fallback);
  try {
    const base = (window.ANVIL_CONFIG?.API_BASE_URL || '').replace(/\/$/,'');
    const response = await fetch(`${base}/api/public/posts?limit=100&offset=0`, {credentials:'omit'});
    if (!response.ok) return;
    const posts = await response.json();
    if (Array.isArray(posts)) render([...posts, ...fallback]);
  } catch (_) { /* Static suggestions remain useful when the API is unavailable. */ }
})();
