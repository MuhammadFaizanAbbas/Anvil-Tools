document.addEventListener('DOMContentLoaded', () => {
  const yearEls = document.querySelectorAll('.current-year');
  yearEls.forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });
  }

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
