document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('url-input');
  const mode = document.getElementById('url-mode');
  const output = document.getElementById('url-output');
  const status = document.getElementById('url-status');
  const transform = action => {
    try {
      const component = mode.value === 'component';
      output.textContent = action === 'encode'
        ? (component ? encodeURIComponent(input.value) : encodeURI(input.value))
        : (component ? decodeURIComponent(input.value) : decodeURI(input.value));
      status.textContent = `${action === 'encode' ? 'Encoded' : 'Decoded'} successfully.`;
    } catch (error) {
      output.textContent = '';
      status.textContent = 'This value contains malformed percent encoding or invalid UTF-8.';
    }
  };
  document.getElementById('url-encode').addEventListener('click', () => transform('encode'));
  document.getElementById('url-decode').addEventListener('click', () => transform('decode'));
  document.getElementById('url-copy').addEventListener('click', async () => {
    if (!output.textContent) return;
    await navigator.clipboard.writeText(output.textContent);
    status.textContent = 'Copied to clipboard.';
  });
});
