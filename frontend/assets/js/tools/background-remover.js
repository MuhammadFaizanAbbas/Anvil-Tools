document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('bg-file-input');
  const dropzone = document.getElementById('bg-dropzone');
  const preview = document.getElementById('bg-preview');
  const status = document.getElementById('bg-status');
  const downloadBtn = document.getElementById('bg-download');

  if (!input || !dropzone || !preview || !status || !downloadBtn) return;

  let processedImage = null;

  const setStatus = (text) => {
    status.textContent = text;
  };

  const showImage = (imgData, label) => {
    const wrapper = document.createElement('div');
    wrapper.style.width = '180px';
    const img = document.createElement('img');
    img.src = imgData;
    img.alt = label;
    const name = document.createElement('small');
    name.textContent = label;
    wrapper.appendChild(img);
    wrapper.appendChild(name);
    preview.appendChild(wrapper);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setStatus('Processing image…');
    preview.innerHTML = '';
    const reader = new FileReader();
    reader.onload = async () => {
      const original = reader.result;
      showImage(original, 'Original');
      try {
        const result = await window.removeBackgroundLib(file);
        processedImage = result;
        showImage(URL.createObjectURL(result), 'Result');
        downloadBtn.style.display = 'inline-block';
        setStatus('Background removed successfully.');
      } catch (error) {
        setStatus('Unable to remove the background from this image. Try another one.', true);
      }
    };
    reader.readAsDataURL(file);
  };

  input.addEventListener('change', (event) => handleFile(event.target.files[0]));
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
    const file = event.dataTransfer.files[0];
    handleFile(file);
  });

  downloadBtn.addEventListener('click', () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(processedImage);
    link.download = 'background-removed.png';
    link.click();
  });
});
