// Rasterize the existing brand mark; keep these public URLs stable.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const frontend = path.resolve(__dirname, '../frontend');
const mark = path.join(frontend, 'assets/images/anvil-mark.svg');
const raster = size => sharp(mark, { density: 384 }).resize(size, size).png().toBuffer();

async function build() {
  const sizes = [16, 32, 48, 64, 128, 256];
  const images = await Promise.all(sizes.map(raster));
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2); // ICO, rather than a cursor.
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach((png, index) => {
    const entry = 6 + 16 * index;
    header[entry] = sizes[index] === 256 ? 0 : sizes[index];
    header[entry + 1] = header[entry];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await fs.writeFile(path.join(frontend, 'favicon.ico'), Buffer.concat([header, ...images]));
  await fs.writeFile(path.join(frontend, 'assets/images/favicon-48.png'), images[2]);
  await fs.writeFile(path.join(frontend, 'assets/images/apple-touch-icon.png'), await raster(180));
  console.log('Built favicon-48.png (48x48), apple-touch-icon.png (180x180), and favicon.ico (16–256px) from anvil-mark.svg.');
}

build().catch(error => { console.error(error); process.exitCode = 1; });
