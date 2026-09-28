// Offline syntax and asset checks; never creates third-party mail accounts.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(directory, entry.name);
    return entry.isDirectory() ? files(name) : [name];
  });
}
let checked = 0;
for (const file of ['server.js', ...files('backend'), ...files('frontend'), 'scripts/serve-frontend.js']) {
  if (file.endsWith('.js')) {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
    checked++;
  }
  if (file.endsWith('.html')) {
    const html = fs.readFileSync(file, 'utf8');
    for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      const source = match[1].match(/src="([^"]+)"/);
      if (source && !/^https?:/.test(source[1])) {
        const target = source[1].startsWith('/') ? path.join('frontend', source[1]) : path.resolve(path.dirname(file), source[1]);
        if (!fs.existsSync(target)) throw new Error(`Missing script ${source[1]} in ${file}`);
      } else if (!source && !/type="(?:application\/ld\+json|module)"/.test(match[1])) {
        new vm.Script(match[2], { filename: file });
      }
    }
    checked++;
  }
}
console.log(`Verified syntax and script references in ${checked} files.`);
