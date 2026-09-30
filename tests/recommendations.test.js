const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

async function render({posts=[],fail=false}={}) {
  const element = () => ({children:[], append(...items){this.children.push(...items);},replaceChildren(...items){this.children=items;}});
  const section = element();
  const context = {
    URLSearchParams, location:{pathname:'/journal/current',search:''},
    window:{AnvilGuideCatalog:[{slug:'fallback',title:'A static guide'}],ANVIL_CONFIG:{API_BASE_URL:'https://api.example'}},
    document:{getElementById:()=>section,querySelector:selector=>selector==='h1'?{textContent:'JSON developer guide'}:element(),createElement:element},
    fetch:async()=>{if(fail)throw Error('offline');return {ok:true,json:async()=>posts};}
  };
  await vm.runInNewContext(fs.readFileSync('frontend/assets/js/recommendations.js','utf8'),context);
  return section.children[1].children;
}
test('recommendations exclude current post, deduplicate, rank by topic, and use safe link slugs',async()=>{
  const cards=await render({posts:[{slug:'current',title:'Current'},{slug:'unrelated',title:'Other subject'},{slug:'related',title:'JSON guide'},{slug:'related',title:'Duplicate'},{slug:'<bad>',title:'<script>unsafe</script>'}]});
  assert.equal(cards.length,4);
  assert.equal(cards[0].children[0].textContent,'JSON guide');
  assert.ok(!cards.some(card=>card.children[2].href==='/journal/current'));
  assert.ok(cards.some(card=>card.children[2].href==='/journal/%3Cbad%3E'));
  assert.ok(cards.some(card=>card.children[0].textContent==='<script>unsafe</script>'));
});
test('recommendations preserve useful static guides when the API fails',async()=>{
  const cards=await render({fail:true});
  assert.equal(cards.length,1);
  assert.equal(cards[0].children[2].href,'/blog/posts/fallback.html');
});
