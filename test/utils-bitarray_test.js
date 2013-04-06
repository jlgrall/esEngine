"use strict";

// Setting up testing environment:

var _ = require('lodash');


// Tests:

var esEngine = require('../dist/esengine'); 

exports.APITest = function(test) {
	// SETUP:
	
	//test.expect(1);
	
	
	// STARTING THE TEST:
	
	var ArrayOfBitArray = esEngine.ArrayOfBitArray,
		aoba1;
	
	aoba1 = ArrayOfBitArray(0);
	test.strictEqual(aoba1.length, 0, "The array has no element");
	test.strictEqual(aoba1.size, 0, "The array has a size of 0 bit");
	
	aoba1 = ArrayOfBitArray(2);
	test.strictEqual(aoba1.length, 0, "The array has no element");
	test.strictEqual(aoba1.size, 2, "The array has a size of 2 bits");
	
	aoba1.length = 1;
	test.strictEqual(aoba1.length, 1, "The array has 1 element");
	test.strictEqual(aoba1.size, 2, "The array has a size of 2 bits");
	
	aoba1.length = 30;
	test.strictEqual(aoba1.length, 30, "The array has 30 elements");
	
	aoba1.length = 8;
	test.strictEqual(aoba1.length, 8, "The array has 8 elements");
	
	aoba1.size = 40;
	test.strictEqual(aoba1.size, 40, "The array has a size of 40 bits");
	
	test.ok(!aoba1.isSet(1, 4), "Element 1 has bit 4 not set");
	aoba1.set(1, 4);
	test.ok(!aoba1.isSet(1, 3), "Element 1 has bit 3 not set");
	test.ok(aoba1.isSet(1, 4), "Element 1 has bit 4 set");
	test.ok(!aoba1.isSet(1, 5), "Element 1 has bit 4 not set");
	test.strictEqual(aoba1.bitsSet(1), 1, "Element 1 has 1 bit set");
	
	aoba1.set(1, 5);
	aoba1.set(1, 16);
	test.strictEqual(aoba1.bitsSet(1), 3, "Element 1 has 3 bits set");
	aoba1.resetBitSet(1);
	test.strictEqual(aoba1.bitsSet(1), 3, "Element 1 has 3 bits set");
	aoba1.unset(1, 5);
	aoba1.unset(1, 16);
	test.strictEqual(aoba1.bitsSet(1), 1, "Element 1 has 1 bit set");
	
	aoba1.unset(1, 4);
	test.ok(!aoba1.isSet(1, 3), "Element 1 has bit 3 not set");
	test.ok(!aoba1.isSet(1, 4), "Element 1 has bit 4 not set");
	test.ok(!aoba1.isSet(1, 5), "Element 1 has bit 4 not set");
	test.strictEqual(aoba1.bitsSet(1), 0, "Element 0 has 0 bit set");
	
	test.done();
};
