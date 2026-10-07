const initializeToolExamples = () => {
  document.querySelectorAll('[data-example-fields]').forEach(button => {
    button.addEventListener('click', () => {
      const feedback = document.getElementById('example-status');
      let fields;
      try {
        fields = Object.entries(JSON.parse(button.dataset.exampleFields))
          .map(([id, value]) => ({ field: document.getElementById(id), value }));
        if (!fields.length || fields.some(({ field }) => !field)) throw new Error('Missing sample field');
      } catch (_) {
        if (feedback) feedback.textContent = 'The sample could not load. Enter your example in the tool above.';
        return;
      }
      // Set every value before notifying tools that depend on multiple fields.
      for (const { field, value } of fields) {
        if (typeof value === 'boolean') field.checked = value;
        else field.value = value;
      }
      for (const { field } of fields) {
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
      }
      fields[0].field.focus();
      if (feedback) feedback.textContent = 'Sample loaded. Use the tool controls above to check the result.';
    });
  });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeToolExamples, { once: true });
else initializeToolExamples();
