(() => {
  const key = 'anvil_admin_session';
  const base = (window.ANVIL_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
  function clearSession() { sessionStorage.removeItem(key); }
  function getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (session?.expiresAt * 1000 > Date.now()) return session;
    } catch (_) { /* A malformed session is treated as logged out. */ }
    clearSession();
    return null;
  }
  window.AnvilAPI = {
    setSession(data) { sessionStorage.setItem(key, JSON.stringify({ accessToken: data.accessToken, expiresAt: data.expiresAt })); },
    clearSession,
    async fetch(path, options = {}) {
      if (!path.startsWith('/api/')) throw new Error('Invalid API path');
      const headers = new Headers(options.headers);
      const session = getSession();
      if (session) headers.set('Authorization', `Bearer ${session.accessToken}`);
      const response = await fetch(`${base}${path}`, { ...options, headers, credentials: 'omit' });
      if (response.status === 401) clearSession();
      return response;
    }
  };
})();
