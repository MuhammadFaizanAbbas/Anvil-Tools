const fs = require('node:fs');
const assert = require('node:assert/strict');
const file = 'frontend/privacy-policy.html';
let text = fs.readFileSync(file, 'utf8');
const marker = '<h2>Local processing and network requests</h2>';
assert.ok(text.includes(marker));
text = text.replace(/(<h2>Local processing and network requests<\/h2>)<p>[\s\S]*?<\/p>/, '$1<p>Processing input locally means the tool operates on your text or file in your browser. Fonts and the PDF and QR libraries are served by this website. Background removal downloads its processing code from jsDelivr when you choose an image; its model files are served by this website. These asset requests share ordinary connection information, including your IP address, with the servers delivering them. Your selected image is processed in the browser and is not sent to jsDelivr or our API. See <a href="https://www.jsdelivr.com/terms/privacy-policy-jsdelivr-net" target="_blank" rel="noopener noreferrer">jsDelivr’s privacy policy</a>. Local processing does not mean that visiting a page makes no network requests.</p>');
fs.writeFileSync(file, text);
