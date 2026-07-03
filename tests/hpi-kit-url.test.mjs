import assert from 'node:assert/strict';
import { __test__ } from '../api/lookup.js';

const ref = __test__.hpiReference('https://www.hpiracing.com/en/kit/160586');
assert.equal(ref.code, '160586');
assert.equal(ref.route, 'kit');
assert.equal(__test__.hpiCode('160586'), '160586');
console.log('HPI kit URL mapping tests passed.');
