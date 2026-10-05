const fs=require('node:fs');
const source='scripts/site-generator/tool-examples.json';
const examples=JSON.parse(fs.readFileSync(source,'utf8'));
fs.copyFileSync('deployment/crawler-recheck-2026-10-05/qr-code.png','frontend/assets/examples/qr-check.png');
examples['qr-code-generator'].links=[{href:'/assets/examples/qr-check.png',label:'Inspect the recorded QR PNG'},{href:'/assets/examples/qr-print-check.pdf',label:'Print the QR check sheet'}];
fs.writeFileSync(source,JSON.stringify(examples,null,2)+'\n');
const file='scripts/site-generator/templates/submission/categories/generators.html';
const text=fs.readFileSync(file,'utf8').split('<!-- qr-check-evidence -->')[0].trimEnd();
fs.writeFileSync(file,text+'\n<!-- qr-check-evidence --><section class="info-section"><h2>Check the downloaded code before printing</h2><p>The <a href="/assets/examples/qr-check.png">recorded QR PNG</a> was independently decoded to exactly <code>https://nevco.online/</code>. Use the <a href="/assets/examples/qr-print-check.pdf">print check sheet</a> with its clear surrounding margin, then scan the printed copy with your phone and compare that exact destination. Computer decoding does not replace checking the final printed size, contrast, and camera result.</p></section>\n');
