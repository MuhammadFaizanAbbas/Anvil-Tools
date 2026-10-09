// Check links in canonical local sources for currently published articles.
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const library = JSON.parse(fs.readFileSync(path.join(root, 'content/editorial/published-library.json'), 'utf8'));
const internal = new Map();
const external = new Map();

for (const post of library) {
  const body = fs.readFileSync(path.join(root, 'content/editorial', post.bodyFile), 'utf8');
  for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const href = match[1];
    const target = /^https:\/\//i.test(href) ? external : internal;
    if (!target.has(href)) target.set(href, []);
    target.get(href).push(post.slug);
  }
}

const internalResults = [...internal].map(([href, slugs]) => {
  if (href.startsWith('#')) return { href, slugs, ok: true, kind: 'anchor' };
  if (!href.startsWith('/')) return { href, slugs, ok: false, kind: 'unsupported-relative-link' };
  const pathname = href.split(/[?#]/)[0];
  if (pathname.startsWith('/journal/')) {
    const slug = decodeURIComponent(pathname.slice('/journal/'.length));
    return { href, slugs, ok: library.some((post) => post.slug === slug), kind: 'journal' };
  }
  if (pathname.startsWith('/blog/')) {
    return { href, slugs, ok: fs.existsSync(path.join(root, 'frontend', pathname)), kind: 'static-blog' };
  }
  return { href, slugs, ok: fs.existsSync(path.join(root, 'frontend', pathname)), kind: 'static-file' };
});

const externalEntries = [...external];
const externalResults = [];
let cursor = 0;
async function worker() {
  while (cursor < externalEntries.length) {
    const [href, slugs] = externalEntries[cursor++];
    try {
      const response = await fetch(href, {
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
        headers: { 'user-agent': 'AnvilToolsEditorialAudit/1.0' },
      });
      externalResults.push({ href, slugs, ok: response.ok, status: response.status, final_url: response.url });
      await response.body?.cancel();
    } catch (error) {
      externalResults.push({ href, slugs, ok: false, error: error.message });
    }
  }
}

(async () => {
  await Promise.all(Array.from({ length: 6 }, worker));
  externalResults.sort((left, right) => left.href.localeCompare(right.href));
  const report = {
    checked_at: new Date().toISOString(),
    published_posts: library.length,
    internal_links: internalResults.length,
    external_links: externalResults.length,
    broken_internal: internalResults.filter((result) => !result.ok),
    automated_external_fetch_exceptions: externalResults.filter((result) => !result.ok),
    internal_results: internalResults,
    external_results: externalResults,
  };
  fs.writeFileSync(path.join(root, 'docs/audits/published-link-audit.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    published_posts: report.published_posts,
    internal_links: report.internal_links,
    broken_internal: report.broken_internal.length,
    external_links: report.external_links,
    automated_external_fetch_exceptions: report.automated_external_fetch_exceptions.length,
  }));
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
