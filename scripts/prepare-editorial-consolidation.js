// Read-only with respect to production. Creates a reviewable local release plan.
const fs = require('node:fs');
const path = require('node:path');
const snapshot = JSON.parse(fs.readFileSync('deployment/editorial-2026-10-04/published-before.json', 'utf8'));
const metadata = JSON.parse(fs.readFileSync('deployment/editorial-2026-10-04/database-metadata-before.json', 'utf8'));
const directory = 'content/editorial';
fs.mkdirSync(directory, { recursive: true });
const definitions = [
  { key: 'temporary-email', slug: 'best-practices-for-temporary-email-when-working-with-signups', title: 'Temporary Email Best Practices for Signups', category: 'email-tools', match: /temporary-email|keep-main-inbox/, tools: ['temp-mail'] },
  { key: 'background-removal', slug: 'best-practices-for-background-removal-when-working-with-design', title: 'Background Removal for Design and Product Photography', category: 'image-tools', match: /background-removal|removing-a-photo-background|prepare-product-photos/, tools: ['background-remover'] },
  { key: 'pdf-workflows', slug: 'simple-pdf-workflow-without-software', title: 'Better PDFs: From Images to Finished Documents', category: 'pdf-tools', match: /image-to-pdf|merge-pdf|simple-pdf-workflow/, tools: ['image-to-pdf', 'pdf-merge'] },
  { key: 'developer-data', slug: 'small-tools-that-save-developers-time', title: 'Make Sense of Your Data: JSON, Base64, and Developer Tools', category: 'dev-tools', match: /json-formatter|base64|why-json-fails|small-tools-that-save-developers-time/, tools: ['json-formatter', 'base64-tool', 'csv-to-json', 'jwt-decoder', 'url-encoder-decoder', 'hash-generator', 'unix-timestamp-converter', 'uuid-generator', 'user-agent-generator', 'unit-converter'] },
  { key: 'passwords', slug: 'build-a-password-you-can-trust', title: 'Passwords, Passkeys, and Account Recovery: A Practical Guide', category: 'generators', match: /password-generator|build-a-password-you-can-trust/, tools: ['password-generator'] },
  { key: 'qr-codes', slug: 'make-a-qr-code-that-scans-every-time', title: 'QR Codes That Work: Design, Printing, and Destination Checks', category: 'generators', match: /qr-code/, tools: ['qr-code-generator'] },
  { key: 'color-palettes', slug: 'how-to-use-color-palette-for-web-design', title: 'Color Palettes for Accessible Websites and Consistent Design', category: 'generators', match: /color-palette/, tools: ['color-palette-generator'] },
  { key: 'writing-and-text', slug: 'word-count-targets-for-blog-posts-emails-captions', title: 'Practical Writing and Text Editing for the Web', category: 'text-tools', match: /word-count-targets/, tools: ['word-counter', 'text-case-converter', 'text-diff-checker'] }
];
const assigned = new Set();
const guides = definitions.map(({ match, ...definition }) => {
  const sources = snapshot.posts.filter(post => match.test(post.slug));
  if (!sources.some(post => post.slug === definition.slug)) throw Error(`Canonical article missing: ${definition.slug}`);
  for (const post of sources) {
    if (assigned.has(post.slug)) throw Error(`Overlapping assignment: ${post.slug}`);
    assigned.add(post.slug);
  }
  return { ...definition, bodyFile: `${definition.key}.md`, minimumWords: 10001, sources: sources.map(post => ({ slug: post.slug, id: metadata.find(row => row.slug === post.slug)?.id, expectedUpdatedAt: metadata.find(row => row.slug === post.slug)?.updated_at })) };
});
if (assigned.size !== snapshot.posts.length) throw Error(`Unassigned articles: ${snapshot.posts.filter(post => !assigned.has(post.slug)).map(post => post.slug).join(', ')}`);
const plan = { version: 1, sourceExportedAt: snapshot.exportedAt, sourceCount: snapshot.posts.length, minimumWords: 10001, guides };
fs.writeFileSync(path.join(directory, 'consolidation-plan.json'), JSON.stringify(plan, null, 2) + '\n');
console.log(`Prepared ${guides.length} guides accounting for all ${assigned.size} existing articles; no database changes.`);
