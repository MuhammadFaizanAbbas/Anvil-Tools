// Offline editorial audit for a snapshot created by export-published-review.cjs.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const snapshotArg = process.argv.find((argument) => argument.startsWith('--snapshot='));
const snapshotDirectory = path.resolve(root, snapshotArg ? snapshotArg.slice('--snapshot='.length) : 'deployment/published-review');
const manifest = JSON.parse(fs.readFileSync(path.join(snapshotDirectory, 'manifest.json'), 'utf8'));
const localLibrary = JSON.parse(fs.readFileSync(path.join(root, 'content/editorial/published-library.json'), 'utf8'));
const localBySlug = new Map(localLibrary.map((post) => [post.slug, post]));

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalizeBody = (value) => String(value || '').replace(/\r\n?/g, '\n').trim();
const words = (value) => String(value || '').trim().split(/\s+/).filter(Boolean);
const normalizeText = (value) => String(value || '').toLowerCase()
  .replace(/```[\s\S]*?```/g, ' ')
  .replace(/`[^`]*`/g, ' ')
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

function shingles(value, size = 7) {
  const tokens = normalizeText(value).split(/\s+/).filter(Boolean);
  const result = new Set();
  for (let index = 0; index <= tokens.length - size; index += 1) {
    result.add(tokens.slice(index, index + size).join(' '));
  }
  return result;
}

function jaccard(left, right) {
  let intersection = 0;
  const smaller = left.size <= right.size ? left : right;
  const larger = smaller === left ? right : left;
  for (const item of smaller) if (larger.has(item)) intersection += 1;
  return intersection / Math.max(1, left.size + right.size - intersection);
}

function sentences(value) {
  return normalizeBody(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\|.*\|$/gm, ' ')
    .replace(/^#{1,6}\s+.*$/gm, ' ')
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => normalizeText(sentence))
    .filter((sentence) => words(sentence).length >= 10);
}

function substantiveParagraphs(value) {
  return normalizeBody(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeText(paragraph))
    .filter((paragraph) => words(paragraph).length >= 25);
}

const sentenceOwners = new Map();
const paragraphOwners = new Map();
const articles = manifest.posts.map((post) => {
  const snapshotBody = normalizeBody(fs.readFileSync(path.resolve(snapshotDirectory, post.body_file), 'utf8'));
  const local = localBySlug.get(post.slug);
  const localFile = local?.bodyFile ? path.join(root, 'content/editorial', local.bodyFile) : null;
  const localBody = localFile && fs.existsSync(localFile) ? normalizeBody(fs.readFileSync(localFile, 'utf8')) : null;
  const body = localBody ?? snapshotBody;
  const headingMatches = [...body.matchAll(/^(#{1,6})\s+(.+)$/gm)];
  const markdownLinks = [...body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  const articleSentences = sentences(body);
  const withinCounts = new Map();
  for (const sentence of articleSentences) {
    withinCounts.set(sentence, (withinCounts.get(sentence) || 0) + 1);
    if (!sentenceOwners.has(sentence)) sentenceOwners.set(sentence, new Set());
    sentenceOwners.get(sentence).add(post.slug);
  }
  for (const paragraph of new Set(substantiveParagraphs(body))) {
    if (!paragraphOwners.has(paragraph)) paragraphOwners.set(paragraph, new Set());
    paragraphOwners.get(paragraph).add(post.slug);
  }

  const effective = local || post;
  const localBodySha256 = localBody === null ? null : sha256(localBody);

  const checks = {
    title_matches_h1: headingMatches[0]?.[2].trim() === effective.title,
    seo_title_at_most_65: String(effective.seo_title || '').length <= 65,
    excerpt_100_to_170: String(effective.excerpt || '').length >= 100 && String(effective.excerpt || '').length <= 170,
    seo_description_100_to_170: String(effective.seo_description || '').length >= 100 && String(effective.seo_description || '').length <= 170,
    at_least_1200_words: words(body).length >= 1200,
    at_least_five_h2s: headingMatches.filter((match) => match[1].length === 2).length >= 5,
    has_external_reference: markdownLinks.some((href) => /^https:\/\//i.test(href)),
    has_internal_link: markdownLinks.some((href) => /^\/(?:tools|journal|blog)\//.test(href)),
    no_placeholders: !/\b(?:TODO|TBD|lorem ipsum)\b/i.test(body),
    live_hash_matches_manifest: sha256(snapshotBody) === post.body_sha256,
    local_source_present: Boolean(localBodySha256),
    local_source_matches_live: Boolean(localBodySha256) && localBodySha256 === post.body_sha256,
  };

  return {
    slug: post.slug,
    title: effective.title,
    words: words(body).length,
    h2s: headingMatches.filter((match) => match[1].length === 2).length,
    external_links: markdownLinks.filter((href) => /^https:\/\//i.test(href)).length,
    internal_links: markdownLinks.filter((href) => /^\/(?:tools|journal|blog)\//.test(href)).length,
    repeated_sentences_within_article: [...withinCounts.values()].filter((count) => count > 1).length,
    checks,
    body_sha256: post.body_sha256,
    local_body_sha256: localBodySha256,
    shingle_set: shingles(body),
  };
});

const similarities = [];
for (let left = 0; left < articles.length; left += 1) {
  for (let right = left + 1; right < articles.length; right += 1) {
    similarities.push({
      left: articles[left].slug,
      right: articles[right].slug,
      score: jaccard(articles[left].shingle_set, articles[right].shingle_set),
    });
  }
}
similarities.sort((left, right) => right.score - left.score);

const crossArticleSentences = [...sentenceOwners.entries()]
  .filter(([, owners]) => owners.size > 1)
  .map(([sentence, owners]) => ({ sentence, articles: [...owners].sort() }))
  .sort((left, right) => right.articles.length - left.articles.length || left.sentence.localeCompare(right.sentence));

const crossArticleParagraphs = [...paragraphOwners.entries()]
  .filter(([, owners]) => owners.size > 1)
  .map(([paragraph, owners]) => ({ paragraph, articles: [...owners].sort() }))
  .sort((left, right) => right.articles.length - left.articles.length || left.paragraph.localeCompare(right.paragraph));

for (const article of articles) delete article.shingle_set;
const checkNames = Object.keys(articles[0]?.checks || {});
const summary = {
  checked_at: new Date().toISOString(),
  published_posts: articles.length,
  local_sources_present: articles.filter((article) => article.checks.local_source_present).length,
  local_sources_matching_live: articles.filter((article) => article.checks.local_source_matches_live).length,
  check_failures: Object.fromEntries(checkNames.map((name) => [name, articles.filter((article) => !article.checks[name]).length])),
  maximum_pairwise_seven_word_shingle_jaccard: similarities[0] || null,
  cross_article_repeated_substantive_paragraph_groups: crossArticleParagraphs.length,
  cross_article_repeated_sentence_groups: crossArticleSentences.length,
  note: 'Corpus hashes and overlap are triage signals; they do not prove external originality or a plagiarism-checker percentage.',
};

const report = {
  summary,
  articles,
  highest_pairwise_similarities: similarities.slice(0, 20),
  cross_article_repeated_substantive_paragraphs: crossArticleParagraphs,
  cross_article_repeated_sentences: crossArticleSentences,
};

const outputJson = path.join(root, 'docs/audits/published-editorial-audit.json');
const outputMarkdown = path.join(root, 'docs/audits/PUBLISHED_EDITORIAL_AUDIT.md');
fs.writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`);

