document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('consent-banner');
  const acceptBtn = document.getElementById('consent-accept');
  const rejectBtn = document.getElementById('consent-reject');
  const customizeBtn = document.getElementById('consent-customize');
  const customPanel = document.getElementById('consent-custom-panel');
  const saveBtn = document.getElementById('consent-save');
  const analyticsCheck = document.getElementById('consent-analytics');
  const personalizedCheck = document.getElementById('consent-personalized');

  if (!banner || !acceptBtn || !rejectBtn || !customizeBtn || !saveBtn) return;

  const CONSENT_KEY = 'anvil_consent_v1';

  const readConsent = () => {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const saveConsent = (obj) => {
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(obj)); } catch (_) { /* Choices still apply when storage is unavailable. */ }
    banner.setAttribute('aria-hidden', 'true');
    banner.style.display = 'none';
    // Dispatch a custom event so other scripts can react
    window.dispatchEvent(new CustomEvent('anvil:consent', { detail: obj }));
  };

  const showBanner = () => {
    banner.setAttribute('aria-hidden', 'false');
    banner.style.display = 'block';
  };

  // Initialize UI from stored consent
  const existing = readConsent();
  if (existing) {
    banner.style.display = 'none';
    window.dispatchEvent(new CustomEvent('anvil:consent', { detail: existing }));
    return;
  }

  // Show banner
  showBanner();

  acceptBtn.addEventListener('click', () => {
    saveConsent({ analytics: true, personalized: true, timestamp: new Date().toISOString() });
  });

  rejectBtn.addEventListener('click', () => {
    saveConsent({ analytics: false, personalized: false, timestamp: new Date().toISOString() });
  });

  customizeBtn.addEventListener('click', () => {
    customPanel.hidden = !customPanel.hidden;
    customizeBtn.setAttribute('aria-expanded', String(!customPanel.hidden));
    if (!customPanel.hidden) customPanel.querySelector('input')?.focus();
  });

  saveBtn.addEventListener('click', () => {
    const obj = {
      analytics: !!analyticsCheck.checked,
      personalized: !!personalizedCheck.checked,
      timestamp: new Date().toISOString(),
    };
    saveConsent(obj);
  });

});
