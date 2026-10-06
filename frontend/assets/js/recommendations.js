/* Recommendation selection belongs to the backend; only published database posts are returned. */
(async () => {
  const main = document.querySelector('main');
  if (!main) return;
  let section = document.getElementById('suggested-guides');
  const slug = new URLSearchParams(location.search).get('slug') || (location.pathname.startsWith('/journal/') ? decodeURIComponent(location.pathname.split('/').filter(Boolean).pop()) : '');
  if (!section) { section = document.createElement('section'); section.id = 'suggested-guides'; section.className = 'info-section'; main.append(section); }
  section.hidden = true;
  try {
    const base = (window.ANVIL_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
    const siteBase = (window.ANVIL_CONFIG?.SITE_URL || location.origin || '').replace(/\/$/, '');
    const response = await fetch(`${base}/api/public/recommendations?limit=6${slug ? '&slug=' + encodeURIComponent(slug) : ''}`, { credentials:'omit', signal: AbortSignal.timeout(20000) });
    if (!response.ok) return;
    const posts = await response.json();
    if (!Array.isArray(posts) || !posts.length) return;
    const heading = document.createElement('h2'); heading.textContent = slug ? 'More from the blog' : 'Latest from the blog';
    const grid = document.createElement('div'); grid.className = 'tool-grid';
    for (const post of posts) {
      const card = document.createElement('article'); card.className = 'tool-card';
      const title = document.createElement('h3'); title.textContent = post.title;
      const excerpt = document.createElement('p'); excerpt.textContent = post.excerpt || '';
      const link = document.createElement('a'); link.className = 'tool-link'; link.textContent = 'Read article \u2192'; link.href = `/journal/${encodeURIComponent(post.slug)}`;
      if (post.cover_image_id) {
        const image = document.createElement('img'); image.src = `${siteBase}/journal-images/${encodeURIComponent(post.cover_image_id)}`;
        image.alt = post.cover_alt || ''; image.className = 'guide-cover'; image.loading = 'lazy'; card.append(image);
      }
      card.append(title,excerpt,link); grid.append(card);
    }
    section.replaceChildren(heading,grid); section.hidden = false;
  } catch (_) { /* Keep the optional section hidden rather than show stale or invented articles. */ }
})();
