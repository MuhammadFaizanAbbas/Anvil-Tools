document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('case-input');
  const output = document.getElementById('case-output');
  const status = document.getElementById('case-status');
  const words = value => value.replace(/['’]/gu, '').match(/[\p{L}\p{N}\p{M}]+/gu) || [];
  const capitalize = word => word ? word[0].toLocaleUpperCase() + word.slice(1).toLocaleLowerCase() : '';
  const transforms = {
    lower: value => value.toLocaleLowerCase(),
    upper: value => value.toLocaleUpperCase(),
    title: value => value.toLocaleLowerCase().replace(/[\p{L}\p{N}\p{M}]+(?:['’][\p{L}\p{N}\p{M}]+)*/gu, capitalize),
    sentence: value => value.toLocaleLowerCase().replace(/(^|[.!?]\s+)(\p{L})/gu, (_, boundary, letter) => boundary + letter.toLocaleUpperCase()),
    camel: value => words(value).map((word, index) => index ? capitalize(word) : word.toLocaleLowerCase()).join(''),
    pascal: value => words(value).map(capitalize).join(''),
    snake: value => words(value).map(word => word.toLocaleLowerCase()).join('_'),
    kebab: value => words(value).map(word => word.toLocaleLowerCase()).join('-'),
  };
  document.querySelectorAll('[data-case]').forEach(button => button.addEventListener('click', () => {
    output.value = transforms[button.dataset.case](input.value);
    status.textContent = `Converted to ${button.textContent}.`;
  }));
  document.getElementById('case-copy').addEventListener('click', async () => {
    if (!output.value) return;
    try { await navigator.clipboard.writeText(output.value); } catch (_) { status.textContent = 'Copy failed. Select and copy the result manually.'; return; }
    status.textContent = 'Converted text copied.';
  });
});
