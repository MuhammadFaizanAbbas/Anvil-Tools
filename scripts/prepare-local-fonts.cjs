// Cache the existing open-license font families and their licenses on this site.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const folder = 'frontend/assets/fonts';
(async () => {
  fs.mkdirSync(folder, { recursive: true });
  const url = 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Space+Grotesk:wght@300..700&display=swap';
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' }, signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200);
  const css = await response.text(), sources = [];
  // Avoid a late font swap and a second layout on slow first visits. Preloaded
  // fonts are used when ready; otherwise the existing system fallback stays put.
  let localCss = css.replace(/font-display:\s*swap;/g, 'font-display: optional;');
  for (const match of css.matchAll(/\/\* ([^*]+) \*\/\s*(@font-face\s*\{[^}]+\})/g)) {
    const family = match[2].match(/font-family: '([^']+)'/)[1];
    const source = match[2].match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/)[1];
    const name = family.toLowerCase().replaceAll(' ', '-') + '-' + match[1] + '.woff2';
    const file = path.join(folder, name);
    if (!fs.existsSync(file)) {
      const font = await fetch(source, { signal: AbortSignal.timeout(30000) });
      assert.equal(font.status, 200);
      const bytes = Buffer.from(await font.arrayBuffer());
      assert.equal(bytes.toString('ascii', 0, 4), 'wOF2', 'Expected WOFF2 font');
      fs.writeFileSync(file, bytes);
    }
    localCss = localCss.replace(source, '../fonts/' + name);
    sources.push({ family, subset: match[1], file: name, source, bytes: fs.statSync(file).size });
  }
  assert.equal(sources.length, 10);
  for (const family of ['inter', 'spacegrotesk']) {
    const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`, { signal: AbortSignal.timeout(30000) });
    assert.equal(license.status, 200);
    const text = await license.text();
    assert.match(text, /SIL OPEN FONT LICENSE/);
    fs.writeFileSync(`${folder}/${family}-OFL.txt`, text.replace(/[ \t]+$/gm, ''));
  }
  fs.writeFileSync(`${folder}/sources.json`, JSON.stringify({ cssSource: url, licenses: 'SIL Open Font License 1.1; bundled alongside fonts', sources }, null, 2) + '\n');
  const style = 'frontend/assets/css/style.css';
  const current = fs.readFileSync(style, 'utf8').replace(/\/\* local-fonts \*\/[\s\S]*?\/\* \/local-fonts \*\/\s*/, '');
  fs.writeFileSync(style, '/* local-fonts */\n' + localCss.trim() + '\n/* /local-fonts */\n' + current);
  console.log(`Hosted ${sources.length} font subsets with both licenses; external font CSS removed from the critical path.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
