// Public configuration only. SITE_URL follows whichever frontend is currently
// open, so the same files can be deployed to cPanel, Vercel, or another domain.
window.ANVIL_CONFIG = {
  SITE_URL: window.location.origin,
  API_BASE_URL: ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3000'
    : 'https://anvil-tools-backend.vercel.app'
};
