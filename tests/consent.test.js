const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('frontend/assets/js/cmp.js', 'utf8');
function setup({ stored = null, blocked = false, full = false } = {}) {
  const nodes = {};
  const ids = ['consent-banner', 'consent-accept'];
  if (full) ids.push('consent-reject', 'consent-customize', 'consent-save', 'consent-custom-panel', 'consent-analytics', 'consent-personalized');
  for (const id of ids) nodes[id] = {
    style: { removeProperty(key) { delete this[key]; } }, attrs: {}, handlers: {},
    setAttribute(key, value) { this.attrs[key] = value; },
    addEventListener(key, handler) { this.handlers[key] = handler; },
  };
  const events = [];
  let saved = stored;
  vm.runInNewContext(source, {
    document: { getElementById: id => nodes[id], addEventListener: (_, init) => init() },
    localStorage: { getItem() { if (blocked) throw Error('blocked'); return saved; }, setItem(_, value) { if (blocked) throw Error('blocked'); saved = value; } },
    window: { dispatchEvent: event => events.push(event) },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
  });
  return { nodes, events, saved: () => saved };
}
test('Got it dismisses the simple banner and persists acknowledgement across pages', () => {
  const state = setup();
  state.nodes['consent-accept'].handlers.click();
  assert.equal(state.nodes['consent-banner'].style.display, 'none');
  assert.equal(state.events[0].detail.personalized, false);
  const nextPage = setup({ stored: state.saved() });
  assert.equal(nextPage.nodes['consent-banner'].attrs['aria-hidden'], 'true');
  assert.equal(nextPage.nodes['consent-banner'].style.display, 'none');
});
test('Got it works when browser storage is unavailable or malformed', () => {
  for (const options of [{ blocked: true }, { stored: 'invalid JSON' }]) {
    const state = setup(options);
    state.nodes['consent-accept'].handlers.click();
    assert.equal(state.nodes['consent-banner'].style.display, 'none');
    assert.equal(state.events.length, 1);
  }
});
test('full consent controls preserve accept, reject, and custom choices', () => {
  const state = setup({ full: true });
  state.nodes['consent-accept'].handlers.click();
  assert.equal(state.events.at(-1).detail.personalized, true);
  state.nodes['consent-reject'].handlers.click();
  assert.equal(state.events.at(-1).detail.personalized, false);
  state.nodes['consent-analytics'].checked = true;
  state.nodes['consent-save'].handlers.click();
  assert.equal(state.events.at(-1).detail.analytics, true);
  assert.equal(state.events.at(-1).detail.personalized, false);
});

test('public pages do not offer inactive consent choices or load dormant ad scripts', () => {
  function check(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = `${dir}/${entry.name}`;
      if (entry.isDirectory()) check(file);
      else if (file.endsWith('.html') && !file.includes('/admin-panel/')) {
        const html = fs.readFileSync(file, 'utf8');
        assert.doesNotMatch(html, /id="(?:consent-banner|privacy-settings|consent-reject)"/, file);
        assert.doesNotMatch(html, /src="[^"]*\/(?:cmp|ads)\.js"/, file);
        assert.match(html, /privacy-policy\.html/, file);
      }
    }
  }
  check('frontend');
});
