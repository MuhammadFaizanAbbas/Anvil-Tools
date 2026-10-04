document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('pm-file-input');
  const dropzone = document.getElementById('pm-dropzone');
  const fileList = document.getElementById('pm-file-list');
  const mergeBtn = document.getElementById('pm-merge');
  const status = document.getElementById('pm-status');

  if (!input || !dropzone || !fileList || !mergeBtn || !status) return;

  const files = [];
  let processing = false;

  const refreshList = (focusIndex, focusAction = 'remove') => {
    fileList.innerHTML = '';
    files.forEach((file, index) => {
      const item = document.createElement('li');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'file-name';
      nameSpan.textContent = `${index + 1}. ${file.name}`;
      const actions = document.createElement('div');
      actions.className = 'file-actions';
      [['up', 'Move up'], ['down', 'Move down'], ['remove', 'Remove']].forEach(([action, label]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn secondary';
        btn.dataset.action = action;
        btn.textContent = label;
        btn.setAttribute('aria-label', `${label}: ${file.name}`);
        btn.disabled = processing || (action === 'up' && index === 0) || (action === 'down' && index === files.length - 1);
        btn.addEventListener('click', () => {
          if (processing) return;
          if (action === 'remove') {
            files.splice(index, 1);
            refreshList(Math.min(index, files.length - 1));
            status.textContent = `Removed ${file.name}. ${files.length} files selected.`;
            if (!files.length) dropzone.focus();
          } else {
            const target = index + (action === 'up' ? -1 : 1);
            if (target < 0 || target >= files.length) return;
            [files[index], files[target]] = [files[target], files[index]];
            refreshList(target, action);
            status.textContent = `${file.name} moved to position ${target + 1} of ${files.length}.`;
          }
        });
        actions.appendChild(btn);
      });
      item.appendChild(nameSpan);
      item.appendChild(actions);
      fileList.appendChild(item);
    });
    mergeBtn.disabled = processing || files.length < 2;
    if (focusIndex >= 0) {
      const row = fileList.children[focusIndex];
      const preferred = row?.querySelector(`[data-action="${focusAction}"]`);
      (preferred && !preferred.disabled ? preferred : row?.querySelector('button:not(:disabled)'))?.focus();
    }
  };

  const addFiles = (newFiles) => {
    if (processing) return;
    let rejected = 0;
    newFiles.forEach((file) => {
      if (file.type === 'application/pdf' || (!file.type && /\.pdf$/i.test(file.name))) files.push(file);
      else rejected++;
    });
    refreshList();
    status.textContent = `${files.length} files selected. Use Move up or Move down to set the merge order.${rejected ? ` Skipped ${rejected} non-PDF files.` : ''}`;
  };

  input.addEventListener('change', (event) => {
    addFiles(Array.from(event.target.files));
    input.value = '';
  });

  dropzone.addEventListener('click', () => { if (!processing) input.click(); });
  dropzone.addEventListener('keydown', event => {
    if (event.target === dropzone && ['Enter',' '].includes(event.key)) { event.preventDefault(); if (!processing) input.click(); }
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
    if (processing) return;
    if (!window.PDFLib) { status.textContent = 'PDF library could not load. Check your connection and reload.'; return; }
    if (files.length < 2) return;
    processing = true;
    input.disabled = true;
    dropzone.setAttribute('aria-disabled', 'true');
    status.setAttribute('aria-busy', 'true');
    refreshList();
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
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = `Merged PDF ready (${mergedPdf.getPageCount()} pages). Open the downloaded file to check its order.`;
    } catch (_) { status.textContent = 'Could not merge these files. Use valid PDFs without password protection.'; }
    finally {
      processing = false;
      input.disabled = false;
      dropzone.setAttribute('aria-disabled', 'false');
      status.removeAttribute('aria-busy');
      refreshList();
    }
  });

  refreshList();
});
