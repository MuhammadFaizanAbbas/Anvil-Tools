const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const assetDirectory = path.join(root, 'frontend/assets/vendor/background-removal/1.5.5');

test('background remover ships its small model and CPU runtimes on the site', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(assetDirectory, 'resources.json'), 'utf8'));
  const resources = [
    '/models/isnet_quint8',
    '/onnxruntime-web/ort-wasm-simd-threaded.wasm',
    '/onnxruntime-web/ort-wasm-simd.wasm',
    '/onnxruntime-web/ort-wasm-threaded.wasm',
    '/onnxruntime-web/ort-wasm.wasm',
  ];

  for (const resource of resources) {
    assert.ok(manifest[resource], `${resource} is missing from resources.json`);
    for (const chunk of manifest[resource].chunks) {
      const file = path.join(assetDirectory, chunk.hash);
      assert.equal(fs.statSync(file).size, chunk.offsets[1] - chunk.offsets[0], `${chunk.hash} has the wrong size`);
    }
  }

  const script = fs.readFileSync(path.join(root, 'frontend/assets/js/tools/background-remover.js'), 'utf8');
  assert.match(script, /publicPath: modelPath/);
  assert.match(script, /Keep this tab open/);
  assert.doesNotMatch(script, /staticimgly\.com/);
});
