document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('csv-input');
  const headers = document.getElementById('csv-headers');
  const output = document.getElementById('csv-output');
  const status = document.getElementById('csv-status');

  const parseCSV = source => {
    const text = source.replace(/^\uFEFF/, '');
    const rows = [];
    let row = [], field = '', quoted = false, closedQuote = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (quoted) {
        if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
        else if (character === '"') { quoted = false; closedQuote = true; }
        else field += character;
      } else if (closedQuote) {
        if (character === ',') { row.push(field); field = ''; closedQuote = false; }
        else if (character === '\n' || character === '\r') {
          row.push(field); rows.push(row); row = []; field = ''; closedQuote = false;
          if (character === '\r' && text[index + 1] === '\n') index += 1;
        } else if (character !== ' ' && character !== '\t') throw Error(`Unexpected character after a closing quote at position ${index + 1}.`);
      } else if (character === '"') {
        if (field) throw Error(`A quoted field must start with a quote at position ${index + 1}.`);
        quoted = true;
      } else if (character === ',') { row.push(field); field = ''; }
      else if (character === '\n' || character === '\r') {
        row.push(field); rows.push(row); row = []; field = '';
        if (character === '\r' && text[index + 1] === '\n') index += 1;
      } else field += character;
    }
    if (quoted) throw Error('The CSV ends inside a quoted field.');
    if (field !== '' || row.length || !/[\r\n]$/.test(text)) { row.push(field); rows.push(row); }
    return rows;
  };

  const convert = () => {
    if (!input.value) throw Error('Paste CSV data first.');
    const rows = parseCSV(input.value);
    if (!rows.length) throw Error('No CSV rows were found.');
    const width = rows[0].length;
    const mismatch = rows.findIndex(row => row.length !== width);
    if (mismatch >= 0) throw Error(`Row ${mismatch + 1} has ${rows[mismatch].length} columns; expected ${width}.`);
    let data = rows;
    if (headers.checked) {
      const keys = rows[0];
      if (keys.some(key => key === '')) throw Error('Header names cannot be empty.');
      if (new Set(keys).size !== keys.length) throw Error('Header names must be unique.');
      data = rows.slice(1).map(row => Object.fromEntries(keys.map((key, index) => [key, row[index]])));
    }
    const json = JSON.stringify(data, null, 2);
    output.textContent = json;
    const dataRowCount = headers.checked ? Math.max(rows.length - 1, 0) : rows.length;
    status.textContent = `Converted ${dataRowCount} data row${dataRowCount === 1 ? '' : 's'}. Values remain strings.`;
    return json;
  };
  document.getElementById('csv-convert').addEventListener('click', () => { try { convert(); } catch (error) { output.textContent = ''; status.textContent = error.message; } });
  document.getElementById('csv-copy').addEventListener('click', async () => { if (!output.textContent) return; try { await navigator.clipboard.writeText(output.textContent); } catch (_) { status.textContent = 'Copy failed. Select and copy the result manually.'; return; } status.textContent = 'JSON copied.'; });
  document.getElementById('csv-download').addEventListener('click', () => {
    if (!output.textContent) return;
    const url = URL.createObjectURL(new Blob([output.textContent], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'converted-data.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
});
