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
test('dashboard has honest empty charts and KPI counts', () => {
  const app = setup();
  app.run('renderAnalytics([])');
  assert.match(app.node('analyticsChart').innerHTML, /No recorded views yet/);
  assert.match(app.node('categoryChart').innerHTML, /Add tools/);
  app.run(`renderStats({totalVisitors:120}, [{status:'active'},{status:'inactive'}], [{status:'draft'},{status:'published'}])`);
  const html = app.node('statsGrid').innerHTML;
  assert.match(html, /120/);
  assert.match(html, /2 tools in your library/);
  assert.equal((html.match(/class="stat-value">1</g) || []).length, 3);
});
