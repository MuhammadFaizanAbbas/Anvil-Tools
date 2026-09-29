document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('bg-file-input');
  const dropzone = document.getElementById('bg-dropzone');
  const preview = document.getElementById('bg-preview');
  const status = document.getElementById('bg-status');
  const downloadBtn = document.getElementById('bg-download');

  if (!input || !dropzone || !preview || !status || !downloadBtn) return;

  const modelPath = new URL('/assets/vendor/background-removal/1.5.5/', window.location.origin).href;
  const objectUrls = [];
  let processedImage = null;
  let processing = false;

  const setStatus = (text, busy = false) => {
    status.textContent = text;
    if (busy) status.setAttribute('aria-busy', 'true');
    else status.removeAttribute('aria-busy');
  };

  const setProcessing = (busy) => {
    processing = busy;
    input.disabled = busy;
    dropzone.setAttribute('aria-disabled', String(busy));
    dropzone.style.cursor = busy ? 'wait' : '';
  };

  const clearPreview = () => {
    objectUrls.splice(0).forEach(url => URL.revokeObjectURL(url));
    preview.innerHTML = '';
  };

  const showImage = (source, label) => {
    const wrapper = document.createElement('div');
    wrapper.style.width = '180px';
    const img = document.createElement('img');
    img.src = source;
    img.alt = label;
    const name = document.createElement('small');
    name.textContent = label;
    wrapper.appendChild(img);
    wrapper.appendChild(name);
    preview.appendChild(wrapper);
  };

  const formatMegabytes = bytes => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const handleFile = async (file) => {
    if (!file || processing) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus('Choose a JPG, PNG, or WebP image.');
      return;
    }

    processedImage = null;
    downloadBtn.style.display = 'none';
    clearPreview();
    const originalUrl = URL.createObjectURL(file);
    objectUrls.push(originalUrl);
    showImage(originalUrl, 'Original');
    setProcessing(true);
    setStatus('Preparing the background remover…', true);

    const controller = new AbortController();
    let lastActivity = Date.now();
    const watchdog = window.setInterval(() => {
      if (Date.now() - lastActivity > 90000) controller.abort();
    }, 5000);

    try {
      if (!window.removeBackgroundLib) throw Error('Background removal library did not load.');
      const result = await window.removeBackgroundLib(file, {
        model: 'small',
        publicPath: modelPath,
        fetchArgs: { signal: controller.signal },
        progress: (key, current, total) => {
          lastActivity = Date.now();
          if (key.startsWith('fetch:')) {
            const percent = total ? Math.min(100, Math.round(current / total * 100)) : 0;
            const item = key.includes('/models/') ? 'background-removal model' : 'image processor';
            const size = total ? ` (${formatMegabytes(current)} of ${formatMegabytes(total)})` : '';
            setStatus(`Downloading ${item}… ${percent}%${size}. Keep this tab open.`, true);
          } else if (key.includes('encode') || key.includes('mask')) {
            setStatus('Preparing your transparent PNG…', true);
          } else {
            setStatus('Removing the background… This may take a moment on slower devices.', true);
          }
        },
      });
      processedImage = result;
      const resultUrl = URL.createObjectURL(result);
      objectUrls.push(resultUrl);
      showImage(resultUrl, 'Result');
      downloadBtn.style.display = 'inline-block';
      setStatus('Background removed successfully.');
    } catch (error) {
      console.error('Background removal failed:', error);
      if (controller.signal.aborted) {
        setStatus('The model download stopped because no data arrived for 90 seconds. Check your connection and choose the image again.');
      } else {
        setStatus('Unable to process this image. Check your connection, then choose the image again.');
      }
    } finally {
      window.clearInterval(watchdog);
      setProcessing(false);
    }
  };

  input.addEventListener('click', () => { input.value = ''; });
  input.addEventListener('change', event => handleFile(event.target.files[0]));
  dropzone.addEventListener('click', () => { if (!processing) input.click(); });
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      if (!processing) dropzone.style.borderColor = '#2b6cf6';
    });
  });
  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, event => {
      event.preventDefault();
      dropzone.style.borderColor = '#bfd0ff';
    });
  });
  dropzone.addEventListener('drop', event => {
    if (!processing) handleFile(event.dataTransfer.files[0]);
  });

  downloadBtn.addEventListener('click', () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    const downloadUrl = URL.createObjectURL(processedImage);
    link.href = downloadUrl;
    link.download = 'background-removed.png';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  });

  window.addEventListener('pagehide', () => objectUrls.forEach(url => URL.revokeObjectURL(url)));
});
