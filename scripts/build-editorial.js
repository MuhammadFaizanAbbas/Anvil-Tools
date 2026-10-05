// Build authored static guides and keep their links and backend template in sync.
const fs = require('node:fs');
const path = require('node:path');
const { renderArticle, escape } = require('../backend/src/lib/articles');
const { versionPublicStyles } = require('../backend/src/lib/public-assets');
const root = path.resolve(__dirname, '..');
const frontend = path.join(root, 'frontend');
const source = path.join(__dirname, 'site-generator');
const allGuides = JSON.parse(fs.readFileSync(path.join(source, 'editorial-guides.json'), 'utf8'));
const guides = allGuides.filter(guide => !Object.hasOwn(guide, 'retiredTo'));
const publishedLibrary = JSON.parse(fs.readFileSync(path.join(root, 'content/editorial/published-library.json'), 'utf8'));
for (const guide of allGuides.filter(guide => Object.hasOwn(guide, 'retiredTo'))) {
  const file = path.join(frontend, 'blog', `${guide.slug}.html`);
  // Authored sources remain in site-generator/editorial; retired pages are not public.
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
const troubleshooting = JSON.parse(fs.readFileSync(path.join(source, 'tool-troubleshooting.json'), 'utf8'));
const origin = 'https://anviltools.vercel.app';
const guideLink = guide => `/blog/${guide.slug}.html`;
const bySlug = new Map(guides.map(guide => [guide.slug, guide]));
function writeChanged(file, content) {
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== content) fs.writeFileSync(file, content);
}
for (const guide of guides) {
  const body = fs.readFileSync(path.join(source, 'editorial', `${guide.slug}.html`), 'utf8');
  const related = guide.related.map(slug => {
    const target = bySlug.get(slug);
    if (!target) throw Error(`Unknown related guide: ${slug}`);
    return `<li><a href="${guideLink(target)}">${escape(target.title)}</a></li>`;
  }).join('');
  const content = `<p class="article-meta">A practical guide from Anvil Tools, a VelloxTech project.</p>${body}<section class="article-resources"><h2>Try the tool</h2><p><a class="btn" href="/tools/${guide.tool}.html">Open ${escape(guide.tool.replaceAll('-', ' '))}</a></p><h2>Related guides</h2><ul>${related}</ul></section>`;
  const wordCount = body.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  let html = renderArticle({ slug: guide.slug, title: guide.title, excerpt: guide.excerpt, category_slug: guide.category, word_count: wordCount }, origin);
  // This HTML is authored in this repository, never accepted from a post record.
  html = html.replace('<div class="article-content"></div>', `<div class="article-content">${content}</div>`)
    .replaceAll(`${origin}/journal/${guide.slug}`, `${origin}${guideLink(guide)}`)
    .replace(/(href|src)="https:\/\/anviltools\.vercel\.app\/(assets\/[^" ]+|tools\/[^" ]+|blog\/[^" ]+|(?:about|contact|privacy-policy|terms-of-service|cookie-policy|disclaimer)\.html)"/g, '$1="/$2"')
    .replaceAll(`href="${origin}/"`, 'href="/"')
    .replaceAll('Developed by VelloxTech', 'Anvil Tools is a VelloxTech project.');
  // Restore the absolute canonical, which also has a blog path.
  html = html.replace(`rel="canonical" href="${guideLink(guide)}"`, `rel="canonical" href="${origin}${guideLink(guide)}"`);
  writeChanged(path.join(frontend, 'blog', `${guide.slug}.html`), html);
}
const cards = publishedLibrary.map(guide => `<article class="tool-card"><img class="guide-cover" src="/journal-images/${escape(guide.cover_image_id)}" alt="${escape(guide.cover_alt)}" loading="lazy"><h3><a href="/journal/${guide.slug}">${escape(guide.title)}</a></h3><p>${escape(guide.excerpt)}</p><a class="tool-link" href="/journal/${guide.slug}">Read guide &#8594;</a></article>`).join('\n');
const library = `<!-- editorial-library --><section class="editorial-library" aria-labelledby="editorial-title"><h2 id="editorial-title">Practical guides</h2><p>Step-by-step workflows, examples, and checks for the tools. Read any guide directly, then open its tool when you are ready.</p><div class="tool-grid" id="editorialGuideCards">${cards}</div></section><!-- /editorial-library -->`;
const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  if (['assets', 'admin-panel'].includes(entry.name)) return [];
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
});
for (const file of walk(frontend)) {
  let html = fs.readFileSync(file, 'utf8').replaceAll('Developed by VelloxTech', 'Anvil Tools is a VelloxTech project.');
  const noScript = '<noscript><style>.public-site .nav-toggle{display:none}.public-site .header-row{flex-wrap:wrap}.public-site .main-nav{display:flex;position:static;width:100%;flex-wrap:wrap;flex-direction:row;padding:8px 0;border:0;box-shadow:none}.public-site .main-nav a{width:auto}</style></noscript>';
  if (!html.includes('<noscript><style>.public-site .nav-toggle')) html = html.replace('</head>', `${noScript}</head>`);
  html = html.replace(/<span class="current-year"><\/span>/g, `<span class="current-year">${new Date().getUTCFullYear()}</span>`);
  if (file === path.join(frontend, 'blog', 'index.html')) html = html.replace(/<!-- editorial-library -->[\s\S]*?<!-- \/editorial-library -->/, library);
  const tool = path.basename(file, '.html');
  if (['pdf-merge', 'image-to-pdf'].includes(tool)) {
    html = html.replace(/(assets\/css\/tool-ux\.css)(?:\?[^" ]*)?"/g, '$1?v=20261005-pdf"')
      .replace(/(assets\/js\/tools\/(?:pdf-merge|image-to-pdf)\.js)(?:\?[^" ]*)?"/g, '$1?v=20261005-pdf"');
  }
  if (path.dirname(file) === path.join(frontend, 'tools') && troubleshooting[tool]) {
    const [heading, text] = troubleshooting[tool];
    html = html.replace(/<summary>What if the tool does not respond\?<\/summary><p>[^<]*<\/p>/, `<summary>${escape(heading)}</summary><p>${escape(text)}</p>`);
    html = html.replace(/<div class="content-guide"><!-- editorial-tool-link -->[\s\S]*?<!-- \/editorial-tool-link --><\/div>/, '')
      .replace(/<!-- editorial-tool-link -->[\s\S]*?<!-- \/editorial-tool-link -->/, '')
      .replaceAll('<div class="content-guide"></div>', '');
    const guide = publishedLibrary.find(item => item.tools.includes(tool));
    if (guide) {
      const section = `<!-- editorial-tool-link --><section class="info-section"><h2>Read the practical guide</h2><p><a href="/journal/${guide.slug}">${escape(guide.title)}</a></p><p>${escape(guide.excerpt)}</p></section><!-- /editorial-tool-link -->`;
      html = html.replace(/<div class="content-guide"><!-- editorial-tool-link -->[\s\S]*?<!-- \/editorial-tool-link --><\/div>/, '')
        .replace(/<!-- editorial-tool-link -->[\s\S]*?<!-- \/editorial-tool-link -->/, '')
        .replaceAll('<div class="content-guide"></div>', '');
      html = html.includes('</div><!-- /reading-surface -->')
        ? html.replace('</div><!-- /reading-surface -->', `${section}</div><!-- /reading-surface -->`)
        : html.replace('</main>', `<div class="content-guide">${section}</div></main>`);
    }
  }
  if (file === path.join(frontend, '404.html')) {
    // ErrorDocument keeps the missing URL in the browser, at any path depth.
    html = html.replace(/(href|src)="(?![a-z]+:|\/|#)([^"]+)"/gi, '$1="/$2"');
  }
  writeChanged(file, versionPublicStyles(html));
}
const templateDirectory = path.join(root, 'backend', 'src', 'templates');
fs.mkdirSync(templateDirectory, { recursive: true });
writeChanged(path.join(templateDirectory, 'blog.html'), fs.readFileSync(path.join(frontend, 'blog', 'index.html'), 'utf8')
  .replace(/(href|src)="\.\.\/(assets\/[^" ]+)"/g, '$1="/$2"')
  // The API also renders for cPanel hosts that upload assets separately. CSS
  // discovers fonts when available; avoid preloading files before that upload.
  .replace(/<!-- local-font-preload -->[\s\S]*?<!-- \/local-font-preload -->/, ''));
console.log(`Built ${guides.length} static guides, tool links, and the server-rendered blog template.`);
