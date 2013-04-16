"use strict";

// Setting up testing environment:

var _ = require('lodash');


// Tests:

var esEngine = require('../dist/esengine'); 

exports.APITest = function(test) {
	// SETUP:
	
    //test.expect(1);
    
	
	// STARTING THE TEST:
	
    // There is no reliable way to test if esEngine would be
    // added to the global object if it were not loaded by Node.js ?
    
    test.ok(_.isFunction(esEngine), "esEngine is a function");
    
    var es = esEngine();
    
    test.ok(es, "Calling esEngine gives an ES");
    
    test.ok(es instanceof esEngine, "Can use 'instanceof' with objects created by esEngine()");
    test.strictEqual(es.constructor, esEngine, "Correct constructor for objects created by esEngine()");
    
    test.done();
};
