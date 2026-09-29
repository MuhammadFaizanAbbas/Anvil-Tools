document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('jwt-input');
  const headerOutput = document.getElementById('jwt-header');
  const payloadOutput = document.getElementById('jwt-payload');
  const status = document.getElementById('jwt-status');

  const decodeSection = value => {
    if (!/^[A-Za-z0-9_-]+$/.test(value)) throw Error('Invalid Base64URL characters.');
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
    const bytes = Uint8Array.from(atob(base64), character => character.charCodeAt(0));
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  };

  document.getElementById('jwt-decode').addEventListener('click', () => {
    try {
      const sections = input.value.trim().split('.');
      if (sections.length !== 3 || !sections[0] || !sections[1]) throw Error('A compact JWT must contain a header, payload, and signature section.');
      if (sections[2] && !/^[A-Za-z0-9_-]+$/.test(sections[2])) throw Error('The JWT signature contains invalid Base64URL characters.');
      const header = decodeSection(sections[0]);
      const payload = decodeSection(sections[1]);
      if (!header || typeof header !== 'object' || Array.isArray(header) || !payload || typeof payload !== 'object' || Array.isArray(payload)) throw Error('The JWT header and payload must be JSON objects.');
      headerOutput.textContent = JSON.stringify(header, null, 2);
      payloadOutput.textContent = JSON.stringify(payload, null, 2);
      const notes = ['Decoded only; signature not verified.'];
      const now = Date.now() / 1000;
      if (Number.isFinite(payload.exp)) notes.push(payload.exp <= now ? `Expired ${new Date(payload.exp * 1000).toLocaleString()}.` : `Expires ${new Date(payload.exp * 1000).toLocaleString()}.`);
      if (Number.isFinite(payload.nbf) && payload.nbf > now) notes.push(`Not valid before ${new Date(payload.nbf * 1000).toLocaleString()}.`);
      status.textContent = notes.join(' ');
    } catch (error) {
      headerOutput.textContent = '';
      payloadOutput.textContent = '';
      status.textContent = error.message || 'Unable to decode this JWT.';
    }
  });
  document.getElementById('jwt-clear').addEventListener('click', () => {
    input.value = '';
    headerOutput.textContent = '';
    payloadOutput.textContent = '';
    status.textContent = '';
  });
});
