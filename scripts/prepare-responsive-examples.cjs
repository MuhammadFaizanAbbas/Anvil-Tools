// Optimize delivery of recorded screenshots; downloadable PNG evidence stays intact.
const fs = require('node:fs');
const sharp = require('sharp');
(async () => {
  const assets = 'frontend/assets/images/editorial', manifest = {};
  for (const name of ['background-removal-example', 'temporary-email-example', 'pdf-ordering-example']) {
    const input = `${assets}/${name}.png`, metadata = await sharp(input).metadata();
    const widths = [...new Set([480, 960, metadata.width].filter(width => width <= metadata.width))];
    const candidates = [];
    for (const width of widths) {
      const file = `${assets}/${name}-${width}.webp`;
      await sharp(input).resize({ width }).webp({ quality: 90 }).toFile(file);
      candidates.push({ src: '/' + file.replace(/^frontend\//, ''), width });
    }
    manifest['/assets/images/editorial/' + name + '.png'] = { width: metadata.width, height: metadata.height, candidates };
  }
  fs.writeFileSync('backend/src/lib/editorial-images.json', JSON.stringify(manifest, null, 2) + '\n');
  console.log('Built responsive WebP copies for three recorded screenshots; original PNGs unchanged.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
