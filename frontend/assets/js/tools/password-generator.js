document.addEventListener('DOMContentLoaded', () => {
  const lengthInput = document.getElementById('pw-length');
  const lengthValue = document.getElementById('pw-length-value');
  const upperEl = document.getElementById('pw-upper');
  const lowerEl = document.getElementById('pw-lower');
  const numbersEl = document.getElementById('pw-numbers');
  const symbolsEl = document.getElementById('pw-symbols');
  const generateBtn = document.getElementById('pw-generate');
  const copyBtn = document.getElementById('pw-copy');
  const output = document.getElementById('pw-output');
  const strength = document.getElementById('pw-strength');

  if (!lengthInput || !lengthValue || !upperEl || !lowerEl || !numbersEl || !symbolsEl || !generateBtn || !copyBtn || !output || !strength) return;

  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{};:,.<>?';

  const getCharset = () => {
    let charset = '';
    if (upperEl.checked) charset += upper;
    if (lowerEl.checked) charset += lower;
    if (numbersEl.checked) charset += numbers;
    if (symbolsEl.checked) charset += symbols;
    return charset;
  };

  const getStrength = (value) => {
    let score = 0;
    if (value.length >= 12) score += 1;
    if (value.length >= 16) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    if (score >= 5) return 'Strong';
    if (score >= 3) return 'Moderate';
    return 'Weak';
  };

  const generatePassword = () => {
    const charset = getCharset();
    if (!charset) {
      output.textContent = 'Select at least one character type.';
      strength.textContent = '';
      return;
    }

    const size = Math.max(1, Number(lengthInput.value) || 16);

    // Helper: crypto-backed random integer in [0, max)
    const randomInt = (max) => {
      const arr = new Uint32Array(1);
      window.crypto.getRandomValues(arr);
      return Math.floor((arr[0] / 0xffffffff) * max);
    };

    // Ensure at least one of each selected character class is present
    const required = [];
    if (upperEl.checked) required.push(upper[randomInt(upper.length)]);
    if (lowerEl.checked) required.push(lower[randomInt(lower.length)]);
    if (numbersEl.checked) required.push(numbers[randomInt(numbers.length)]);
    if (symbolsEl.checked) required.push(symbols[randomInt(symbols.length)]);

    const remaining = size - required.length;
    const resultChars = [];
    for (let i = 0; i < remaining; i++) {
      resultChars.push(charset[randomInt(charset.length)]);
    }

    // Insert required chars at random positions
    required.forEach((ch) => {
      const idx = resultChars.length ? randomInt(resultChars.length + 1) : 0;
      resultChars.splice(idx, 0, ch);
    });

    const finalValue = resultChars.slice(0, size).join('');
    output.textContent = finalValue;
    strength.textContent = `Strength: ${getStrength(finalValue)}`;
  };

  lengthInput.addEventListener('input', () => {
    lengthValue.textContent = lengthInput.value;
  });

  generateBtn.addEventListener('click', generatePassword);
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(output.textContent);
      strength.textContent = 'Copied to clipboard.';
    } catch (err) {
      strength.textContent = 'Could not copy automatically.';
    }
  });

  generatePassword();
});
