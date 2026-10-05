document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('suggested-guides') || /\/journal\//.test(location.pathname) || /\/blog\/article\.html$/.test(location.pathname)) {
    const loadScript = src => new Promise((resolve, reject) => {
      const script = document.createElement('script'); script.src = src;
      script.onload = resolve; script.onerror = reject; document.head.append(script);
    });
    Promise.all([
      window.ANVIL_CONFIG ? Promise.resolve() : loadScript('/assets/js/config.js')
    ]).then(() => loadScript('/assets/js/recommendations.js?v=20261005-review')).catch(() => {});
  }
  const yearEls = document.querySelectorAll('.current-year');
  const currentYear = String(new Date().getFullYear());
  yearEls.forEach((el) => {
    if (el.textContent !== currentYear) el.textContent = currentYear;
  });

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    if (nav.id !== 'main-navigation') nav.id = 'main-navigation';
    if (toggle.getAttribute('aria-controls') !== nav.id) toggle.setAttribute('aria-controls', nav.id);
    const closeMenu = () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    };
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });
    nav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target) && !toggle.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('open')) { closeMenu(); toggle.focus(); }
    });
    window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
  }

  // Catalog search progressively enhances full tool lists, not related-tool cards.
  document.querySelectorAll('.tool-grid').forEach((grid, index) => {
    // The directory owns category/search intersection and its result counter.
    if (grid.querySelector('[data-directory-tool]')) return;
    const cards = [...grid.children].filter(card => card.querySelector('.tool-link'));
    if (cards.length < 6) return;
    let search = document.querySelector(`[data-catalog-search="${index}"]`);
    if (!search) {
      search = document.createElement('div');
      search.className = 'catalog-search';
      search.dataset.catalogSearch = String(index);
      search.innerHTML = `<label for="tool-search-${index}">Find a tool</label><input id="tool-search-${index}" type="search" placeholder="Search by name or category…"><span class="catalog-count" role="status"></span>`;
      grid.before(search);
    }
    let empty = document.getElementById(`tool-search-empty-${index}`);
    if (!empty) {
      empty = document.createElement('p');
      empty.id = `tool-search-empty-${index}`;
      empty.className = 'catalog-empty';
      empty.textContent = 'No matching tools. Try a different name or category.';
      empty.hidden = true;
      grid.after(empty);
    }
    const input = search.querySelector('input');
    const update = () => {
      const query = input.value.trim().toLowerCase();
      cards.forEach(card => {
        const hidden = !card.textContent.toLowerCase().includes(query);
        if (card.hidden !== hidden) card.hidden = hidden;
      });
      const count = cards.filter(card => !card.hidden).length;
      const counter = search.querySelector('.catalog-count');
      const text = `${count} of ${cards.length} tools`;
      if (counter.textContent !== text) counter.textContent = text;
      if (empty.hidden !== (count > 0)) empty.hidden = count > 0;
    };
    input.addEventListener('input', update);
    update();
  });

  document.querySelectorAll('textarea:not([aria-label])').forEach(input => {
    if (!input.labels?.length) input.setAttribute('aria-label', input.placeholder || 'Text input');
  });

  const banner = document.getElementById('consent-banner');
  // Consent is handled by assets/js/cmp.js. Listen for consent events.
  if (banner) {
    const onConsent = (e) => {
      const detail = e.detail || {};
      // Example: if personalized ads are rejected, ensure ad-slot placeholder remains inert.
      if (!detail.personalized) {
        document.querySelectorAll('.ad-slot').forEach((el) => {
          el.classList.add('ads-disabled');
          el.setAttribute('data-ads-allowed', 'false');
        });
      }
      banner.style.display = 'none';
    };
    window.addEventListener('anvil:consent', onConsent);
  }
});
