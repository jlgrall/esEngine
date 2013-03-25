"use strict";

// Setting up testing environment:

var _ = require('lodash');


// Start Tests:

var esEngine = require('../dist/esengine'); 

exports.testbase = function(test){
    //test.expect(1);
    
    // There is no reliable way to test if esEngine would be
    // added to the global object if it were not loaded by Node.js ?
    
    test.ok(_.isFunction(esEngine), "esEngine is a function");
    
    
    test.done();
};