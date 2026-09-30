document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('pm-file-input');
  const dropzone = document.getElementById('pm-dropzone');
  const fileList = document.getElementById('pm-file-list');
  const mergeBtn = document.getElementById('pm-merge');
  const status = document.getElementById('pm-status');

  if (!input || !dropzone || !fileList || !mergeBtn || !status) return;

  const files = [];

  const refreshList = () => {
    fileList.innerHTML = '';
    files.forEach((file, index) => {
      const item = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = file.name;
      const btn = document.createElement('button');
      btn.className = 'btn secondary';
      btn.dataset.index = String(index);
      btn.textContent = 'Remove';
      btn.addEventListener('click', () => {
        files.splice(index, 1);
        refreshList();
        mergeBtn.disabled = files.length < 2;
      });
      item.appendChild(nameSpan);
      item.appendChild(btn);
      fileList.appendChild(item);
    });
    mergeBtn.disabled = files.length < 2;
  };

  const addFiles = (newFiles) => {
    newFiles.forEach((file) => {
      if (file.type === 'application/pdf') files.push(file);
    });
    refreshList();
  };

  input.addEventListener('change', (event) => {
    addFiles(Array.from(event.target.files));
  });

  dropzone.addEventListener('click', () => input.click());
  dropzone.addEventListener('keydown', event => {
    if (event.target === dropzone && ['Enter',' '].includes(event.key)) { event.preventDefault(); input.click(); }
  });
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

  mergeBtn.addEventListener('click', async () => {
    if (!window.PDFLib) { status.textContent = 'PDF library could not load. Check your connection and reload.'; return; }
    if (files.length < 2) return;
    mergeBtn.disabled = true;
    try {
    status.textContent = 'Merging PDFs…';
    const { PDFDocument } = window.PDFLib;
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const result = await mergedPdf.save();
    const blob = new Blob([result], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged-document.pdf';
    a.click();
    status.textContent = 'Merged PDF downloaded.';
    } catch (_) { status.textContent = 'Could not merge these files. Use valid PDFs without password protection.'; }
    finally { mergeBtn.disabled = files.length < 2; }
  });

  refreshList();
});
