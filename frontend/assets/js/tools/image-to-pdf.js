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
    if (!window.PDFLib || files.length === 0) return;
    status.textContent = 'Creating PDF…';
    const { PDFDocument, rgb } = window.PDFLib;
    const pdf = await PDFDocument.create();

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const image = await (file.type === 'image/png' ? pdf.embedPng(bytes) : pdf.embedJpg(bytes));
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
  });
});
