// Synchronize authored sources; running this does not deploy or publish content.
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, value) => { if (read(file) !== value) fs.writeFileSync(file, value); };
const walk = folder => fs.readdirSync(folder, { withFileTypes: true }).flatMap(entry => {
  if (['assets', 'admin-panel'].includes(entry.name)) return [];
  const file = path.join(folder, entry.name);
  return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
});
for (const file of [...walk('frontend'), ...walk('scripts/site-generator/templates')]) {
  let html = read(file).replace(/(<meta\b[^>]*(?:name="(?:description|twitter:description)"|property="og:description")[^>]*content=")([^"]*)(")/gi,
    (_, start, description, end) => start + (description.includes('Anvil Tools') ? description : `Anvil Tools: ${description}`) + end);
  if (file.replaceAll('\\', '/') === 'frontend/blog/index.html') {
    html = html.replace(/<!-- blog-pagination -->[\s\S]*?<!-- \/blog-pagination -->/, '<!-- blog-pagination --><nav class="blog-pagination" id="blogPagination" aria-label="Article pages" hidden></nav><!-- /blog-pagination -->')
      .replace(/<div class="btn-row"><button class="btn" id="blogsRetry"[^>]*>Try again<\/button><\/div>/, '<div class="btn-row" id="blogRetrySlot"><!-- blog-retry --></div>');
  }
  if (file.endsWith('about.html')) {
    html = html.replace(/<!-- review-process -->[\s\S]*?<!-- \/review-process -->/, '<!-- review-process --><section id="editorial-testing"><h3>Editorial &amp; testing</h3><p>VelloxTech maintains Anvil Tools and its guides. Tool descriptions and articles include AI-assisted writing and editing. We use non-sensitive text, synthetic files, and clearly attributed licensed images for reproducible examples.</p><p>Our recorded experiments list the input, browser, test date, observed output, and limitations. Screenshots show actual tool runs. Data transformations are compared with fixed expected values; PDF downloads are reopened to check page count and dimensions. Automated browser and layout checks do not cover every device, document, or external service.</p><p>Published guides link to their fixtures and results so you can repeat the checks. Report a correction through the <a href="contact.html">contact page</a> with a small non-sensitive example. We do not claim independent certification or invent individual reviewer names.</p></section><!-- /review-process -->');
  }
  write(file, html);
}
for (const file of ['vercel.json', 'frontend/vercel.json']) {
  const config = JSON.parse(read(file));
  if (!config.routes.some(route => route.has?.some(condition => condition.value === 'www.nevco.online'))) {
    config.routes.unshift({ src: '^/(.*)$', has: [{ type: 'host', value: 'www.nevco.online' }], status: 308, headers: { Location: 'https://nevco.online/$1' } });
  }
  write(file, JSON.stringify(config, null, 2) + '\n');
}
console.log('Updated branding, blog slots, editorial disclosure, and hostname redirects.');
