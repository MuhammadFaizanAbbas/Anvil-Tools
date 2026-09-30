// Deterministic audit reproduction; no real passwords or network requests.
const fs = require('node:fs');
const vm = require('node:vm');
const elements = new Map();
let draws = 0;
const get = id => {
 if (!elements.has(id)) elements.set(id, {value:'16',checked:true,textContent:'',addEventListener(){}});
 return elements.get(id);
};
vm.runInNewContext(fs.readFileSync('frontend/assets/js/tools/password-generator.js','utf8'), {
 document:{getElementById:get,addEventListener:(_,fn)=>fn()},
 window:{crypto:{getRandomValues:array=>{array.fill(draws++ % 2 === 0 ? 0xffffffff : 0);return array;}}},
 Uint32Array, navigator:{clipboard:{writeText:async()=>{}}}
});
if (!elements.has('pw-output')) throw Error('Password output was not initialized');
if (get('pw-output').textContent.length !== 16) throw Error('Password length regression');
console.log(JSON.stringify({requestedLength:16,outputLength:get('pw-output').textContent.length,explanation:'Maximum Uint32 boundary is safely rejected or mapped within bounds.'}));
