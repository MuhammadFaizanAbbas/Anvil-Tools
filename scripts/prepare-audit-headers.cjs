const fs = require('node:fs');
for (const file of ['vercel.json', 'frontend/vercel.json']) {
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const headers = {
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
  const index = config.routes.findIndex(route => route.src === '^/assets/css/(.*)$');
  config.routes.splice(index, 0, { src: '^/(.*)$', headers, continue: true },
    { src: '^/assets/vendor/tool-libraries/(.*)$', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true });
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
