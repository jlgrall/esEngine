"use strict";

// Setting up testing environment:

var _ = require('lodash');


// Tests:

var esEngine = require('../dist/esengine'); 

exports.APITest = function(test) {
	// SETUP:
	
	//test.expect(1);
	
	var currentName = function() {
		return currentName.cName;
	};
	currentName.cId = -1;
	currentName.cName = undefined;
	currentName.next = function() {
		currentName.cName = "SystemName_" + (++currentName.cId);
		return currentName.cName;
	};
	
	var cDefs = [],
		cNames = [],
		sDef,
		i;
	
	for(i = 0; i < 5; i++) {
		cNames[i] = "S_ComponentName_" + i;
		cDefs[i] = esEngine.ComponentDef( { name: cNames[i] } );
	}
	
	
	// STARTING THE TEST:
	
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
	test.strictEqual(sDef.name, currentName(), "sDef name is correct");
	test.ok(_.isArray(sDef.cDefs) && _.isEmpty(sDef.cDefs), "sDef's cDefs is an empty array");
	test.ok(_.isFunction(sDef.init), "sDef's init is a function");
	
	test.throws(function() {
		esEngine.SystemDef( { name: currentName(), cDefs: [], init: function() {} } );
	}, /exists/, "2 systems cannot have the same name");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "", cDefs: [""], init: function() {} } );
	}, /found/, "cDef name must exists");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "", cDefs: [{}], init: function() {} } );
	}, /valid/, "cDef must be valid");
	
	sDef = esEngine.SystemDef( { name: currentName.next(), cDefs: [cNames[0], cDefs[1], cNames[2], cDefs[3]], init: function() {} } );
	for(i = 0; i < 4; i++) {
		test.strictEqual(sDef.cDefs[i], cDefs[i], "sDef's has the correct cDef[" + i + "]");
	}
	
	
	test.done();
};
