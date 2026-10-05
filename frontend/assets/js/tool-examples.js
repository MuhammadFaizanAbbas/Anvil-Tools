document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-example-fields]').forEach(button => {
    button.addEventListener('click', () => {
      const fields = JSON.parse(button.dataset.exampleFields);
      for (const [id, value] of Object.entries(fields)) {
        const field = document.getElementById(id);
        if (!field) continue;
        if (typeof value === 'boolean') field.checked = value;
        else field.value = value;
        field.dispatchEvent(new Event(field.tagName === 'SELECT' || field.type === 'checkbox' ? 'change' : 'input', { bubbles: true }));
      }
      const first = document.getElementById(Object.keys(fields)[0]);
      first?.focus();
      const feedback = document.getElementById('example-status');
      if (feedback) feedback.textContent = 'Sample loaded. Use the tool controls above to check the result.';
    });
  });
});
