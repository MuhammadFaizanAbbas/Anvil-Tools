const fs = require('node:fs');
const path = require('node:path');
const { versionPublicStyles } = require('../backend/src/lib/public-assets');
function visit(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) { visit(file); continue; }
    if (file.endsWith('.html')) {
      const text = fs.readFileSync(file, 'utf8');
      const updated = versionPublicStyles(text);
      if (updated !== text) fs.writeFileSync(file, updated);
    }
  }
}
visit('frontend'); visit('backend/src/templates');
