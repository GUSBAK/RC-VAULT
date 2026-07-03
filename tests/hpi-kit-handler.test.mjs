import assert from 'node:assert/strict';
import handler from '../api/lookup.js';

const originalFetch = global.fetch;
global.fetch = async (url) => {
  const target = String(url);
  if (target === 'https://www.hpiracing.com/en/kit/160586') {
    return new Response(`<!doctype html><html><head><meta property="og:description" content="Savage XL 5.9 returns with a bold blue option."><meta property="og:image" content="https://example.com/savage.jpg"></head><body><h1>SAVAGE XL 5.9 NITRO</h1><p>#160586 Savage XL 5.9 GTXL-6 Blue</p><p>1/8th 4WD Nitro Monster Truck</p><p>In stock</p></body></html>`, { status:200, headers:{'Content-Type':'text/html'} });
  }
  throw new Error(`Unexpected fetch: ${target}`);
};

const response = { statusCode:0, payload:null, setHeader(){}, status(code){this.statusCode=code; return this;}, json(payload){this.payload=payload; return this;} };
await handler({ method:'GET', query:{ q:'https://www.hpiracing.com/en/kit/160586', brand:'HPI Racing' } }, response);
assert.equal(response.statusCode, 200);
assert.equal(response.payload.ok, true);
assert.equal(response.payload.kind, 'rc_car');
assert.equal(response.payload.providerStatus.hpiOfficial, 'matched');
assert.equal(response.payload.results.length, 1);
assert.equal(response.payload.results[0].itemType, 'rc-car');
assert.equal(response.payload.results[0].partNumber, '160586');
assert.match(response.payload.results[0].title, /Savage XL 5\.9 GTXL-6 Blue/i);

global.fetch = originalFetch;
console.log('HPI kit handler test passed');