const cell = (value) => String(value).replace(/\|/g, '/').replace(/[\r\n]+/g, ' ');
const markdown = `# Published editorial audit\n\n` +
  `Checked ${summary.checked_at}. Scope: ${summary.published_posts} currently published posts. Drafts are excluded.\n\n` +
  `Local canonical sources: ${summary.local_sources_present}/${summary.published_posts}; exact local/live body matches: ${summary.local_sources_matching_live}/${summary.published_posts}. ` +
  `Repeated substantive paragraph groups across articles: ${crossArticleParagraphs.length}. ` +
  `The strongest pairwise seven-word-shingle overlap is ${(100 * (similarities[0]?.score || 0)).toFixed(2)}%. ` +
  `These are internal triage signals and do not establish an external originality score.\n\n` +
  `| Article | Words | H2 | External links | Internal links | Local source | Failed checks |\n` +
  `| --- | ---: | ---: | ---: | ---: | --- | --- |\n` +
  articles.map((article) => {
    const failed = Object.entries(article.checks).filter(([, passed]) => !passed).map(([name]) => name).join(', ') || 'None';
    return `| ${cell(article.title)} | ${article.words} | ${article.h2s} | ${article.external_links} | ${article.internal_links} | ${article.checks.local_source_present ? (article.checks.local_source_matches_live ? 'Matches live' : 'Drifted') : 'Missing'} | ${cell(failed)} |`;
  }).join('\n') + '\n';
fs.writeFileSync(outputMarkdown, markdown);
console.log(JSON.stringify(summary));
