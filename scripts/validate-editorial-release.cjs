// Offline PostgreSQL validation. This script never connects to a production database.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { PGlite } = require('../deployment/browser-check/node_modules/@electric-sql/pglite');
const library = require('../content/editorial/published-library.json');
const directory = 'deployment/adsense-followup-2026-10-05';
const baseline = JSON.parse(fs.readFileSync(`${directory}/database-before.json`, 'utf8'));
const sql = fs.readFileSync(`${directory}/publish.sql`, 'utf8');
const md5 = text => createHash('md5').update(text).digest('hex');
const report = { checkedAt: new Date().toISOString(), offlineOnly: true, cases: [] };

async function database() {
  const db = new PGlite();
  await db.exec(`CREATE TABLE public.posts (
    id text PRIMARY KEY, slug text UNIQUE NOT NULL, title text NOT NULL,
    excerpt text NOT NULL, status text NOT NULL, updated_at timestamptz NOT NULL,
    body text NOT NULL, category_slug text, seo_title text NOT NULL,
    seo_description text NOT NULL, author_id uuid, created_at timestamptz NOT NULL,
    published_at timestamptz, cover_image_id uuid, cover_alt text NOT NULL, tags text[] NOT NULL
  );
  CREATE TABLE public.post_revisions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id text REFERENCES public.posts(id),
    snapshot jsonb NOT NULL, actor_id uuid, created_at timestamptz DEFAULT now()
  );`);
  for (const guide of library) {
    const previous = baseline.find(post => post.slug === guide.slug);
    const row = { id: guide.key, slug: guide.slug, title: guide.title,
      excerpt: guide.excerpt, status: 'published', updated_at: '2026-10-01T00:00:00+00:00',
      body: fs.readFileSync(`content/editorial/${guide.bodyFile}`, 'utf8').trim(),
      category_slug: guide.category_slug, seo_title: guide.title, seo_description: guide.excerpt,
      author_id: null, created_at: '2026-09-29T00:00:00+00:00', published_at: '2026-09-29T00:00:00+00:00',
      cover_image_id: guide.cover_image_id, cover_alt: guide.cover_alt, tags: [], ...previous };
    await db.query('INSERT INTO public.posts SELECT (jsonb_populate_record(NULL::public.posts, $1::jsonb)).*', [JSON.stringify(row)]);
  }
  return db;
}
async function snapshot(db) {
  await db.exec("SET TIME ZONE 'UTC'");
  const { rows } = await db.query('SELECT to_jsonb(p) AS post FROM public.posts p ORDER BY slug');
  return rows.map(row => row.post);
}
async function rejectRelease(name, change, expectedError) {
  const db = await database();
  try {
    await db.exec(change);
    const before = await snapshot(db);
    await assert.rejects(db.exec(sql), expectedError);
    await db.exec('ROLLBACK');
    assert.deepEqual(await snapshot(db), before);
    assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.post_revisions')).rows[0].n, 0);
    report.cases.push({ name, passed: true });
  } finally { await db.close(); }
}

(async () => {
  const db = await database();
  try {
    const before = await snapshot(db);
    const payload = JSON.parse(sql.match(/\$audit_payload\$([\s\S]*?)\$audit_payload\$/)[1]);
    for (const item of payload) {
      const record = before.find(post => post.slug === item.slug);
      const differences = Object.keys(item.metadata).filter(key => JSON.stringify(record[key]) !== JSON.stringify(item.metadata[key]));
      assert.deepEqual(differences, [], `Prepared metadata does not match PostgreSQL serialization for ${item.slug}: ${JSON.stringify(differences.map(key => ({ key, prepared: item.metadata[key], postgres: record[key] })))}`);
      assert.equal(md5(record.body), item.expectedBodyMd5, 'Prepared baseline hash differs');
    }
    await db.exec("SET TIME ZONE 'Asia/Karachi'");
    await db.exec(sql);
    const after = await snapshot(db);
    for (const post of after) {
      const previous = before.find(row => row.id === post.id);
      if (post.id === 'developer-data') assert.deepEqual(post, previous);
      else {
        const guide = library.find(row => row.key === post.id);
        const body = fs.readFileSync(`content/editorial/${guide.bodyFile}`, 'utf8').replace(/\r\n?/g, '\n').trim();
        assert.equal(md5(post.body), md5(body));
        const { body: ignoredBody, updated_at: ignoredDate, ...metadata } = post;
        const { body: oldBody, updated_at: oldDate, ...oldMetadata } = previous;
        assert.deepEqual(metadata, oldMetadata);
      }
    }
    const { rows: revisions } = await db.query('SELECT snapshot FROM public.post_revisions');
    assert.equal(revisions.length, 3);
    for (const { snapshot: revision } of revisions) assert.deepEqual(revision, before.find(row => row.id === revision.id));
    report.cases.push({ name: 'Exactly three bodies updated; full previous records saved; all other metadata and the fourth guide preserved', passed: true });
    report.cases.push({ name: 'UTC metadata guards work when the connection starts in a different time zone', passed: true });
    await assert.rejects(db.exec(sql), /Concurrent article edit detected/);
    await db.exec('ROLLBACK');
    assert.deepEqual(await snapshot(db), after);
    assert.equal((await db.query('SELECT count(*)::integer AS n FROM public.post_revisions')).rows[0].n, 3);
    report.cases.push({ name: 'Repeated publication rejected without new revisions or changes', passed: true });
  } finally { await db.close(); }
  // PDF is sorted last: rejection here proves preceding changes roll back too.
  await rejectRelease('A concurrent body edit rolls back the whole transaction',
    "UPDATE public.posts SET body = body || E'\\nConcurrent edit' WHERE id = 'pdf-workflows'", /Concurrent article edit detected/);
  await rejectRelease('A concurrent metadata edit rolls back the whole transaction',
    "UPDATE public.posts SET title = 'An independently changed title' WHERE id = 'pdf-workflows'", /Concurrent article edit detected/);
  await rejectRelease('A changed published catalog prevents publication',
    "UPDATE public.posts SET status = 'draft' WHERE id = 'developer-data'", /Published catalog changed/);
  fs.writeFileSync('docs/audits/adsense-publication-validation.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
