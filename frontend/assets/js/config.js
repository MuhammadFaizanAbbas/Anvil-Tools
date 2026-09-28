// Public configuration only. Set this to your Vercel URL before uploading to cPanel.
window.ANVIL_CONFIG = {
  API_BASE_URL: ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3000'
    : 'https://YOUR-PROJECT.vercel.app'
};
