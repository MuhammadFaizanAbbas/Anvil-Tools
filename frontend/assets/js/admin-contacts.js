(() => {
  const list = document.getElementById('contactList');
  const thread = document.getElementById('contactThread');
  const notice = document.getElementById('inboxStatus');
  const prev = document.getElementById('contactsPrev');
  const next = document.getElementById('contactsNext');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  let offset = 0, total = 0, selected = null, loading = false;
  async function api(path, options) {
    const response = await AnvilAPI.fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  function fail(error) { notice.textContent = error.message; notice.className = 'dashboard-message error'; }
  async function load() {
    if (loading) return;
    loading = true; notice.className = ''; notice.textContent = 'Loading inbox…';
    try {
      const data = await api(`/api/admin/contacts?offset=${offset}`);
      total = data.total;
      list.innerHTML = data.items.length ? data.items.map(item => `<button class="inbox-item ${selected === item.id ? 'selected' : ''}" data-contact="${escape(item.id)}"><span>${escape(item.name)} <small>${escape(new Date(item.created_at).toLocaleDateString())}</small></span><strong>${escape(item.subject)}</strong><small>${escape(item.email)}</small></button>`).join('') : '<p class="empty-state">No contact requests yet.</p>';
      list.querySelectorAll('[data-contact]').forEach(button => button.addEventListener('click', () => open(button.dataset.contact).catch(fail)));
      document.getElementById('contactsPage').textContent = total ? `${offset + 1}–${Math.min(offset + 25, total)} of ${total}` : '0 messages';
      notice.textContent = '';
    } catch (error) { fail(error); }
    finally { loading = false; prev.disabled = offset === 0; next.disabled = offset + 25 >= total; }
  }
  async function open(id) {
    selected = id;
    thread.setAttribute('aria-busy', 'true');
    try {
      const { contact, jobs } = await api(`/api/admin/contacts/${id}`);
      if (selected !== id) return;
      list.querySelectorAll('[data-contact]').forEach(button => button.classList.toggle('selected', button.dataset.contact === id));
      thread.innerHTML = `<div class="thread-heading"><p class="eyebrow">CONTACT REQUEST</p><h2>${escape(contact.subject)}</h2><p>${escape(contact.name)} &lt;${escape(contact.email)}&gt;</p><small>${escape(new Date(contact.created_at).toLocaleString())} · ${escape(contact.id)}</small></div><div class="contact-message">${escape(contact.message)}</div><h3 class="delivery-title">Email activity</h3><p class="muted small">Sent means accepted by SMTP, not confirmed in the recipient's inbox. Unconfirmed jobs need a provider-log check before resending.</p><div class="delivery-log">${jobs.map(job => `<article class="delivery-item"><div><strong>${escape(job.kind)}</strong><span class="delivery-state ${escape(job.status)}">${escape(job.status)}</span></div><small>To ${escape(job.recipient)} · ${job.attempts} attempt(s) · ${escape(new Date(job.created_at).toLocaleString())}</small>${job.last_error ? `<p class="small">${escape(job.last_error)}</p>` : ''}${job.kind === 'reply' ? `<p class="reply-copy">${escape(job.body)}</p>` : ''}${['queued','failed'].includes(job.status) ? `<button class="btn secondary small" data-retry="${escape(job.id)}">${job.status === 'queued' ? 'Send queued email' : 'Retry email'}</button>` : ''}</article>`).join('')}</div><form id="replyForm"><label for="replyMessage">Reply to ${escape(contact.name)}</label><textarea id="replyMessage" maxlength="5000" rows="6" required placeholder="Write your reply…"></textarea><button class="btn primary" type="submit">Send reply</button><p id="replyStatus" role="status"></p></form>`;
      thread.querySelectorAll('[data-retry]').forEach(button => button.addEventListener('click', async () => {
        button.disabled = true;
        try { await api(`/api/admin/contact-jobs/${button.dataset.retry}/retry`, { method: 'POST' }); if (selected === id) await open(id); }
        catch (error) { fail(error); button.disabled = false; }
      }));
      const replyForm = document.getElementById('replyForm');
      const replyId = crypto.randomUUID();
      replyForm.addEventListener('submit', async event => {
        event.preventDefault(); const button = replyForm.querySelector('button');
        if (button.disabled) return;
        const status = document.getElementById('replyStatus');
        button.disabled = true; status.textContent = 'Recording and sending your reply…';
        try {
          await api(`/api/admin/contacts/${id}/replies`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id: replyId, message: document.getElementById('replyMessage').value }) });
          if (selected === id) { await open(id); notice.textContent = 'Reply recorded. Check the email activity for its delivery status.'; notice.className = 'dashboard-message'; }
        } catch (error) { status.textContent = error.message; button.disabled = false; }
      });
    } finally { thread.setAttribute('aria-busy', 'false'); }
  }
  document.getElementById('contactsRefresh').addEventListener('click', () => { load(); if (selected) open(selected).catch(fail); });
  prev.addEventListener('click', () => { offset = Math.max(0, offset - 25); load(); });
  next.addEventListener('click', () => { offset += 25; load(); });
  window.addEventListener('hashchange', () => { if (location.hash === '#contacts') load(); });
  if (location.hash === '#contacts') load();
})();
