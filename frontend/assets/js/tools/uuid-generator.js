document.addEventListener('DOMContentLoaded', () => {
  const count = document.getElementById('uuid-count');
  const output = document.getElementById('uuid-output');
  const status = document.getElementById('uuid-status');
  const createUUID = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0'));
    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`;
  };
  const generate = () => {
    const total = Number(count.value);
    if (!Number.isInteger(total) || total < 1 || total > 100) { output.textContent = ''; status.textContent = 'Choose a whole number from 1 to 100.'; return; }
    output.textContent = Array.from({ length: total }, createUUID).join('\n');
    status.textContent = `Generated ${total} UUID${total === 1 ? '' : 's'}.`;
  };
  document.getElementById('uuid-generate').addEventListener('click', generate);
  document.getElementById('uuid-copy').addEventListener('click', async () => { if (!output.textContent) return; await navigator.clipboard.writeText(output.textContent); status.textContent = 'UUIDs copied.'; });
  document.getElementById('uuid-download').addEventListener('click', () => {
    if (!output.textContent) return;
    const url = URL.createObjectURL(new Blob([`${output.textContent}\n`], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'uuids.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  generate();
});
