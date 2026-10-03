// Seeds two drafts from the owner's supplied articles. Never touches production.
const fs = require('node:fs');
const posts = JSON.parse(fs.readFileSync('deployment/editorial-2026-10-04/published-before.json', 'utf8')).posts;
const get = slug => { const post = posts.find(p => p.slug === slug); if (!post) throw Error(slug); return post.body; };
const write = (key, body) => {
  const file = `content/editorial/${key}.md`;
  if (fs.existsSync(file)) throw Error(`Preserve the edited draft: ${file} already exists.`);
  fs.writeFileSync(file, body.trim() + '\n');
  console.log(key, body.trim().split(/\s+/).length, 'draft words');
};
let email = get('best-practices-for-temporary-email-when-working-with-signups').split('# Frequently Asked Questions About Temporary Email for Signups')[0];
email = email.replace(/^# Temporary Email Best Practices for Signups\s*/, '').replace(/^# /gm, '## ').replace(/^---\s*$/gm, '');
const emailChapters = [
 ['## What Is a Temporary Email Address?', 'Choosing the right kind of inbox'],
 ['## The Most Important Rule:', 'Deciding how long access must last'],
 ['## 1. Use Temporary Email Only', 'Practical boundaries for disposable addresses'],
 ['## Temporary Email vs. Email Alias', 'Comparing aliases, secondary mailboxes, and temporary email'],
 ['## Security Best Practices', 'Privacy and account safety'],
 ['## Should You Use Temporary Email for Newsletters?', 'Choosing an address for common signup situations'],
 ['## Common Temporary Email Mistakes', 'Avoiding mistakes and completing a signup'],
 ['## What to Look for in a Temporary Email Service', 'Assessing a service and reviewing your setup']
];
for (const [marker, heading] of emailChapters) email = email.replace(marker, `# ${heading}\n\n${marker}`);
email += '\n\n' + fs.readFileSync('content/editorial/temporary-email-practical-sections.md', 'utf8');
write('temporary-email', email);

let background = get('best-practices-for-background-removal-when-working-with-design').split('# Background Removal FAQ')[0];
background = background.replace(/^# Background Removal Best Practices for Graphic Design\s*/, '').replace(/^# /gm, '## ');
const backgroundChapters = [
 ['## What Background Removal Really Means', 'Planning the image before removing its background'],
 ['## Understand the Subject Before Editing', 'Recognizing edges, materials, and shadows'],
 ['## Choose the Right Selection Method', 'Selecting and refining a subject'],
 ['## Hair Removal Best Practices', 'Handling difficult subjects'],
 ['## Matching the New Background', 'Building a believable composition'],
 ['## Design-System Consistency', 'Preparing reusable assets and exports'],
 ['## Use Paths for Precise Geometry', 'Refinement techniques and inspection'],
 ['## Workflow for Simple Product Cutouts', 'Workflows for different production tasks'],
 ['## Background Removal for Brand Systems', 'Using cutouts across a design system'],
 ['## Time Management', 'Production, asset management, and truthful editing'],
 ['## Review With Fresh Eyes', 'Reviewing the finished result']
];
for (const [marker, heading] of backgroundChapters) background = background.replace(marker, `# ${heading}\n\n${marker}`);
const asSections = body => body.trim().split(/\n\s*\n/).map((block, i, blocks) => {
  const text = block.trim();
  return !text.includes('\n') && text.length < 85 && text.split(/\s+/).length <= 12 && !/[.!?:;]$/.test(text) && i < blocks.length-1 ? `## ${text}` : text;
}).join('\n\n');
background += '\n\n# Preparing marketplace product images\n\n' + asSections(get('what-to-know-about-background-removal-for-marketplaces'));
background += '\n\n# A design handoff from source photograph to published graphic\n\n' + asSections(get('how-to-use-background-removal-for-design'));
write('background-removal', background);
