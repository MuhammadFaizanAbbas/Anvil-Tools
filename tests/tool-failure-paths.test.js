const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function setup(slug, overrides={}, extra={}) {
 const nodes={};
 const node=id=>nodes[id] ||= {value:'',checked:true,textContent:'',style:{},handlers:{},innerHTML:'',
  addEventListener(event,fn){this.handlers[event]=fn;},appendChild(){},cloneNode(){return this;},querySelector(){return null;},...overrides[id]};
 const context={document:{getElementById:node,addEventListener:(_,fn)=>fn(),createElement:()=>node('created'),querySelectorAll:()=>[]},
  navigator:{clipboard:{writeText:async()=>{throw Error('Denied');}}},Uint32Array,TextEncoder,TextDecoder,atob,btoa,...extra};
 vm.runInNewContext(fs.readFileSync(`frontend/assets/js/tools/${slug}.js`,'utf8'),context);
 return {nodes,node};
}
test('password boundary preserves requested length and every selected class',()=>{
 for(const length of [6,16,48]) for(let mask=1;mask<16;mask++) {
  let calls=0;
  const kinds=['upper','lower','numbers','symbols'];
  const overrides={'pw-length':{value:String(length)}};
  kinds.forEach((kind,i)=>overrides[`pw-${kind}`]={checked:!!(mask&(1<<i))});
  const {nodes}=setup('password-generator',overrides,{window:{crypto:{getRandomValues:a=>{assert.ok(++calls<1000,'rejection sampling must progress');a[0]=calls%2?0xffffffff:0;return a;}}}});
  const value=nodes['pw-output'].textContent;
  assert.equal(value.length,length);
  [/[A-Z]/,/[a-z]/,/[0-9]/,/[^A-Za-z0-9]/].forEach((pattern,i)=>assert.equal(pattern.test(value),!!(mask&(1<<i))));
 }
});
test('invalid password options clear old output and disable copying',()=>{
 const {nodes}=setup('password-generator',{'pw-length':{value:'16'}},{window:{crypto:{getRandomValues:a=>{a[0]=0;return a;}}}});
 nodes['pw-length'].value='3';nodes['pw-generate'].handlers.click();
 assert.equal(nodes['pw-output'].textContent,'');assert.equal(nodes['pw-copy'].disabled,true);
 nodes['pw-length'].value='16';['upper','lower','numbers','symbols'].forEach(k=>nodes[`pw-${k}`].checked=false);
 nodes['pw-generate'].handlers.click();assert.match(nodes['pw-strength'].textContent,/Select at least/);
});
test('QR missing library and oversized input give feedback and hide stale downloads',()=>{
 let state=setup('qr-code-generator',{'qr-input':{value:'hello'}});
 assert.match(state.nodes['qr-status'].textContent,/library could not load/);
 function QRCode(){throw Error('code length overflow');} QRCode.CorrectLevel={H:2};
 state=setup('qr-code-generator',{'qr-input':{value:'a'.repeat(10000)}},{QRCode});
 assert.match(state.nodes['qr-status'].textContent,/shorter/);
 assert.equal(state.nodes['qr-download'].style.display,'none');
 assert.equal(state.nodes['qr-canvas-wrap'].innerHTML,'');
});
test('unit conversion rejects blank and non-finite input but accepts zero and offsets',()=>{
 const {nodes}=setup('unit-converter',{'uc-group':{value:'temperature'},'uc-value':{value:''}});
 assert.match(nodes['uc-result'].textContent,/finite number/);
 nodes['uc-value'].value='Infinity';nodes['uc-value'].handlers.input();assert.match(nodes['uc-result'].textContent,/finite number/);
 nodes['uc-value'].value='0';nodes['uc-value'].handlers.input();assert.match(nodes['uc-result'].textContent,/32\.000 fahrenheit/);
});
test('clipboard rejection leaves tool results intact and shows recovery instructions',async()=>{
 const cases=[['base64-tool','b64'],['json-formatter','jf'],['user-agent-generator','ua'],['url-encoder-decoder','url'],['hash-generator','hash'],['text-case-converter','case'],['csv-to-json','csv'],['uuid-generator','uuid']];
 for(const [slug,prefix] of cases){
  const {node}=setup(slug,{'uuid-count':{value:'1'}},{crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000000'}});
  const out=node(prefix==='hash'?'hash-hex':`${prefix}-output`);out.textContent='sample';out.value='sample';
  await node(`${prefix}-copy`).handlers.click();
  assert.match(node(`${prefix}-status`).textContent,/Copy failed/,slug);
  assert.equal(out.textContent,'sample',slug);
 }
});
