document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('qr-input');
  const generateBtn = document.getElementById('qr-generate');
  const downloadBtn = document.getElementById('qr-download');
  const status = document.getElementById('qr-status');
  const wrapper = document.getElementById('qr-canvas-wrap');

  if (!input || !generateBtn || !downloadBtn || !status || !wrapper) return;

  let qr = null;

  const makeQr = () => {
    const text = input.value.trim();
    if (!text) {
      status.textContent = 'Enter text or a URL first.';
      if (qr) qr.clear();
      return;
    }
    wrapper.innerHTML = '';
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
  };

  generateBtn.addEventListener('click', makeQr);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') makeQr();
  });
  downloadBtn.addEventListener('click', () => {
    const canvas = wrapper.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'qr-code.png';
    link.click();
  });

  makeQr();
});
