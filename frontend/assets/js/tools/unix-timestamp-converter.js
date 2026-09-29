document.addEventListener('DOMContentLoaded', () => {
  const timestamp = document.getElementById('ts-value');
  const unit = document.getElementById('ts-unit');
  const dateInput = document.getElementById('ts-date');
  const zone = document.getElementById('ts-zone');
  const output = document.getElementById('ts-output');
  const status = document.getElementById('ts-status');

  const show = date => {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) throw Error('Enter a date within JavaScript’s supported range.');
    output.textContent = [`UTC: ${date.toISOString()}`, `Local: ${date.toLocaleString()}`, `Unix seconds: ${date.getTime() / 1000}`, `Unix milliseconds: ${date.getTime()}`].join('\n');
    status.textContent = 'Converted successfully.';
  };
  document.getElementById('ts-from').addEventListener('click', () => {
    try {
      const value = timestamp.value.trim();
      if (!/^-?\d+(?:\.\d+)?$/.test(value)) throw Error('Enter a numeric Unix timestamp.');
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) throw Error('Enter a finite Unix timestamp.');
      show(new Date(unit.value === 'seconds' ? numeric * 1000 : numeric));
    } catch (error) { output.textContent = ''; status.textContent = error.message; }
  });
  document.getElementById('ts-now').addEventListener('click', () => {
    const now = new Date();
    timestamp.value = String(Math.trunc(now.getTime() / 1000));
    unit.value = 'seconds';
    show(now);
  });
  document.getElementById('ts-to').addEventListener('click', () => {
    try {
      if (!dateInput.value) throw Error('Choose a date and time.');
      const normalized = zone.value === 'utc' ? `${dateInput.value}Z` : dateInput.value;
      show(new Date(normalized));
    } catch (error) { output.textContent = ''; status.textContent = error.message; }
  });
});
