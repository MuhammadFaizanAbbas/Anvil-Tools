// October 7 review: update authored sources as well as their public copies.
// This prepares files only; it never deploys or publishes database content.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { publicSecurityHeaders, backgroundCsp, hsts } = require('../backend/src/lib/public-security');
const read = file => fs.readFileSync(file, 'utf8');
const write = (file, text) => { if (read(file) !== text) fs.writeFileSync(file, text); };
const replacements = new Map([
  ["Get a disposable inbox in one click for signups you don't want landing in your real email.", 'Receive non-sensitive messages for authorized testing or where disposable addresses are permitted.'],
  ['Temporary Email Best Practices for Signups', 'Temporary Email for Authorized Testing and Permitted Messages'],
  ['Choose the right inbox for a signup, understand temporary mail limits, protect account recovery, and work through real delivery and verification problems.', 'Test email receipt in applications you own or are authorized to test, respect address restrictions, and understand provider retention and recovery limits.'],
  ['Choose an inbox for a permitted signup', 'Test permitted email receipt'],
  ['Tools for handling email addresses without exposing your real inbox.', 'Email receipt for authorized testing and permitted non-sensitive messages.'],
  ['Test a newsletter signup using a disposable address, then return to this tab to read the confirmation.', 'Send a non-sensitive delivery check from an application or mailbox you own or have permission to test, then return to this tab to inspect it.'],
  ['Testing what a signup or password-reset email looks like while building a website.', 'Checking email templates and delivery using synthetic accounts in an application you own or have permission to test.'],
  ['Signing up for a newsletter, download, or free trial you only need once.', 'Receiving a non-sensitive one-time message when the receiving service permits disposable addresses.'],
  ['Keeping your real inbox free of promotional mail from a one-time purchase or forum account.', 'Checking authorized test messages without using customer data or real recovery credentials.'],
  ['This tool is built for receiving mail only, matching how most disposable-email use cases work: verifying a signup, not carrying on a conversation.', 'This tool receives messages only. It does not send replies or provide lasting access to an account.'],
  ['User Agent Generator', 'User-Agent String Reference'],
  ['Choose fixed browser and bot user-agent strings for parser and request-header tests.', 'Reference strings for parser and request-header tests in applications you own or are authorized to test.'],
  ["Copy it and paste it into your browser's device toolbar override, an API testing tool, or your own test scripts.", 'Copy a sample into a parser fixture or request-header test for an application you own or are authorized to test.'],
  ['Checking how a page renders for a search engine crawler like Googlebot.', 'Checking how your own parser handles a crawler sample without granting it special access.'],
  ['Testing that a responsive site correctly detects mobile versus desktop.', 'Testing recognized and unfamiliar client strings in your own application. Use real devices to test responsive rendering.'],
  ['Reproducing a bug report that only happens on a specific browser or device.', 'Reproducing a reported parser issue with a fixed input string. Test real browsers separately when behavior matters.'],
  ['Are these real, current user-agent strings?', 'What versions do the samples represent?'],
  ["They're realistic examples of the current format used by each browser or crawler, meant for testing rather than as a live, constantly updated database.", 'The browser examples include fixed Chrome 126, Firefox 127, and Safari 17.5 strings. They are parser fixtures, not a current browser-version directory.'],
  ['Can I use this to scrape sites while hiding my identity?', 'What is an authorized use of these samples?'],
  ["This tool is meant for legitimate testing of your own sites and code. Using a fake user agent to evade a site's terms of service or access controls is a separate matter between you and that site's policies.", 'Use them only to test applications you own or have permission to test. Do not use them to evade access restrictions, misrepresent crawler identity, or generate deceptive traffic.'],
  ["No. This tool only displays reference text for you to copy. To actually change what your browser sends, use your browser's built-in developer tools or a testing proxy.", 'No. Copying a sample only gives you text. It does not change your browser, emulate a device, or establish a verified crawler identity.']
]);
const temporaryIntro = 'Use this only for authorized testing of an application you own or have permission to test, or for a non-sensitive message when the receiving service permits disposable addresses. It is not an account-recovery, anonymity, or identity-verification bypass service. Website inbox access expires after one hour; this does not establish deletion at the mail provider.';
const agentIntro = 'Use these fixed browser and crawler strings as parser fixtures or request headers in an application you own or have permission to test. Copying a string does not change your browser, reproduce device behavior, or prove crawler identity. Respect access restrictions and verify actual crawler requests separately.';
function revise(text) {
  for (const [before, after] of replacements) text = text.replaceAll(before, after);
  text = text.replace(/href="(?:\.\.\/|\/)index\.html([?#][^"]*)?"/g, (_, suffix = '') => `href="/${suffix}"`)
    .replace(/(<a\b[^>]*href="[^"]*blog\/index\.html"[^>]*>)(?:Blog|Blogs)(<\/a>)/g, '$1Guides &amp; experiments$2');
  return text;
}
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  if (['assets', 'admin-panel'].includes(entry.name)) return [];
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : file.endsWith('.html') ? [file] : [];
});
for (const file of [...walk('frontend'), ...walk('scripts/site-generator/templates'), 'scripts/site-generator/build_site_data.py', 'frontend/assets/js/site-catalog.js']) {
  let text = revise(read(file));
  if (file.endsWith(path.join('blog', 'article.html'))) text = text.replace('<a href="/">Blogs</a>', '<a href="/blog/index.html">Guides &amp; experiments</a>');
  if (file.endsWith('privacy-policy.html')) text = text.replace('<h2>Workspace accounts and temporary mail</h2>', '<h2 id="temporary-mail">Workspace accounts and temporary mail</h2>');
  if (file.endsWith('temp-mail.html')) {
    text = text.replace(/<p class="lede">[\s\S]*?<\/p>/, `<p class="lede">${temporaryIntro}</p>`);
    if (!text.includes('id="tm-provider-warning"')) text = text.replace(/(<p id="tm-expiry"[^>]*>.*?<\/p>)/, '$1<p id="tm-provider-warning" class="small-note">Guerrilla Mail processes received messages. Website access expiry or a new address does not prove deletion at the provider. Use only non-sensitive test messages. <a href="/privacy-policy.html#temporary-mail">Temporary-mail privacy details</a>.</p>');
  }
  if (file.endsWith('user-agent-generator.html')) text = text.replace('<h1>User-Agent String Reference</h1>', '<h1>User-Agent String Reference for Authorized Testing</h1>')
    .replace(/<p class="lede">[\s\S]*?<\/p>/, `<p class="lede">${agentIntro}</p>`);
  if (file.endsWith('build_site_data.py')) {
    text = text.replace(/intro="Use this when a site demands[^\n]+/, `intro="${temporaryIntro}",`)
      .replace(/intro="A quick reference list[^\n]+/, `intro="${agentIntro}",`);
  }
  if (file === path.join('frontend', 'blog', 'index.html') || file.endsWith('templates/blog.html')) text = text
    .replace(/<title>[^<]*<\/title>/, '<title>Guides &amp; Experiments | Anvil Tools</title>')
    .replace(/content="(?:(?:Anvil Tools: )?Practical articles on getting more out of the tools on Anvil Tools\.|Blogs and practical tips from Anvil Tools\.)"/g, 'content="Anvil Tools guides and recorded experiments with reproducible examples, downloads, and practical checks for browser tools."')
    .replace(/<h1>Blog<\/h1>/, '<h1>Guides &amp; experiments</h1>')
    .replace('<span>Blog</span>', '<span>Guides &amp; experiments</span>')
    .replace(/property="og:title" content="Blogs? \| Anvil Tools"/, 'property="og:title" content="Guides &amp; Experiments | Anvil Tools"')
    .replace('aria-label="All blogs"', 'aria-label="Guides and experiments"');
  write(file, text);
}
const libraryFile = 'content/editorial/published-library.json';
const library = JSON.parse(revise(read(libraryFile)));
fs.writeFileSync(libraryFile, JSON.stringify(library, null, 2) + '\n');
const experimentsFile = 'content/editorial/experiments.json';
const experiments = JSON.parse(read(experimentsFile)).map(item => ({ ...item, published_at: item.published_at || '2026-10-06T00:00:00+05:00' }));
fs.writeFileSync(experimentsFile, JSON.stringify(experiments, null, 2) + '\n');
const reviews = Object.fromEntries([...library, ...experiments].map(item => [item.slug, {
  title: item.title, excerpt: item.excerpt, reviewed_at: '2026-10-07',
  body_sha256: createHash('sha256').update(read(`content/editorial/${item.bodyFile}`).replace(/\r\n?/g, '\n').trim()).digest('hex')
}]));
fs.writeFileSync('backend/src/lib/article-reviews.json', JSON.stringify(reviews, null, 2) + '\n');
for (const file of ['vercel.json', 'frontend/vercel.json']) {
  const config = JSON.parse(read(file));
  for (const route of config.routes) if (route.headers?.['Content-Security-Policy']) Object.assign(route.headers, publicSecurityHeaders, { 'Strict-Transport-Security': hsts });
  const backgroundRoute = { src: '^/tools/background-remover\\.html/?$', headers: { 'Content-Security-Policy': backgroundCsp }, continue: true };
  const existingBackground = config.routes.findIndex(route => route.src === backgroundRoute.src);
  if (existingBackground >= 0) config.routes[existingBackground] = backgroundRoute;
  else config.routes.splice(config.routes.findIndex(route => route.headers?.['Content-Security-Policy']) + 1, 0, backgroundRoute);
  if (!config.routes.some(route => route.src === '^/index\\.html/?$')) config.routes.unshift({ src: '^/index\\.html/?$', status: 308, headers: { Location: '/' } });
  if (!config.routes.some(route => route.src === '^/journal/?$')) config.routes.unshift({ src: '^/journal/?$', status: 308, headers: { Location: '/blog/index.html' } });
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
const postsScript = 'frontend/assets/js/published-posts.js';
write(postsScript, read(postsScript).replace('No blogs published yet.', 'No articles published yet.'));
const apacheFile = 'frontend/.htaccess';
write(apacheFile, read(apacheFile).replace(/Header always set Content-Security-Policy "[^"]*"/, `Header always set Content-Security-Policy "${publicSecurityHeaders['Content-Security-Policy']}"`));
const backgroundHeader = `  Header always set Content-Security-Policy "${backgroundCsp}" "expr=%{THE_REQUEST} =~ m#\\s/+tools/background-remover\\.html/?[?\\s]#"`;
let apache = read(apacheFile);
if (apache.includes("'unsafe-eval'")) apache = apache.replace(/^  Header always set Content-Security-Policy .*expr=.*background-remover.*$/m, backgroundHeader);
else apache = apache.replace(/(  Header always set Content-Security-Policy "[^"]*")/, '$1\n  # Dynamic JS is required only by the image-processing bundle.\n' + backgroundHeader);
write(apacheFile, apache);
fs.mkdirSync('deployment/adsense-audit-2026-10-07/preview', { recursive: true });
console.log('Prepared October 7 tool wording, shared editorial hub, reviewed-content hashes, redirects, and security headers.');
