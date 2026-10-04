const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(slug, PDFLib) {
  let focused;
  class Element {
    constructor(tag) { this.tag = tag; this.children = []; this.handlers = {}; this.attrs = {}; this.dataset = {}; this.style = {}; this.textContent = ''; }
    set innerHTML(_) { this.children = []; }
    setAttribute(key, value) { this.attrs[key] = value; }
    removeAttribute(key) { delete this.attrs[key]; }
    addEventListener(event, handler) { this.handlers[event] = handler; }
    appendChild(node) { this.children.push(node); }
    focus() { focused = this; }
    click() { return this.handlers.click?.(); }
    remove() {}
    querySelector(selector) {
      const all = this.children.flatMap(child => [child, ...child.descendants()]);
      const action = selector.match(/data-action="([^"]+)"/)?.[1];
      return all.find(child => action ? child.dataset.action === action : child.tag === 'button' && !child.disabled);
    }
    descendants() { return this.children.flatMap(child => [child, ...child.descendants()]); }
  }
  const nodes = {}, downloads = [], revoked = [];
  const node = id => nodes[id] ||= new Element('div');
  const prefix = slug === 'pdf-merge' ? 'pm' : 'ip';
  const context = {
    document: { getElementById: node, addEventListener: (_, fn) => fn(), body: new Element('body'), createElement: tag => {
      const element = new Element(tag);
      if (tag === 'a') element.click = () => downloads.push(element.download);
      return element;
    } },
    window: { PDFLib, setTimeout: fn => fn(), addEventListener() {} },
    Blob, URL: { createObjectURL: () => `blob:${Math.random()}`, revokeObjectURL: url => revoked.push(url) }
  };
  vm.runInNewContext(fs.readFileSync(`frontend/assets/js/tools/${slug}.js`, 'utf8'), context);
  return { nodes, downloads, revoked, focused: () => focused,
    list: () => node(slug === 'pdf-merge' ? 'pm-file-list' : 'ip-preview').children,
    add: files => node(`${prefix}-file-input`).handlers.change({ target: { files } }),
    run: () => node(slug === 'pdf-merge' ? 'pm-merge' : 'ip-convert').click() };
}

const file = (name, type, id = 1) => ({ name, type, arrayBuffer: async () => new Uint8Array([id]).buffer });
function library({ fail = false, pause } = {}) {
  const order = [];
  return { order, PDFDocument: {
    create: async () => {
      if (pause) await pause;
      if (fail) throw Error('Invalid input');
      return { copyPages: async pdf => { order.push(pdf.id); return [pdf.id]; }, addPage: () => ({ drawImage() {} }),
        embedPng: async bytes => { order.push(new Uint8Array(bytes)[0]); return { width: 20, height: 30 }; },
        save: async () => new Uint8Array([1]), getPageCount: () => order.length };
    },
    load: async bytes => ({ id: new Uint8Array(bytes)[0], getPageIndices: () => [0] })
  }, rgb: () => ({}) };
}

test('PDF ordering preserves the displayed sequence and keyboard focus at the boundaries', async () => {
  const pdf = library(), state = setup('pdf-merge', pdf);
  state.add([file('first.pdf', 'application/pdf', 1), file('second.pdf', '', 2), file('third.pdf', 'application/pdf', 3)]);
  assert.equal(state.list()[0].querySelector('[data-action="up"]').disabled, true);
  assert.equal(state.list()[2].querySelector('[data-action="down"]').disabled, true);
  state.list()[1].querySelector('[data-action="up"]').click();
  assert.equal(state.focused().disabled, false);
  assert.equal(state.list()[0].children[0].textContent, '1. second.pdf');
  state.list()[2].querySelector('[data-action="remove"]').click();
  await state.run();
  assert.deepEqual(pdf.order, [2, 1]);
  assert.deepEqual(state.downloads, ['merged-document.pdf']);
  assert.match(state.nodes['pm-status'].textContent, /2 pages/);
});

test('image removal releases its preview and ordering determines PDF page sequence', async () => {
  const pdf = library(), state = setup('image-to-pdf', pdf);
  state.add([file('one.png', 'image/png', 1), file('two.png', 'image/png', 2), file('three.png', 'image/png', 3)]);
  state.list()[2].querySelector('[data-action="up"]').click();
  state.list()[0].querySelector('[data-action="remove"]').click();
  assert.equal(state.revoked.length, 1);
  await state.run();
  assert.deepEqual(pdf.order, [3, 2]);
  assert.deepEqual(state.downloads, ['images-to-pdf.pdf']);
});

test('both queues reject mutation and duplicate processing while a document is being generated', async () => {
  for (const slug of ['pdf-merge', 'image-to-pdf']) {
    let resume;
    const pdf = library({ pause: new Promise(resolve => { resume = resolve; }) });
    const state = setup(slug, pdf), prefix = slug === 'pdf-merge' ? 'pm' : 'ip';
    const type = prefix === 'pm' ? 'application/pdf' : 'image/png';
    state.add([file('one', type, 1), file('two', type, 2)]);
    const processing = state.run();
    assert.equal(state.nodes[`${prefix}-file-input`].disabled, true);
    assert.equal(state.list()[0].querySelector('[data-action="remove"]').disabled, true);
    state.add([file('extra', type, 3)]);
    state.list()[0].querySelector('[data-action="remove"]').click();
    await state.run();
    resume(); await processing;
    assert.deepEqual(pdf.order, [1, 2]);
    assert.equal(state.downloads.length, 1);
    assert.equal(state.nodes[`${prefix}-file-input`].disabled, false);
  }
});

test('PDF failures produce no download and restore editable queues', async () => {
  for (const slug of ['pdf-merge', 'image-to-pdf']) {
    const prefix = slug === 'pdf-merge' ? 'pm' : 'ip', state = setup(slug, library({ fail: true }));
    state.add([file('a', prefix === 'pm' ? 'application/pdf' : 'image/png'), file('b', prefix === 'pm' ? 'application/pdf' : 'image/png')]);
    await state.run();
    assert.equal(state.downloads.length, 0);
    assert.match(state.nodes[`${prefix}-status`].textContent, /Could not/);
    assert.equal(state.nodes[`${prefix}-file-input`].disabled, false);
    assert.equal(state.list()[0].querySelector('[data-action="remove"]').disabled, false);
  }
});

test('non-PDF selections explain rejection and removing the final file restores upload focus', () => {
  const state = setup('pdf-merge');
  state.add([file('wrong.txt', 'text/plain'), file('ONE.PDF', '')]);
  assert.match(state.nodes['pm-status'].textContent, /Skipped 1 non-PDF/);
  state.list()[0].querySelector('[data-action="remove"]').click();
  assert.equal(state.nodes['pm-merge'].disabled, true);
  assert.equal(state.focused(), state.nodes['pm-dropzone']);
});
