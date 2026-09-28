document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = document.getElementById('cp-generate');
  const row = document.getElementById('cp-row');
  const status = document.getElementById('cp-status');

  if (!generateBtn || !row || !status) return;

  const locked = new Set();

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const buildPalette = () => {
    const baseHue = Math.random() * 360;
    const palette = Array.from({ length: 5 }, (_, index) => {
      const hue = (baseHue + index * 36) % 360;
      const lightness = 42 + (index % 2) * 12 + (index > 2 ? 6 : 0);
      return hslToHex(hue, 72, lightness);
    });

    row.innerHTML = '';
    palette.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.background = color;
      const lockButton = document.createElement('button');
      lockButton.className = 'lock';
      lockButton.textContent = locked.has(index) ? '🔒' : '🔓';
      lockButton.addEventListener('click', () => {
        if (locked.has(index)) locked.delete(index); else locked.add(index);
        buildPalette();
      });
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = color;
      swatch.appendChild(lockButton);
      swatch.appendChild(meta);
      row.appendChild(swatch);
    });
    status.textContent = 'Palette ready.';
  };

  generateBtn.addEventListener('click', () => {
    buildPalette();
  });

  buildPalette();
});
