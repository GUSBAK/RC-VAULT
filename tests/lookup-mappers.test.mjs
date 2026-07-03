import assert from 'node:assert/strict';
import { __test__ } from '../api/lookup.js';

assert.equal(__test__.isBarcode('871-1234567890'.replace('-','')), true);
assert.equal(__test__.isBarcode('ARA-1606'), false);
assert.equal(__test__.detectBrand('ARA-1606 Rear Arms'), 'ARRMA');
assert.equal(__test__.detectBrand('Traxxas 6851R'), 'Traxxas');

const shopping = __test__.candidateFromShopping({
  title: 'ARRMA ARA-1606 Rear Arms (2)',
  source: 'FCT Hobby Saudi',
  price: '35.00',
  thumbnail: 'https://example.com/image.jpg',
  link: 'https://fcthobby.com/en/ara-1606-rear-arms-2/p2112413382'
}, 'ARA-1606');
assert.equal(shopping.brand, 'ARRMA');
assert.equal(shopping.partNumber, 'ARA-1606');
assert.equal(shopping.sources[0].supplier, 'FCT Hobby Saudi');

const barcode = __test__.candidateFromBarcodeLookup({
  title: 'ARRMA Rear Arms (2)',
  brand: 'ARRMA',
  mpn: 'ARA-1606',
  barcode_number: '5052127031234',
  images: ['https://example.com/a.jpg'],
  description: 'Rear arms',
  stores: [{ store_name: 'FCT Hobby Saudi', store_url: 'https://fcthobby.com/en/ara-1606-rear-arms-2/p2112413382', store_price: '35', currency: 'SAR' }]
}, '5052127031234');
assert.equal(barcode.barcode, '5052127031234');
assert.equal(barcode.partNumber, 'ARA-1606');

const merged = __test__.mergeCandidates([shopping, barcode], 'ARA-1606');
assert.equal(merged.length, 1);
assert.equal(merged[0].brand, 'ARRMA');
assert.ok(['High','Exact'].includes(merged[0].confidence));

console.log('lookup mapper tests passed');
