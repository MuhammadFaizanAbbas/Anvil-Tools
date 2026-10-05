// Read-only public checks: no account tokens, database writes, or seller-file edits.
const fs = require('node:fs');
const { createHash } = require('node:crypto');
const { renderMarkdown } = require('../backend/src/lib/editorial-markdown');
const library = require('../content/editorial/published-library.json');
const report = { checkedAt: new Date().toISOString(), checks: [], articles: [],
  accountVerification: 'Not observable from public HTTP responses; owner account access required.' };
const md5 = value => createHash('md5').update(value).digest('hex');
async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  return { status: response.status, body: await response.text(), headers: response.headers };
}
(async () => {
  const paths = ['/', '/privacy-policy.html', '/cookie-policy.html', '/assets/js/recommendations.js',
    '/assets/js/tools/pdf-merge.js?v=20261005-pdf', '/assets/js/tools/image-to-pdf.js?v=20261005-pdf',
    ...['background-removal-input', 'background-removal-output', 'background-removal-example', 'temporary-email-example', 'pdf-ordering-example'].map(name => `/assets/images/editorial/${name}.png`), '/ads.txt'];
  await Promise.all(['https://nevco.online', 'https://anviltools.vercel.app'].map(async origin => {
    const outcomes = await Promise.allSettled(paths.map(path => read(origin + path)));
    outcomes.forEach((outcome, index) => {
      const check = { origin, path: paths[index] };
      if (outcome.status === 'rejected') check.error = outcome.reason.message;
      else {
        const { status, body, headers } = outcome.value;
        check.status = status;
        check.contentType = headers.get('content-type');
        if (check.path === '/assets/js/recommendations.js') {
          check.correctArticleArrow = /Read article (?:\\u2192|→)/.test(body);
          check.literalQuestionMark = body.includes('Read article ?');
        } else if (check.path.endsWith('policy.html')) {
          check.hasFutureGoogleDisclosure = body.includes('If Google advertising is introduced');
          check.advertisingDisabled = /Advertising and automatic browser analytics are (?:currently )?disabled/.test(body);
          check.certifiedConsentDisclosure = body.includes('Google-certified consent management platform');
        } else if (check.path === '/') {
          check.advertisingScriptPresent = /<script\b[^>]*src=["'][^"']*(?:adsbygoogle|fundingchoices|\/ads\.js|\/cmp\.js)/i.test(body);
          check.publicVerificationTagPresent = /<meta\b[^>]*name=["'](?:google-adsense-account|google-site-verification)["']/i.test(body);
        } else if (check.path === '/ads.txt') {
          check.bodySha256 = createHash('sha256').update(body).digest('hex');
          check.modifiedByThisCheck = false;
        }
      }
      report.checks.push(check);
    });
  }));
  const results = await Promise.allSettled(library.map(async guide => {
    const response = await read(`https://anvil-tools-backend.vercel.app/api/public/posts/${guide.slug}`);
    if (response.status !== 200) throw Error(`Article returned ${response.status}`);
    const post = JSON.parse(response.body);
    const prepared = fs.readFileSync(`content/editorial/${guide.bodyFile}`, 'utf8').replace(/\r\n?/g, '\n').trim();
    const rendered = renderMarkdown(post.body, { title: post.title });
    const text = rendered.html.replace(/<[^>]+>/g, ' ').replace(/&(?:#\d+|#x[0-9a-f]+|[a-z]+);/gi, ' ').trim();
    return { slug: guide.slug, liveWords: text.split(/\s+/).filter(part => /[\p{L}\p{N}]/u.test(part)).length,
      liveHeadings: rendered.headings.length, bodyMatchesPrepared: md5(post.body) === md5(prepared) };
  }));
  results.forEach((outcome, index) => report.articles.push(outcome.status === 'fulfilled' ? outcome.value : { slug: library[index].slug, error: outcome.reason.message }));
  report.checks.sort((a, b) => `${a.origin}${a.path}`.localeCompare(`${b.origin}${b.path}`));
  fs.writeFileSync('docs/audits/adsense-live-readiness.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
