"use strict";

// Setting up testing environment:

var _ = require('lodash');


// Start Tests:

var esEngine = require('../dist/esengine'); 

exports.APITest = function(test) {
	//test.expect(1);
	
	var currentName = function() {
		return currentName.cName;
	};
	currentName.cId = -1;
	currentName.cName = undefined;
	currentName.next = function() {
		currentName.cName = "TheName_" + (++currentName.cId);
		return currentName.cName;
	};
	
	
	// STARTING THE TESTS:
	
	var sDef;
		
	test.ok(_.isFunction(esEngine.SystemDef), "esEngine.SystemDef is a function");
	
	test.throws(function() {
		esEngine.SystemDef( {} );
	}, /name/, "A system must have a name");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "" } );
	}, /cDef/, "A system must have a cDef array");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "", cDefs: [] } );
	}, /init/, "A system must have an init function");
	
	sDef = esEngine.SystemDef( { name: currentName.next(), cDefs: [], init: function() {} } );
	test.ok(sDef.name === currentName(), "sDef name is correct");
	test.ok(_.isArray(sDef.cDefs) && _.isEmpty(sDef.cDefs), "sDef's cDefs is an empty array");
	test.ok(_.isFunction(sDef.init), "sDef's init is a function");
	
	sDef = esEngine.SystemDef( { name: currentName.next(), cDefs: ["TEST1cDef"], init: function() {} } );
	test.ok(sDef.cDefs[0].name === "TEST1cDef", "sDef's cDefs is an empty array");
	
	
	
	test.done();
};