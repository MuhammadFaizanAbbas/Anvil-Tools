document.addEventListener('DOMContentLoaded', () => {
  const addressEl = document.getElementById('tm-address');
  const statusEl = document.getElementById('tm-status');
  const messagesEl = document.getElementById('tm-messages');
  const viewerEl = document.getElementById('tm-viewer');
  const countEl = document.getElementById('tm-count');
  const expiryEl = document.getElementById('tm-expiry');
  const copyBtn = document.getElementById('tm-copy');
  const newBtn = document.getElementById('tm-new');
  const refreshBtn = document.getElementById('tm-refresh');
  if (!addressEl || !statusEl || !messagesEl || !viewerEl || !copyBtn || !newBtn) return;

  const storage = (operation, value) => { try { return sessionStorage[operation]('tm_cap', value); } catch (_) { return null; } };
  let capability = storage('getItem');
  let generation = 0, selection = 0, pollTimer, creating = false, polling = false, copying = false;
  let messageSnapshot = '';
  let expiresAt = 0, expiryTimer;
  const updateExpiry = value => {
    if (!expiryEl) return;
    clearTimeout(expiryTimer);
    if (Number.isFinite(Number(value)) && Number(value) > 0) expiresAt = Number(value);
    if (!expiresAt || !capability) {
      expiryEl.textContent = 'No active website inbox access.';
      return;
    }
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      expiryEl.textContent = seconds
        ? `Website inbox access: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} remaining. Provider message retention is separate.`
        : 'Website access time reached. Use Refresh to confirm whether this inbox has expired.';
      if (seconds && capability) expiryTimer = setTimeout(tick, 1000);
    };
    tick();
  };
  const setStatus = (text, error = false) => {
    statusEl.textContent = text;
    statusEl.style.color = error ? '#b42318' : '#5d6b85';
  };
  const decode = text => {
    const element = document.createElement('textarea');
    element.innerHTML = String(text || '').replace(/</g, '&lt;');
    return element.value;
  };
  const buttons = () => {
    newBtn.disabled = creating;
    copyBtn.disabled = creating || copying || !capability || !addressEl.textContent.includes('@');
    if (refreshBtn) refreshBtn.disabled = creating || polling || !capability;
  };
  const showReaderEmpty = () => {
    const empty = document.createElement('div'); empty.className = 'temp-mail-empty';
    const title = document.createElement('strong'); title.textContent = 'Select a message';
    const note = document.createElement('span'); note.textContent = 'New mail will appear in the inbox automatically.';
    empty.append(title, note); viewerEl.replaceChildren(empty);
  };
  const expire = () => {
    generation++; selection++; capability = null;
    storage('removeItem'); clearTimeout(pollTimer);
    expiresAt = 0; updateExpiry();
    addressEl.textContent = 'No active inbox';
    messagesEl.replaceChildren(); showReaderEmpty(); messageSnapshot = '';
    if (countEl) countEl.textContent = '0 messages';
    setStatus('This inbox has expired. Click New address to create another.', true);
    buttons();
  };
  async function request(path, options) {
    const response = await AnvilAPI.fetch(path, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const retry = Number(response.headers.get('Retry-After'));
      const suffix = retry > 0 ? ` Try again in ${retry} seconds.` : '';
      throw Object.assign(new Error((data.error || 'Unable to reach the inbox. Please try again.') + suffix), { status: response.status, code: data.code, retry });
    }
    return data;
  }
  async function openMessage(message) {
    if (!capability || creating) return;
    const current = generation, selected = ++selection, cap = capability;
    setStatus('Loading message…');
    try {
      const detail = await request(`/api/temp-mail/messages/${encodeURIComponent(message.id)}?cap=${encodeURIComponent(cap)}`);
      if (current !== generation || selected !== selection) return;
      const title = document.createElement('h3'); title.textContent = decode(detail.subject) || 'Message';
      const sender = document.createElement('p'); sender.textContent = `From: ${decode(detail.from?.address || detail.from || 'Unknown')}`;
      const body = document.createElement('pre'); body.textContent = (detail.textEncoded ? decode(detail.text) : detail.text) || 'No content';
      viewerEl.replaceChildren(title, sender, body);
      messagesEl.querySelectorAll('.tm-message').forEach(button => button.classList.toggle('is-active', button.dataset.messageId === String(message.id)));
      setStatus('Message loaded. Inbox checks continue automatically.');
    } catch (error) {
      if (current !== generation || selected !== selection) return;
      if (error.status === 410) return expire();
      setStatus(error.message, true);
    }
  }
  function renderMessages(messages) {
    const snapshot = JSON.stringify(messages);
    if (snapshot === messageSnapshot) return;
    messageSnapshot = snapshot;
    messagesEl.replaceChildren();
    if (countEl) countEl.textContent = `${messages.length} ${messages.length === 1 ? 'message' : 'messages'}`;
    if (!messages.length) {
      const li = document.createElement('li'); li.textContent = 'No messages yet. New messages appear automatically.'; messagesEl.append(li);
    }
    for (const message of messages) {
      const li = document.createElement('li');
      const button = document.createElement('button'); button.type = 'button'; button.className = 'tm-message';
      button.dataset.messageId = String(message.id);
      button.textContent = `${decode(message.subject) || 'No subject'} — ${decode(message.from) || 'Unknown sender'}`;
      button.addEventListener('click', () => openMessage(message));
      li.append(button); messagesEl.append(li);
    }
  }
  async function pollInbox() {
    if (!capability || creating || polling) return;
    const current = generation, cap = capability;
    polling = true; clearTimeout(pollTimer); buttons();
    try {
      const data = await request(`/api/temp-mail/messages?cap=${encodeURIComponent(cap)}`);
      if (current !== generation) return;
      if (data.address) addressEl.textContent = data.address;
      updateExpiry(data.expiresAt);
      renderMessages(data.messages || []);
      setStatus(`${data.messages?.length || 0} messages. Checking for new mail every 15 seconds.`);
    } catch (error) {
      if (current !== generation) return;
      if (error.status === 404 || error.status === 410) return expire();
      setStatus(error.message, true);
    } finally {
      polling = false; buttons();
      if (capability && !creating) { clearTimeout(pollTimer); pollTimer = setTimeout(pollInbox, current === generation ? 15000 : 0); }
    }
  }
  async function createInbox() {
    if (creating) return;
    creating = true; generation++; selection++; clearTimeout(pollTimer); buttons();
    const previous = capability;
    try {
      setStatus('Creating your inbox…');
      const data = await request('/api/temp-mail/create', { method: 'POST' });
      if (!data.capability || !data.address) throw new Error('The server did not return an inbox. Please try again.');
      capability = data.capability; storage('setItem', capability);
      expiresAt = 0; updateExpiry(data.expiresAt);
      addressEl.textContent = data.address;
      showReaderEmpty(); messagesEl.replaceChildren(); messageSnapshot = '';
      if (countEl) countEl.textContent = '0 messages';
      if (previous && previous !== capability) AnvilAPI.fetch('/api/temp-mail/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cap: previous })
      }).catch(() => {});
      setStatus('Inbox ready. Checking for messages…');
    } catch (error) {
      if (!capability) addressEl.textContent = 'No active inbox';
      setStatus(error.message, true);
    } finally {
      creating = false; buttons();
      if (capability) { clearTimeout(pollTimer); pollTimer = setTimeout(pollInbox, capability === previous ? 15000 : 0); }
    }
  }
  copyBtn.addEventListener('click', async () => {
    if (copyBtn.disabled) return;
    copying = true; buttons();
    try { await navigator.clipboard.writeText(addressEl.textContent); setStatus('Address copied to clipboard.'); }
    catch (_) { setStatus('Copy failed. Select and copy the address above.', true); }
    finally { copying = false; buttons(); }
  });
  newBtn.addEventListener('click', createInbox);
  if (refreshBtn) refreshBtn.addEventListener('click', pollInbox);
  buttons();
  if (capability) { setStatus('Restoring your inbox…'); pollInbox(); }
  else createInbox();
});
