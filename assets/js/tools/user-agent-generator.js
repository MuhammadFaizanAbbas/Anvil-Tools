document.addEventListener('DOMContentLoaded', () => {
  const select = document.getElementById('ua-select');
  const randomBtn = document.getElementById('ua-random');
  const copyBtn = document.getElementById('ua-copy');
  const output = document.getElementById('ua-output');
  const status = document.getElementById('ua-status');

  if (!select || !randomBtn || !copyBtn || !output || !status) return;

  const agents = [
    { label: 'Chrome Windows', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' },
    { label: 'Chrome macOS', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' },
    { label: 'Firefox Windows', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0' },
    { label: 'Safari macOS', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15' },
    { label: 'iPhone Safari', value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' },
    { label: 'Googlebot', value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
  ];

  agents.forEach(({ label, value }) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  });

  const update = () => {
    output.textContent = select.value;
    status.textContent = 'User agent ready.';
  };

  select.addEventListener('change', update);
  randomBtn.addEventListener('click', () => {
    const random = agents[Math.floor(Math.random() * agents.length)];
    select.value = random.value;
    update();
  });
  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.textContent);
    status.textContent = 'Copied to clipboard.';
  });

  update();
});
