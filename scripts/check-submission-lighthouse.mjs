// Representative mobile lab measurements, not AdSense or field CWV scores.
import fs from 'node:fs';
import lighthouse from '../deployment/lighthouse-review/node_modules/lighthouse/core/index.js';
import { launch } from '../deployment/lighthouse-review/node_modules/chrome-launcher/dist/index.js';

const origin = new URL(process.argv[2] || 'https://anviltools.vercel.app').origin;
const routeArgument = process.argv.find(argument => argument.startsWith('--routes='));
const routes = routeArgument ? routeArgument.slice('--routes='.length).split(',') : ['/', '/tools/word-counter.html', '/tools/background-remover.html', '/journal/best-practices-for-background-removal-when-working-with-design'];
const folder = 'deployment/page-review-2026-10-05/lighthouse';
fs.mkdirSync(folder, { recursive: true });
const summary = { checkedAt: new Date().toISOString(), origin, environment: 'Lighthouse 12.8.2, Edge headless, default mobile simulation',
  limits: ['Lab scores vary with network, machine load, and tool versions.', 'Representative pages only; not an all-page performance or field Core Web Vitals result.', 'Tool processing after user input, screen readers, and future ad layouts are outside this navigation measurement.', 'No score is an AdSense approval score.'], pages: [] };

for (let index = 0; index < routes.length; index++) {
  const route = routes[index];
  let chrome;
  try {
    chrome = await launch({ chromePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', chromeFlags: ['--headless', '--disable-gpu'] });
    const result = await lighthouse(origin + route, { port: chrome.port, logLevel: 'error', output: ['html', 'json'], onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
    const lhr = result.lhr;
    fs.writeFileSync(`${folder}/${new URL(origin).hostname}-${index}.html`, result.report[0]);
    fs.writeFileSync(`${folder}/${new URL(origin).hostname}-${index}.json`, result.report[1]);
    const failed = Object.values(lhr.audits).filter(audit => audit.score !== null && audit.score < 1);
    const page = { route, lighthouseVersion: lhr.lighthouseVersion, finalUrl: lhr.finalDisplayedUrl, warnings: lhr.runWarnings, runtimeError: lhr.runtimeError,
      scores: Object.fromEntries(Object.entries(lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)])),
      metrics: Object.fromEntries(['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'].map(key => [key, { value: lhr.audits[key]?.numericValue, display: lhr.audits[key]?.displayValue }])),
      findings: failed.map(audit => ({ id: audit.id, title: audit.title, score: audit.score, display: audit.displayValue, savingsMs: audit.details?.overallSavingsMs,
        items: Array.isArray(audit.details?.items) ? audit.details.items.slice(0, 5).map(item => ({ url: item.url, wastedMs: item.wastedMs, wastedBytes: item.wastedBytes, totalBytes: item.totalBytes, node: item.node?.snippet, subItems: item.subItems })) : undefined })) };
    summary.pages.push(page);
    console.log(JSON.stringify({ route, scores: page.scores, findings: page.findings.map(finding => finding.id), warnings: page.warnings, runtimeError: page.runtimeError }));
  } catch (error) {
    summary.pages.push({ route, error: error.message });
    console.error(`Lighthouse failed for ${route}: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (chrome) await chrome.kill();
    fs.writeFileSync(`docs/audits/submission-lighthouse-${new URL(origin).hostname}.json`, JSON.stringify(summary, null, 2) + '\n');
  }
}
