// Read-only audit of public article data; never changes publishing status.
const fs=require('node:fs');
const crypto=require('node:crypto');
const base='https://anvil-tools-backend.vercel.app/api/public';
async function get(path){const response=await fetch(base+path,{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(`${path}: ${response.status}`);return {data:await response.json(),total:Number(response.headers.get('x-total-count'))};}
(async()=>{
 const posts=[]; let total=Infinity;
 for(let offset=0;offset<total;offset+=100){const result=await get(`/posts?limit=100&offset=${offset}`);posts.push(...result.data);total=result.total;if(!result.data.length)break;}
 const rows=[];let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<posts.length){const post=posts[cursor++];const {data}=await get('/posts/'+encodeURIComponent(post.slug));const body=String(data.body||'').trim();rows.push({slug:post.slug,title:data.title,words:body?body.split(/\s+/).length:0,missingExcerpt:!data.excerpt?.trim(),missingCoverAlt:!!data.cover_image_id&&!data.cover_alt?.trim(),hash:crypto.createHash('sha256').update(body.toLowerCase().replace(/\s+/g,' ')).digest('hex'),sample:body.slice(0,450)});}}));
 rows.sort((a,b)=>a.slug.localeCompare(b.slug));
 const counts=new Map();rows.forEach(row=>counts.set(row.hash,(counts.get(row.hash)||0)+1));
 const summary={checkedAt:new Date().toISOString(),count:rows.length,empty:rows.filter(r=>!r.words).length,under150Words:rows.filter(r=>r.words<150).length,missingExcerpts:rows.filter(r=>r.missingExcerpt).length,missingCoverAlt:rows.filter(r=>r.missingCoverAlt).length,duplicateBodyRows:rows.filter(r=>counts.get(r.hash)>1).length};
 fs.mkdirSync('docs/audits',{recursive:true});
 fs.writeFileSync('docs/audits/published-content.json',JSON.stringify({summary,articles:rows},null,2)+'\n');
 const cell=v=>String(v).replace(/\|/g,'/').replace(/[\r\n]/g,' ');
 fs.writeFileSync('docs/audits/PUBLISHED_CONTENT.md',`# Published content audit\n\nChecked ${summary.checkedAt}. Read-only API review of every returned published article (${rows.length}). No articles were edited or unpublished.\n\nEmpty bodies: ${summary.empty}; under 150 words: ${summary.under150Words}; missing excerpts: ${summary.missingExcerpts}; cover images missing alt text: ${summary.missingCoverAlt}; exact normalized duplicate-body rows: ${summary.duplicateBodyRows}.\n\n150 words is an internal triage signal, **not a Google requirement**. Length, uniqueness hashes, and metadata do not prove originality, factual accuracy, image rights, or AdSense eligibility. The JSON companion includes a short public excerpt for editorial triage; full human review remains necessary.\n\n| Article | Words | Review flags |\n| --- | ---: | --- |\n`+rows.map(r=>`| [${cell(r.title)}](https://anviltools.vercel.app/journal/${encodeURIComponent(r.slug)}) | ${r.words} | ${[!r.words?'Empty body':'',r.words<150?'Short: review usefulness':'',r.missingExcerpt?'Missing excerpt':'',r.missingCoverAlt?'Missing image alt':'',counts.get(r.hash)>1?'Duplicate body':''].filter(Boolean).join('; ')||'Metadata checks passed; editorial review still needed'} |`).join('\n')+'\n');
 console.log(JSON.stringify(summary));
})().catch(error=>{console.error(error.message);process.exitCode=1;});
