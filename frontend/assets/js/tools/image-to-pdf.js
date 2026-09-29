document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('ip-file-input');
  const dropzone = document.getElementById('ip-dropzone');
  const preview = document.getElementById('ip-preview');
  const convertBtn = document.getElementById('ip-convert');
  const status = document.getElementById('ip-status');

  if (!input || !dropzone || !preview || !convertBtn || !status) return;

  const files = [];

  const addFiles = (newFiles) => {
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) files.push(file);
    });
    preview.innerHTML = '';
    files.forEach((file) => {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      preview.appendChild(img);
    });
    convertBtn.disabled = files.length === 0;
  };

  input.addEventListener('change', (event) => addFiles(Array.from(event.target.files)));
  dropzone.addEventListener('click', () => input.click());
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.style.borderColor = '#2b6cf6';
    });
  });
  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.style.borderColor = '#bfd0ff';
    });
  });
  dropzone.addEventListener('drop', (event) => {
    addFiles(Array.from(event.dataTransfer.files));
  });

  convertBtn.addEventListener('click', async () => {
    if (!window.PDFLib) { status.textContent = 'PDF library could not load. Check your connection and reload.'; return; }
    if (files.length === 0) return;
    convertBtn.disabled = true;
    try {
    status.textContent = 'Creating PDF…';
    const { PDFDocument, rgb } = window.PDFLib;
    const pdf = await PDFDocument.create();

    for (const file of files) {
      let bytes = await file.arrayBuffer();
      let png = file.type === 'image/png';
      if (!['image/png', 'image/jpeg'].includes(file.type)) {
        const bitmap = await createImageBitmap(file);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width; canvas.height = bitmap.height;
          canvas.getContext('2d').drawImage(bitmap, 0, 0);
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          if (!blob) throw Error('Image conversion failed');
          bytes = await blob.arrayBuffer(); png = true;
        } finally { bitmap.close(); }
      }
      const image = await (png ? pdf.embedPng(bytes) : pdf.embedJpg(bytes));
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
        color: rgb(1, 1, 1),
      });
    }

    const bytes = await pdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'images-to-pdf.pdf';
    a.click();
    status.textContent = 'PDF downloaded.';
    } catch (_) { status.textContent = 'Could not convert this image. Use a valid PNG, JPEG, or WebP image.'; }
    finally { convertBtn.disabled = files.length === 0; }
  });
});
