// Lightweight ad-slot gate: load ad HTML only after consent and when ad-mode allows it.
document.addEventListener('DOMContentLoaded', () => {
  const renderAd = (slot) => {
    // Placeholder behavior: in production, replace this with publisher-provided ad code
    if (slot.dataset.adsRendered) return;
    slot.dataset.adsRendered = '1';
    const label = document.createElement('div');
    label.className = 'ad-placeholder';
    label.textContent = 'Ad placeholder — ads disabled until account setup';
    slot.innerHTML = '';
    slot.appendChild(label);
  };

  const checkAndRender = (consent) => {
    document.querySelectorAll('.ad-slot').forEach((slot) => {
      const allowed = slot.getAttribute('data-ads-allowed') !== 'false';
      const personalized = consent && consent.personalized;
      // If the slot has explicit disable, skip
      if (!allowed) return;
      // Only render if user consented to analytics/personalized or global non-personalized allowed
      if (personalized || slot.getAttribute('data-nonpersonal') === 'true') {
        renderAd(slot);
      }
    });
  };

  // Listen for consent event
  window.addEventListener('anvil:consent', (e) => {
    checkAndRender(e.detail || {});
  });

  // If consent already stored, read it and render
  try {
    const raw = localStorage.getItem('anvil_consent_v1');
    if (raw) {
      const obj = JSON.parse(raw);
      checkAndRender(obj);
    }
  } catch (e) {}
});
