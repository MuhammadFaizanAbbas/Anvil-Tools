document.addEventListener('DOMContentLoaded', () => {
  const banner = document.getElementById('consent-banner');
  const acceptBtn = document.getElementById('consent-accept');
  const rejectBtn = document.getElementById('consent-reject');
  const customizeBtn = document.getElementById('consent-customize');
  const customPanel = document.getElementById('consent-custom-panel');
  const saveBtn = document.getElementById('consent-save');
  const analyticsCheck = document.getElementById('consent-analytics');
  const personalizedCheck = document.getElementById('consent-personalized');

  if (!banner || !acceptBtn) return;

  const settingsBtn = document.getElementById('privacy-settings');
  const closeBtn = document.getElementById('consent-close');
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
    settingsBtn?.setAttribute('aria-expanded', 'false');
    banner.hidden = true;
    banner.setAttribute('aria-hidden', 'true');
    banner.style.display = 'none';
    // Dispatch a custom event so other scripts can react
    window.dispatchEvent(new CustomEvent('anvil:consent', { detail: obj }));
  };

  const showBanner = () => {
    settingsBtn?.setAttribute('aria-expanded', 'true');
    banner.hidden = false;
    banner.setAttribute('aria-hidden', 'false');
    banner.style.removeProperty('display');
  };

  // Initialize UI from stored consent
  const existing = readConsent();
  if (existing) {
    settingsBtn?.setAttribute('aria-expanded', 'false');
    banner.hidden = true;
    banner.setAttribute('aria-hidden', 'true');
    banner.style.display = 'none';
    window.dispatchEvent(new CustomEvent('anvil:consent', { detail: existing }));
  }

  // Show banner
  if (!existing) showBanner();
  document.getElementById('privacy-settings')?.addEventListener('click', () => {
    const current = readConsent();
    if (analyticsCheck) analyticsCheck.checked = !!current?.analytics;
    if (personalizedCheck) personalizedCheck.checked = !!current?.personalized;
    showBanner();
    (rejectBtn || acceptBtn).focus();
  });

  closeBtn?.addEventListener('click', () => {
    banner.hidden = true;
    banner.setAttribute('aria-hidden', 'true');
    settingsBtn?.setAttribute('aria-expanded', 'false');
    settingsBtn?.focus();
  });

  acceptBtn.addEventListener('click', () => {
    // A simple acknowledgement does not opt users into optional tracking.
    const hasChoices = !!rejectBtn;
    saveConsent({ analytics: hasChoices, personalized: hasChoices, timestamp: new Date().toISOString() });
  });

  rejectBtn?.addEventListener('click', () => {
    saveConsent({ analytics: false, personalized: false, timestamp: new Date().toISOString() });
  });

  customizeBtn?.addEventListener('click', () => {
    if (!customPanel) return;
    customPanel.hidden = !customPanel.hidden;
    customizeBtn.setAttribute('aria-expanded', String(!customPanel.hidden));
    if (!customPanel.hidden) customPanel.querySelector('input')?.focus();
  });

  saveBtn?.addEventListener('click', () => {
    const obj = {
      analytics: !!analyticsCheck?.checked,
      personalized: !!personalizedCheck?.checked,
      timestamp: new Date().toISOString(),
    };
    saveConsent(obj);
  });

});
