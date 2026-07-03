import assert from 'node:assert/strict';
import handler from '../api/lookup.js';

const originalFetch = global.fetch;
global.fetch = async (url) => {
  const target = String(url);
  if (target === 'https://www.hpiracing.com/en/part/101211') {
    return new Response(`<!doctype html><html><head><meta property="og:description" content="Genuine HPI quality spare part for easy maintenance and repairs."><meta property="og:image" content="https://example.com/hpi.jpg"></head><body><h3>This Part Fits the following kits / parts:</h3><ul><li>Bullet ST 3.0 STD</li><li>Bullet MT 3.0 STD</li></ul><h1>#101211 - ROD END SET</h1><h2>BULLET SERIES</h2><p>In stock</p></body></html>`, { status: 200, headers: { 'Content-Type': 'text/html' } });
  }
  throw new Error(`Unexpected fetch: ${target}`);
};

const response = { statusCode: 0, payload: null, setHeader(){}, status(code){ this.statusCode=code; return this; }, json(payload){ this.payload=payload; return this; } };
await handler({ method:'GET', query:{ q:'101211' } }, response);
assert.equal(response.statusCode, 200);
assert.equal(response.payload.ok, true);
assert.equal(response.payload.results.length, 1);
assert.equal(response.payload.results[0].brand, 'HPI Racing');
assert.equal(response.payload.results[0].partNumber, '101211');
assert.equal(response.payload.results[0].title, 'ROD END SET');
assert.match(response.payload.results[0].fitment, /Bullet ST 3.0 STD/);
assert.equal(response.payload.providerStatus.hpiOfficial, 'matched');

global.fetch = originalFetch;
console.log('HPI handler test passed');
