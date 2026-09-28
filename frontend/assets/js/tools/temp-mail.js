document.addEventListener('DOMContentLoaded', () => {
  const addressEl = document.getElementById('tm-address');
  const statusEl = document.getElementById('tm-status');
  const messagesEl = document.getElementById('tm-messages');
  const viewerEl = document.getElementById('tm-viewer');
  const copyBtn = document.getElementById('tm-copy');
  const newBtn = document.getElementById('tm-new');

  if (!addressEl || !statusEl || !messagesEl || !viewerEl || !copyBtn || !newBtn) return;

  let inboxId = null;
  let pollTimer = null;
  let capability = sessionStorage.getItem('tm_cap') || null;

  const setStatus = (text, isError = false) => {
    statusEl.textContent = text;
    statusEl.style.color = isError ? '#b42318' : '#5d6b85';
  };

  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const textFromHtml = (html) => {
    if (!html) return '';
    const div = document.createElement('div');
    // Parsing into a detached element to obtain text content (no script execution)
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  };

  const renderMessages = (messages) => {
    messagesEl.innerHTML = '';
    if (!messages || !messages.length) {
      const li = document.createElement('li');
      li.textContent = 'No messages yet.';
      messagesEl.appendChild(li);
      return;
    }

    messages.forEach((msg) => {
      const li = document.createElement('li');
      li.textContent = msg.from || 'Unknown sender';
      li.addEventListener('click', async () => {
        if (!capability) return setStatus('Missing inbox capability', true);
        try {
          setStatus('Loading message…');
          const detailRes = await AnvilAPI.fetch(`/api/temp-mail/messages/${encodeURIComponent(msg.id)}?cap=${encodeURIComponent(capability)}`);
          if (!detailRes.ok) throw new Error('Could not load message');
          const detail = await detailRes.json();
          viewerEl.innerHTML = '';
          const h = document.createElement('h3');
          h.textContent = detail.subject || 'Message';
          const p = document.createElement('p');
          p.innerHTML = `<strong>From:</strong> ${escapeHtml((detail.from && detail.from.address) ? detail.from.address : (detail.from || 'Unknown'))}`;
          const content = document.createElement('div');
          const pre = document.createElement('pre');
          pre.textContent = detail.text || 'No content';
          content.appendChild(pre);
          viewerEl.appendChild(h);
          viewerEl.appendChild(p);
          viewerEl.appendChild(content);
          setStatus('Message loaded.');
        } catch (e) {
          setStatus(e.message || 'Failed to load message', true);
        }
      });
      messagesEl.appendChild(li);
    });
  };

  async function fetchInbox() {
    try {
      setStatus('Requesting inbox from server…');
      const createRes = await AnvilAPI.fetch('/api/temp-mail/create', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        throw new Error(body.message || 'Could not create inbox');
      }
      const createData = await createRes.json();
      capability = createData.capability;
      sessionStorage.setItem('tm_cap', capability);
      addressEl.textContent = createData.address || 'noreply';
      setStatus('Inbox created. Waiting for messages…');
      await pollInbox();
    } catch (err) {
      setStatus(err.message || 'Inbox unavailable right now.', true);
    }
  }

  async function pollInbox() {
    if (!capability) return;
    try {
      const mailRes = await AnvilAPI.fetch(`/api/temp-mail/messages?cap=${encodeURIComponent(capability)}`);
      if (!mailRes.ok) throw new Error('Could not fetch messages');
      const data = await mailRes.json();
      renderMessages((data.messages || []).slice(0, 10));
      setStatus('Inbox active. Waiting for new mail…');
    } catch (err) {
      setStatus(err.message || 'Inbox check failed.', true);
    }

    clearTimeout(pollTimer);
    pollTimer = setTimeout(pollInbox, 8000);
  }

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(addressEl.textContent);
      setStatus('Address copied to clipboard.');
    } catch (err) {
      setStatus('Copy failed in this browser.', true);
    }
  });

  newBtn.addEventListener('click', () => {
    clearTimeout(pollTimer);
    // Delete existing inbox if present, then create a new one
    (async () => {
      try {
        const oldCap = sessionStorage.getItem('tm_cap');
        if (oldCap) {
          await AnvilAPI.fetch('/api/temp-mail/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cap: oldCap }) });
          sessionStorage.removeItem('tm_cap');
        }
      } catch (e) {
        // ignore
      }
      capability = null;
      addressEl.textContent = '';
      viewerEl.innerHTML = '';
      messagesEl.innerHTML = '';
      fetchInbox();
    })();
  });

  // If we have a capability already, try to resume polling
  if (capability) {
    setStatus('Resuming inbox…');
    pollInbox();
  } else {
    fetchInbox();
  }
});
