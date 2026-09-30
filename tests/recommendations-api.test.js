const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const express=require('express');
const rows=[
 {slug:'current',status:'published',category_slug:'dev',tags:['JSON'],published_at:'2026-09-01'},
 {slug:'recent',status:'published',category_slug:'images',tags:[],published_at:'2026-09-30'},
 {slug:'related',status:'published',category_slug:'dev',tags:['json'],published_at:'2026-09-02'},
 {slug:'draft',status:'draft',category_slug:'dev',tags:['json'],published_at:'2026-09-30'}
];
let fail=false;
const db={from(){let filtered=[...rows];return {
 select(){return this;},eq(key,value){filtered=filtered.filter(row=>row[key]===value);return this;},order(){return this;},
 limit(){return Promise.resolve({data:filtered,error:fail?Error('database unavailable'):null});},
 maybeSingle(){return Promise.resolve({data:filtered[0]||null,error:null});}
};}};
const client=require.resolve('../backend/src/lib/supabase');
require.cache[client]={id:client,filename:client,loaded:true,exports:{supabaseAdmin:db}};
let server,base;
before(async()=>{const app=express();app.use('/api',require('../backend/src/routes/content'));app.use((error,req,res,next)=>res.status(500).json({error:'Unavailable'}));server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));base=`http://127.0.0.1:${server.address().port}/api/public/recommendations`;});
after(()=>new Promise(resolve=>server.close(resolve)));
test('backend recommends published related articles and excludes current and drafts',async()=>{
 const response=await fetch(base+'?slug=current&limit=2');assert.equal(response.status,200);
 assert.deepEqual((await response.json()).map(row=>row.slug),['related','recent']);
 const latest=await (await fetch(base+'?limit=1')).json();assert.equal(latest[0].slug,'recent');
 assert.deepEqual(await (await fetch(base+'?slug=draft')).json(),[]);
});
test('invalid parameters are rejected and database failures do not fabricate results',async()=>{
 for(const query of ['?limit=0','?limit=100','?slug=bad%20slug'])assert.equal((await fetch(base+query)).status,400);
 fail=true;assert.equal((await fetch(base)).status,500);fail=false;
});
