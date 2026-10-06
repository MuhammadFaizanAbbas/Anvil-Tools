(() => {
  const key = 'anvil_admin_session';
  const base = (window.ANVIL_CONFIG?.API_BASE_URL || '').replace(/\/$/, '');
  const siteOrigin = (window.ANVIL_CONFIG?.SITE_URL || window.location.origin || '').replace(/\/$/, '');
  function clearSession() { try { sessionStorage.removeItem(key); } catch (_) { /* Public tools work when storage is disabled. */ } }
  function getSession() {
    try {
      const session = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (session?.expiresAt * 1000 > Date.now()) return session;
    } catch (_) { /* A malformed session is treated as logged out. */ }
    clearSession();
    return null;
  }
  window.AnvilAPI = {
    getSession,
    setSession(data) {
      try { sessionStorage.setItem(key, JSON.stringify({ accessToken: data.accessToken, expiresAt: data.expiresAt })); }
      catch (_) { throw new Error('Allow session storage in this browser to sign in to the administrator workspace.'); }
    },
    clearSession,
    async fetch(path, options = {}) {
      if (!path.startsWith('/api/')) throw new Error('Invalid API path');
      const headers = new Headers(options.headers);
      const session = getSession();
      if (session && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${session.accessToken}`);
      if (/^https?:\/\/[^/]+$/i.test(siteOrigin) && !headers.has('X-Frontend-Origin')) {
        headers.set('X-Frontend-Origin', siteOrigin);
      }
      const { timeoutMs = 20000, signal, ...requestOptions } = options;
      const controller = new AbortController();
      const cancel = () => controller.abort(signal.reason);
      if (signal?.aborted) cancel();
      else signal?.addEventListener('abort', cancel, { once: true });
      const timer = setTimeout(() => controller.abort(new Error('The request timed out. Please check your connection and try again.')), timeoutMs);
      try {
        const response = await fetch(`${base}${path}`, { ...requestOptions, headers, credentials: 'omit', signal: controller.signal });
        if (response.status === 401) clearSession();
        // These endpoints return small JSON responses. Keep the deadline active
        // through body transfer, so a stalled response cannot leave a form busy.
        await response.clone().arrayBuffer();
        return response;
      } catch (error) {
        if (controller.signal.aborted) throw controller.signal.reason || error;
        throw error;
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
      }
    }
  };
})();
