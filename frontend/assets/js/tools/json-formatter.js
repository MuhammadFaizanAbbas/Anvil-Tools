document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('jf-input');
  const formatBtn = document.getElementById('jf-format');
  const minifyBtn = document.getElementById('jf-minify');
  const copyBtn = document.getElementById('jf-copy');
  const status = document.getElementById('jf-status');
  const output = document.getElementById('jf-output');

  if (!input || !formatBtn || !minifyBtn || !copyBtn || !status || !output) return;

  const setStatus = (text) => {
    status.textContent = text;
  };

  const formatJSON = (value, pretty) => {
    try {
      const parsed = JSON.parse(value);
      const result = pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      output.textContent = result;
      setStatus('JSON is valid.');
      return result;
    } catch (error) {
      output.textContent = '';
      setStatus(error.message || 'Invalid JSON.');
      return null;
    }
  };

  formatBtn.addEventListener('click', () => formatJSON(input.value, true));
  minifyBtn.addEventListener('click', () => formatJSON(input.value, false));
  copyBtn.addEventListener('click', async () => {
    if (!output.textContent) return;
    try { await navigator.clipboard.writeText(output.textContent); } catch (_) { status.textContent = 'Copy failed. Select and copy the result manually.'; return; }
    setStatus('Copied to clipboard.');
  });
});
