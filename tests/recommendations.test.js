const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function render({posts=[],fail=false}={}) {
  const element = () => ({children:[], append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;}});
  const section = element();
  const context = {
    URLSearchParams, AbortSignal, location:{pathname:'/journal/current',search:'',origin:'https://site.example'},
    window:{ANVIL_CONFIG:{API_BASE_URL:'https://api.example',SITE_URL:'https://site.example'}},
    document:{getElementById:()=>section,querySelector:selector=>selector==='h1'?{textContent:'JSON developer guide'}:element(),createElement:element},
    fetch:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>posts};}
  };
  await vm.runInNewContext(fs.readFileSync('frontend/assets/js/recommendations.js','utf8'),context);
  return section;
}
test('recommendations preserve backend order and safely render metadata',async()=>{
  const section=await render({posts:[{slug:'related',title:'JSON guide',cover_image_id:'cover'},{slug:'<bad>',title:'<script>unsafe</script>'}]});
  const cards=section.children[1].children;
  assert.equal(section.hidden,false);
  assert.equal(cards.length,2);
  assert.equal(cards[0].children[0].src,'https://site.example/journal-images/cover');
  assert.equal(cards[0].children[1].textContent,'JSON guide');
  assert.ok(!cards.some(card=>card.children[2].href==='/journal/current'));
  assert.ok(cards.some(card=>card.children[2].href==='/journal/%3Cbad%3E'));
  assert.ok(cards.some(card=>card.children[0].textContent==='<script>unsafe</script>'));
});
test('failed or empty recommendations hide the section without static fallbacks',async()=>{
  for (const options of [{fail:true},{posts:[]}]) {
    const section=await render(options);
    assert.equal(section.hidden,true);
    assert.equal(section.children.length,0);
  }
});
