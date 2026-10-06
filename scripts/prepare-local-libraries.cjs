// Pinned browser libraries, with upstream licenses. No user inputs go to a CDN.
const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
(async () => {
  const folder = 'frontend/assets/vendor/tool-libraries';
  fs.mkdirSync(folder, { recursive: true });
  const sources = [
    ['pdf-lib-1.17.1.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js'],
    ['pdf-lib-LICENSE.txt', 'https://raw.githubusercontent.com/Hopding/pdf-lib/v1.17.1/LICENSE.md'],
    ['qrcode-1.0.0.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'],
    ['qrcode-LICENSE.txt', 'https://raw.githubusercontent.com/davidshimjs/qrcodejs/master/LICENSE']
  ];
  const manifest = [];
  for (const [name, source] of sources) {
    const response = await fetch(source, { signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, source);
    const data = Buffer.from(await response.arrayBuffer());
    assert.ok(data.length > 500, 'Expected a complete library or license');
    fs.writeFileSync(`${folder}/${name}`, data);
    manifest.push({ name, source, bytes: data.length, sha256: crypto.createHash('sha256').update(data).digest('hex') });
  }
  fs.writeFileSync(`${folder}/sources.json`, JSON.stringify(manifest, null, 2) + '\n');
  const targets = ['frontend/tools/pdf-merge.html', 'frontend/tools/image-to-pdf.html', 'frontend/tools/qr-code-generator.html', 'scripts/site-generator/build_site_data.py'];
  for (const file of targets) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replaceAll('<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>', '<script defer src="/assets/vendor/tool-libraries/pdf-lib-1.17.1.min.js"></script>');
    text = text.replaceAll('<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>', '<script defer src="/assets/vendor/tool-libraries/qrcode-1.0.0.min.js"></script>');
    fs.writeFileSync(file, text);
  }
  console.log(JSON.stringify({ files: manifest.map(item => ({ name: item.name, bytes: item.bytes })), targets }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
