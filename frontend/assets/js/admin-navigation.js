(() => {
  const toggle = document.getElementById('adminMenuToggle');
  const sidebar = document.getElementById('adminSidebar');
  const main = document.getElementById('main-content');
  const mobile = window.matchMedia('(max-width: 800px)');
  if (!toggle || !sidebar || !main) return;
  let open = false;
  function update() {
    toggle.hidden = !mobile.matches;
    sidebar.hidden = mobile.matches && !open;
    toggle.setAttribute('aria-expanded', String(mobile.matches && open));
    toggle.querySelector('span').textContent = open ? 'Close menu' : 'Menu';
  }
  toggle.addEventListener('click', () => { open = !open; update(); });
  sidebar.addEventListener('click', event => {
    if (!mobile.matches || !event.target.closest('a.nav-item')) return;
    open = false; update(); main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobile.matches && open) {
      open = false; update(); toggle.focus();
    }
  });
  window.addEventListener('hashchange', () => {
    if (!mobile.matches || !open) return;
    open = false; update(); main.focus({ preventScroll: true });
  });
  mobile.addEventListener('change', () => {
    const active = document.activeElement;
    open = false; update();
    if (mobile.matches && sidebar.contains(active)) toggle.focus();
    else if (!mobile.matches && active === toggle) sidebar.querySelector('.nav-item.active')?.focus();
  });
  update();
})();
