const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { innerHTML: '', value: '', addEventListener() {}, classList: { toggle() {} } });
    return nodes.get(id);
  };
  const context = vm.createContext({ location: { hash: '' }, window: { addEventListener() {} }, document: { getElementById: node, querySelectorAll: () => [] } });
  const source = fs.readFileSync('frontend/assets/js/admin.js', 'utf8').replace(/    refresh\(\);\s*$/, '');
  vm.runInContext(source, context);
  return { node, run: script => vm.runInContext(script, context) };
}
test('dashboard charts show real totals and escape tool/category names', () => {
  const app = setup();
  app.run(`renderAnalytics([{name:'<img src=x>',category:'<script>',views:8},{name:'Second',category:'Other',views:2}])`);
  assert.match(app.node('analyticsChart').innerHTML, /&lt;img src=x&gt;/);
  assert.match(app.node('categoryChart').innerHTML, /&lt;script&gt;/);
  assert.match(app.node('categoryChart').innerHTML, /2 tools across 2 categories/);
  assert.ok(!app.node('analyticsChart').innerHTML.includes('NaN'));
});

test('site tools are visible without inventing saved status and database edits win', () => {
  const app = setup();
  app.run(`window.AnvilToolCatalog=[{slug:'one',name:'Site name'},{slug:'two',name:'Second'}]`);
  const items = app.run(`mergeToolCatalog([{slug:'one',name:'Edited name',status:'inactive',views:42}])`);
  assert.equal(items.length, 2);
  assert.equal(items[0].name, 'Edited name');
  assert.equal(items[0].status, 'inactive');
  assert.equal(items[0].views, 42);
  assert.equal(items[1].status, 'not registered');
  assert.equal(items[1].views, undefined);
  assert.equal(app.run('mergeToolCatalog([],false)[0].status'), 'connection unavailable');
});
test('dashboard has honest empty charts and KPI counts', () => {
  const app = setup();
  app.run('renderAnalytics([])');
  assert.match(app.node('analyticsChart').innerHTML, /No recorded views yet/);
  assert.match(app.node('categoryChart').innerHTML, /Add tools/);
  app.run(`renderStats({totalVisitors:120,publishedPosts:1,draftPosts:1}, [{status:'active'},{status:'inactive'}])`);
  const html = app.node('statsGrid').innerHTML;
  assert.match(html, /120/);
  assert.match(html, /2 tools in your library/);
  assert.equal((html.match(/class="stat-value">1</g) || []).length, 3);
});
test('post pagination reports totals and enables only valid directions', () => {
  const app = setup();
  app.run(`postPage=1;renderPosts({items:[{id:'post-31',title:'Article 31',slug:'article-31',status:'draft'}],total:61,limit:30,offset:30})`);
  assert.match(app.node('postsList').innerHTML, /Article 31/);
  assert.equal(app.node('postsPage').textContent, 'Page 2 of 3 · 61 articles');
  assert.equal(app.node('postsPrev').disabled, false);
  assert.equal(app.node('postsNext').disabled, false);
  app.run(`postPage=2;renderPosts({items:[{id:'post-61',title:'Last',slug:'last',status:'published'}],total:61,limit:30,offset:60})`);
  assert.equal(app.node('postsNext').disabled, true);
});
