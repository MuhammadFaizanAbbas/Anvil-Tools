document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('ip-file-input');
  const dropzone = document.getElementById('ip-dropzone');
  const preview = document.getElementById('ip-preview');
  const convertBtn = document.getElementById('ip-convert');
  const status = document.getElementById('ip-status');

  if (!input || !dropzone || !preview || !convertBtn || !status) return;

  const files = [];
  let processing = false;

  const refreshList = (focusIndex, focusAction = 'remove') => {
    preview.innerHTML = '';
    files.forEach(({ file, url }, index) => {
      const item = document.createElement('li');
      const img = document.createElement('img');
      img.src = url;
      img.alt = file.name;
      const label = document.createElement('span');
      label.className = 'file-name';
      label.textContent = `${index + 1}. ${file.name}`;
      const actions = document.createElement('div');
      actions.className = 'file-actions';
      [['up', 'Move up'], ['down', 'Move down'], ['remove', 'Remove']].forEach(([action, text]) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn secondary';
        btn.dataset.action = action;
        btn.textContent = text;
        btn.setAttribute('aria-label', `${text}: ${file.name}`);
        btn.disabled = processing || (action === 'up' && index === 0) || (action === 'down' && index === files.length - 1);
        btn.addEventListener('click', () => {
          if (processing) return;
          if (action === 'remove') {
            URL.revokeObjectURL(files.splice(index, 1)[0].url);
            refreshList(Math.min(index, files.length - 1));
            status.textContent = `Removed ${file.name}. ${files.length} images selected.`;
            if (!files.length) dropzone.focus();
          } else {
            const target = index + (action === 'up' ? -1 : 1);
            if (target < 0 || target >= files.length) return;
            [files[index], files[target]] = [files[target], files[index]];
            refreshList(target, action);
            status.textContent = `${file.name} moved to page ${target + 1} of ${files.length}.`;
          }
        });
        actions.appendChild(btn);
      });
      item.appendChild(img);
      item.appendChild(label);
      item.appendChild(actions);
      preview.appendChild(item);
    });
    convertBtn.disabled = processing || files.length === 0;
    if (focusIndex >= 0) {
      const row = preview.children[focusIndex];
      const preferred = row?.querySelector(`[data-action="${focusAction}"]`);
      (preferred && !preferred.disabled ? preferred : row?.querySelector('button:not(:disabled)'))?.focus();
    }
  };

  const addFiles = (newFiles) => {
    if (processing) return;
    let rejected = 0;
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) files.push({ file, url: URL.createObjectURL(file) });
      else rejected++;
    });
    refreshList();
    status.textContent = `${files.length} images selected. Use Move up or Move down to set the page order.${rejected ? ` Skipped ${rejected} non-image files.` : ''}`;
  };

  input.addEventListener('change', event => { addFiles(Array.from(event.target.files)); input.value = ''; });
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

  convertBtn.addEventListener('click', async () => {
    if (processing) return;
    if (!window.PDFLib) { status.textContent = 'PDF library could not load. Check your connection and reload.'; return; }
    if (files.length === 0) return;
    processing = true;
    input.disabled = true;
    dropzone.setAttribute('aria-disabled', 'true');
    status.setAttribute('aria-busy', 'true');
    refreshList();
    try {
    status.textContent = 'Creating PDF…';
    const { PDFDocument, rgb } = window.PDFLib;
    const pdf = await PDFDocument.create();

    for (const { file } of files) {
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'images-to-pdf.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
    status.textContent = `PDF ready (${pdf.getPageCount()} pages). Open the downloaded file to check its order and readability.`;
    } catch (_) { status.textContent = 'Could not convert this image. Use a valid PNG, JPEG, or WebP image.'; }
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
