const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function counter(value = '') {
  const nodes = Object.fromEntries(['wc-input', 'wc-words', 'wc-chars', 'wc-chars-nospace', 'wc-sentences', 'wc-paragraphs', 'wc-readtime'].map(id => [id, { value, textContent: '', addEventListener(name, callback) { this[name] = callback; } }]));
  vm.runInNewContext(fs.readFileSync('frontend/assets/js/tools/word-counter.js', 'utf8'), {
    document: { getElementById: id => nodes[id], addEventListener: (_, ready) => ready() }
  });
  return nodes;
}

test('empty and whitespace-only input have zero reading minutes, including after clearing text', () => {
  const nodes = counter();
  assert.equal(nodes['wc-readtime'].textContent, '0 min');
  for (const value of ['Hello world.', '', ' \n\t']) {
    nodes['wc-input'].value = value;
    nodes['wc-input'].input();
    assert.equal(nodes['wc-readtime'].textContent, value.trim() ? '1 min' : '0 min');
  }
});

test('the published example matches the displayed counts and the reading-time boundary', () => {
  const nodes = counter('Hello world.\n\nNext line!');
  for (const [id, expected] of Object.entries({ 'wc-words': '4', 'wc-chars': '24', 'wc-chars-nospace': '20', 'wc-sentences': '2', 'wc-paragraphs': '2', 'wc-readtime': '1 min' })) assert.equal(nodes[id].textContent, expected);
  nodes['wc-input'].value = 'word '.repeat(200);
  nodes['wc-input'].input();
  assert.equal(nodes['wc-readtime'].textContent, '1 min');
  nodes['wc-input'].value += 'another';
  nodes['wc-input'].input();
  assert.equal(nodes['wc-readtime'].textContent, '2 min');
  nodes['wc-input'].value = '🙂';
  nodes['wc-input'].input();
  assert.equal(nodes['wc-chars'].textContent, '2');
});

test('shared public asset versions replace stale first-party loader URLs without changing vendor scripts', () => {
  const { versionPublicStyles, PUBLIC_STYLE_VERSION } = require('../backend/src/lib/public-assets');
  const html = '<script src="/assets/js/main.js?v=old" defer></script><script src="../assets/js/tools/word-counter.js"></script><script src="https://vendor.example/library.js?v=1"></script>';
  const updated = versionPublicStyles(html);
  assert.ok(updated.includes(`/assets/js/main.js?v=${PUBLIC_STYLE_VERSION}`));
  assert.ok(updated.includes(`../assets/js/tools/word-counter.js?v=${PUBLIC_STYLE_VERSION}`));
  assert.ok(updated.includes('https://vendor.example/library.js?v=1'));
  assert.equal(versionPublicStyles(updated), updated);
});
