document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('hash-input');
  const algorithm = document.getElementById('hash-algorithm');
  const hexOutput = document.getElementById('hash-hex');
  const base64Output = document.getElementById('hash-base64');
  const status = document.getElementById('hash-status');
  document.getElementById('hash-generate').addEventListener('click', async () => {
    try {
      const digest = new Uint8Array(await crypto.subtle.digest(algorithm.value, new TextEncoder().encode(input.value)));
      hexOutput.textContent = [...digest].map(byte => byte.toString(16).padStart(2, '0')).join('');
      let binary = '';
      digest.forEach(byte => { binary += String.fromCharCode(byte); });
      base64Output.textContent = btoa(binary);
      status.textContent = `${algorithm.value} generated from ${new TextEncoder().encode(input.value).length} UTF-8 bytes.`;
    } catch (error) {
      hexOutput.textContent = '';
      base64Output.textContent = '';
      status.textContent = 'Hashing is unavailable in this browser.';
    }
  });
  document.getElementById('hash-copy').addEventListener('click', async () => {
    if (!hexOutput.textContent) return;
    await navigator.clipboard.writeText(hexOutput.textContent);
    status.textContent = 'Hexadecimal hash copied.';
  });
});
