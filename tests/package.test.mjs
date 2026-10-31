import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const dom = new JSDOM("<!doctype html><div id='root'></div>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const api = await import('../dist/esm/index.js');
const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
test('ESM and CommonJS expose the same runtime API', () =>
  assert.deepEqual(
    Object.keys(cjs)
      .filter((key) => key !== '__esModule')
      .sort(),
    Object.keys(api).sort(),
  ));
test('maps paths with declarative transforms and reports unsafe paths', () => {
  const result = api.mapData({ person: { name: ' Ada ' }, age: '37' }, [
    { source: 'person.name', destination: 'display.name', transforms: ['trim', 'uppercase'] },
    { source: 'age', destination: 'age', transforms: ['toNumber'] },
  ]);
  assert.deepEqual(result.value, { display: { name: 'ADA' }, age: 37 });
  assert.deepEqual(result.issues, []);
  assert.throws(() => api.readDataPath({}, '__proto__.x'), /Unsafe/u);
  assert.deepEqual(
    api.validateMapping(
      [{ path: 'person.name', type: 'string' }],
      [{ path: 'out', type: 'string' }],
      [{ source: 'person.name', destination: 'out' }],
    ),
    [],
  );
  assert.equal(api.writeDataPath({}, 'nested.value', 'ok').nested.value, 'ok');
  assert.throws(() => api.splitDataPath('prototype.value'), /Unsafe/u);
  assert.equal(api.mapData({}, [{ source: 'missing', destination: 'out' }]).issues.length, 1);
  assert.equal(
    api.mapData({ value: 'not-number' }, [
      { source: 'value', destination: 'out', transforms: ['toNumber'] },
    ]).issues.length,
    1,
  );
});
test('renders editable mapping rows', async () => {
  const root = createRoot(document.getElementById('root'));
  let changed;
  await React.act(async () =>
    root.render(
      React.createElement(api.DataMapper, {
        sourceFields: [{ path: 'a', type: 'string' }],
        destinationFields: [{ path: 'b', type: 'string' }],
        rules: [{ source: 'a', destination: 'b' }],
        onChange: (value) => {
          changed = value;
        },
      }),
    ),
  );
  assert.ok(document.querySelector('button[aria-label="Remove mapping 1"]'));
  await React.act(async () =>
    document.querySelector('button[aria-label="Remove mapping 1"]').click(),
  );
  assert.equal(changed.length, 0);
  await React.act(async () => root.unmount());
});
