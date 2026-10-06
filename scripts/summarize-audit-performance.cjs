const fs = require('node:fs');
const report = require('../docs/audits/full-audit-lighthouse-after.json');
const scores = report.pages.map(page => page.scores.performance).sort((a, b) => a - b);
const summary = { pages: report.pages.length, minimum: scores[0], median: scores[Math.floor(scores.length / 2)], maximum: scores.at(-1),
  errors: report.pages.filter(page => page.error || page.runtimeError),
  categories: Object.fromEntries(['accessibility','best-practices','seo'].map(name => [name, { minimum: Math.min(...report.pages.map(page => page.scores[name])), maximum: Math.max(...report.pages.map(page => page.scores[name])) }])),
  pdfPages: report.pages.filter(page => /\/tools\/(?:pdf-merge|image-to-pdf)/.test(page.route)).map(page => ({ route: page.route, scores: page.scores, metrics: page.metrics })),
  slowest: report.pages.filter(page => page.scores.performance < 90).map(page => ({ route: page.route, scores: page.scores, metrics: page.metrics })) };
fs.writeFileSync('docs/audits/full-audit-performance-summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
for (const page of report.pages.filter(page => page.scores.performance < 90)) {
  const index = report.pages.indexOf(page);
  const raw = JSON.parse(fs.readFileSync(`deployment/full-audit-2026-10-06/lighthouse-after/anviltools.vercel.app-${index}.json`, 'utf8'));
  console.log(JSON.stringify({ route: page.route, tasks: raw.audits['long-tasks']?.details?.items, scripts: raw.audits['bootup-time']?.details?.items,
    lcp: raw.audits['largest-contentful-paint-element']?.details?.items, mainThread: raw.audits['mainthread-work-breakdown']?.details?.items }));
}
