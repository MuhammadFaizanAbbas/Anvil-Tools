document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('tool-search');
  const category = document.getElementById('tool-category');
  const count = document.getElementById('tool-results');
  if (!search || !category || !count) return;
  const cards = [...document.querySelectorAll('[data-directory-tool]')];
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    for (const card of cards) {
      card.hidden = (category.value && card.dataset.category !== category.value) || !card.textContent.toLocaleLowerCase().includes(query);
    }
    const visible = cards.filter(card => !card.hidden).length;
    count.textContent = visible ? `${visible} of ${cards.length} tools shown.` : 'No matching tools. Try another search or choose All categories.';
  };
  search.addEventListener('input', update);
  category.addEventListener('change', update);
  update();
});
