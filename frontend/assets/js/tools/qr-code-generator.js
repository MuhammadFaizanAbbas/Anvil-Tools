document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('qr-input');
  const generateBtn = document.getElementById('qr-generate');
  const downloadBtn = document.getElementById('qr-download');
  const status = document.getElementById('qr-status');
  const wrapper = document.getElementById('qr-canvas-wrap');

  if (!input || !generateBtn || !downloadBtn || !status || !wrapper) return;

  let qr = null;

  const makeQr = () => {
    downloadBtn.style.display = 'none';
    wrapper.innerHTML = '';
    qr = null;
    const text = input.value.trim();
    if (!text) {
      status.textContent = 'Enter text or a URL first.';
      return;
    }
    if (typeof QRCode === 'undefined') {
      status.textContent = 'QR library could not load. Check your connection and reload.';
      return;
    }
    try {
    qr = new QRCode(wrapper, {
      text,
      width: 180,
      height: 180,
      colorDark: '#111827',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
    downloadBtn.style.display = 'inline-block';
    status.textContent = 'QR code generated.';
    } catch (_) {
      wrapper.innerHTML = '';
      qr = null;
      status.textContent = 'Could not generate this QR code. Try a shorter message or URL.';
    }
  };

  generateBtn.addEventListener('click', makeQr);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') makeQr();
  });
  downloadBtn.addEventListener('click', () => {
    try {
    const canvas = wrapper.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'qr-code.png';
    link.click();
    status.textContent = 'QR image downloaded. Scan it to check the result.';
    } catch (_) { status.textContent = 'Could not download the QR image. Try generating it again.'; }
  });

  makeQr();
});
