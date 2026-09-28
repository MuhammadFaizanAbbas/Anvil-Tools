document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('b64-input');
  const encodeBtn = document.getElementById('b64-encode');
  const decodeBtn = document.getElementById('b64-decode');
  const copyBtn = document.getElementById('b64-copy');
  const output = document.getElementById('b64-output');
  const status = document.getElementById('b64-status');

  if (!input || !encodeBtn || !decodeBtn || !copyBtn || !output || !status) return;

  const setStatus = (text) => {
    status.textContent = text;
  };

  const encodeText = () => {
    const text = input.value;
    output.textContent = btoa(unescape(encodeURIComponent(text)));
    setStatus('Encoded successfully.');
  };

  const decodeText = () => {
    const text = input.value;
    try {
      const decoded = decodeURIComponent(escape(atob(text)));
      output.textContent = decoded;
      setStatus('Decoded successfully.');
    } catch (error) {
      setStatus('This is not valid Base64.');
      output.textContent = '';
    }
  };

  encodeBtn.addEventListener('click', encodeText);
  decodeBtn.addEventListener('click', decodeText);
  copyBtn.addEventListener('click', async () => {
    if (!output.textContent) return;
    await navigator.clipboard.writeText(output.textContent);
    setStatus('Copied to clipboard.');
  });
});
