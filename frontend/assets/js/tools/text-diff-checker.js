document.addEventListener('DOMContentLoaded', () => {
  const before = document.getElementById('diff-before');
  const after = document.getElementById('diff-after');
  const output = document.getElementById('diff-output');
  const status = document.getElementById('diff-status');
  const lines = value => value === '' ? [] : value.replace(/\r\n?/g, '\n').split('\n');

  const compare = (left, right) => {
    if (left.length * right.length > 2000000) throw Error('This comparison is too large. Keep the product of both line counts below 2,000,000.');
    const table = Array.from({ length: left.length + 1 }, () => new Uint32Array(right.length + 1));
    for (let i = left.length - 1; i >= 0; i -= 1) for (let j = right.length - 1; j >= 0; j -= 1) table[i][j] = left[i] === right[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    const result = [];
    let i = 0, j = 0;
    while (i < left.length || j < right.length) {
      if (i < left.length && j < right.length && left[i] === right[j]) { result.push({ type: 'same', left: i + 1, right: j + 1, text: left[i] }); i += 1; j += 1; }
      else if (j < right.length && (i === left.length || table[i][j + 1] >= table[i + 1][j])) { result.push({ type: 'added', right: j + 1, text: right[j] }); j += 1; }
      else { result.push({ type: 'removed', left: i + 1, text: left[i] }); i += 1; }
    }
    return result;
  };

  document.getElementById('diff-compare').addEventListener('click', () => {
    try {
      const result = compare(lines(before.value), lines(after.value));
      output.replaceChildren();
      let added = 0, removed = 0;
      for (const entry of result) {
        if (entry.type === 'added') added += 1;
        if (entry.type === 'removed') removed += 1;
        const row = document.createElement('div'); row.className = `diff-row diff-${entry.type}`;
        const oldNumber = document.createElement('span'); oldNumber.textContent = entry.left || '';
        const newNumber = document.createElement('span'); newNumber.textContent = entry.right || '';
        const marker = document.createElement('span'); marker.textContent = entry.type === 'added' ? '+' : entry.type === 'removed' ? '−' : ' ';
        const text = document.createElement('code'); text.textContent = entry.text || ' ';
        row.append(oldNumber, newNumber, marker, text); output.appendChild(row);
      }
      status.textContent = `${added} added line${added === 1 ? '' : 's'}, ${removed} removed line${removed === 1 ? '' : 's'}, ${result.length - added - removed} unchanged.`;
    } catch (error) { output.replaceChildren(); status.textContent = error.message; }
  });
  document.getElementById('diff-clear').addEventListener('click', () => { before.value = ''; after.value = ''; output.replaceChildren(); status.textContent = ''; });
});
