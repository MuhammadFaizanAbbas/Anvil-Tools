document.addEventListener('DOMContentLoaded', () => {
  const group = document.getElementById('uc-group');
  const value = document.getElementById('uc-value');
  const from = document.getElementById('uc-from');
  const to = document.getElementById('uc-to');
  const result = document.getElementById('uc-result');

  if (!group || !value || !from || !to || !result) return;

  const definitions = {
    length: { meter: 1, kilometer: 1000, centimeter: 0.01, millimeter: 0.001, mile: 1609.344, yard: 0.9144, foot: 0.3048, inch: 0.0254 },
    weight: { kilogram: 1, gram: 0.001, milligram: 0.000001, pound: 0.45359237, ounce: 0.0283495231, tonne: 1000 },
    temperature: { celsius: 'c', fahrenheit: 'f', kelvin: 'k' }
  };

  const populate = () => {
    const selection = definitions[group.value];
    from.innerHTML = '';
    to.innerHTML = '';

    if (group.value === 'temperature') {
      Object.keys(selection).forEach((unit) => {
        const a = document.createElement('option');
        a.value = unit;
        a.textContent = unit;
        from.appendChild(a.cloneNode(true));
        to.appendChild(a.cloneNode(true));
      });
      from.value = 'celsius';
      to.value = 'fahrenheit';
    } else {
      Object.keys(selection).forEach((unit) => {
        const a = document.createElement('option');
        a.value = unit;
        a.textContent = unit;
        from.appendChild(a.cloneNode(true));
        to.appendChild(a.cloneNode(true));
      });
      from.value = Object.keys(selection)[0];
      to.value = Object.keys(selection)[1] || Object.keys(selection)[0];
    }
    updateResult();
  };

  const toBase = (unit, amount) => {
    if (group.value === 'temperature') {
      if (unit === 'celsius') return amount;
      if (unit === 'fahrenheit') return (amount - 32) * 5 / 9;
      return amount - 273.15;
    }
    return amount * definitions[group.value][unit];
  };

  const fromBase = (unit, amount) => {
    if (group.value === 'temperature') {
      if (unit === 'celsius') return amount;
      if (unit === 'fahrenheit') return (amount * 9 / 5) + 32;
      return amount + 273.15;
    }
    return amount / definitions[group.value][unit];
  };

  const updateResult = () => {
    const numeric = Number(value.value);
    if (String(value.value).trim() === '' || !Number.isFinite(numeric)) {
      result.textContent = 'Enter a finite number to convert.';
      return;
    }
    if (group.value === 'temperature') {
      const converted = fromBase(to.value, toBase(from.value, numeric));
      result.textContent = `${numeric} ${from.value} = ${converted.toFixed(3)} ${to.value}`;
      return;
    }
    const converted = fromBase(to.value, toBase(from.value, numeric));
    result.textContent = `${numeric} ${from.value} = ${converted.toFixed(6)} ${to.value}`;
  };

  group.addEventListener('change', populate);
  from.addEventListener('change', updateResult);
  to.addEventListener('change', updateResult);
  value.addEventListener('input', updateResult);

  populate();
});
