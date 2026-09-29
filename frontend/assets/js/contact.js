(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactStatus');
  let id = crypto.randomUUID();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    if (button.disabled) return;
    const buttonLabel = button.textContent;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Sending…';
    status.className = '';
    status.textContent = 'Saving your message…';
    const fields = Object.fromEntries(new FormData(form));
    try {
      const response = await AnvilAPI.fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fields, id }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(response.status >= 500 ? 'The contact service is temporarily unavailable. Please email info@velloxtech.com.' : (data.error || 'Unable to submit your message. Please try again.'));
      status.className = 'success';
      status.textContent = `${data.message} Your reference: ${data.reference}`;
      form.reset(); id = crypto.randomUUID();
    } catch (error) {
      status.className = 'error';
      status.textContent = error.message === 'Failed to fetch' ? 'Connection interrupted. You can retry safely, or email info@velloxtech.com.' : error.message;
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.textContent = buttonLabel;
      status.focus();
    }
  });
})();
