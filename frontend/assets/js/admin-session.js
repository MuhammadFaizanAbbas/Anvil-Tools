(() => {
  const timer = document.getElementById('sessionTimer');
  const warning = document.getElementById('sessionWarning');
  let expired = false;
  function update() {
    const session = AnvilAPI.getSession();
    const seconds = session ? Math.max(0, Math.ceil(session.expiresAt - Date.now() / 1000)) : 0;
    timer.textContent = `Session ${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    timer.classList.toggle('expiring', seconds <= 300);
    warning.hidden = seconds > 300;
    if (!seconds) {
      if (expired) return;
      expired = true;
      AnvilAPI.clearSession();
      warning.textContent = 'Your session has expired. Copy any unsaved work before signing in again.';
      const link = document.createElement('a');
      link.href = '/admin-panel/login.html';
      link.textContent = 'Sign in again';
      warning.append(' ', link);
      // Preserve visible unsaved text, but prevent further mutations from this page.
      document.querySelectorAll('main input, main textarea, main select, main button').forEach(el => { el.disabled = true; });
      return;
    }
    if (seconds <= 300) warning.textContent = 'Your session expires soon. Save your work before signing in again.';
  }
  update();
  setInterval(update, 1000);
  document.addEventListener('visibilitychange', update);
})();
