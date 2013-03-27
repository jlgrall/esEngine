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
	
	var cDef;
		
	test.ok(_.isFunction(esEngine.ComponentDef), "esEngine.ComponentDef is a function");
	
	test.throws(function() {
		esEngine.ComponentDef( {} );
	}, /name/, "A component must have a name");
	
	cDef = esEngine.ComponentDef( { name: currentName.next() } );
	test.ok(cDef.name === currentName(), "cDef accepts only a name");
	test.ok(_.isObject(cDef.attr) && _.isEmpty(cDef.attr), "cDef's default attr is an empty object");
	test.ok(_.isFunction(cDef.init), "cDef's default init is a function");
	test.ok(_.isObject(cDef.helpers) && _.isEmpty(cDef.helpers), "cDef's default helpers is an empty object");
	
	cDef = esEngine.ComponentDef({
		name: "TEST1cDef",
		attr: {
			x: 0
		},
		init: function() {},
		helpers: {
			a: function() {}
		}
	});
	test.ok(cDef.name === "TEST1cDef", "cDef has the correct name");
	test.ok(_.isObject(cDef.attr) && cDef.attr.x === 0, "cDef's attr has a property");
	test.ok(_.isFunction(cDef.init), "cDef's init is a function");
	test.ok(_.isObject(cDef.helpers) && _.isFunction(cDef.helpers.a), "cDef's helpers has a function");
	
	
	
	test.done();
};