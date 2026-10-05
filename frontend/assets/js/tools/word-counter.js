document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('wc-input');
  const wordsEl = document.getElementById('wc-words');
  const charsEl = document.getElementById('wc-chars');
  const noSpaceEl = document.getElementById('wc-chars-nospace');
  const sentencesEl = document.getElementById('wc-sentences');
  const paragraphsEl = document.getElementById('wc-paragraphs');
  const readTimeEl = document.getElementById('wc-readtime');

  if (!input || !wordsEl || !charsEl || !noSpaceEl || !sentencesEl || !paragraphsEl || !readTimeEl) return;

  const update = () => {
    const text = input.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const charsNoSpace = text.replace(/\s+/g, '').length;
    const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 0).length;
    const paragraphs = text.split(/\n\s*\n/).filter((part) => part.trim().length > 0).length || 0;
    const readTime = Math.ceil(words / 200);

    wordsEl.textContent = String(words);
    charsEl.textContent = String(chars);
    noSpaceEl.textContent = String(charsNoSpace);
    sentencesEl.textContent = String(sentences);
    paragraphsEl.textContent = String(paragraphs);
    readTimeEl.textContent = `${readTime} min`;
  };

  input.addEventListener('input', update);
  update();
});
