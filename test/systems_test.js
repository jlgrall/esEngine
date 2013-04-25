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
	
	
	// SystemDef
	
	test.ok(_.isFunction(esEngine.SystemDef), "esEngine.SystemDef is a function");
	
	test.throws(function() {
		esEngine.SystemDef( {} );
	}, /name/, "A system must have a name");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "" } );
	}, /name/, "A system must have a non empty name");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "name" } );
	}, /cDef/, "A system must have a cDef array");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "name", cDefs: [] } );
	}, /init/, "A system must have an init function");
	
	sDef = esEngine.SystemDef( { name: currentName.next(), cDefs: [], init: function() {} } );
	test.strictEqual(sDef.name, currentName(), "sDef name is correct");
	test.ok(_.isArray(sDef.cDefs) && _.isEmpty(sDef.cDefs), "sDef's cDefs is an empty array");
	test.ok(_.isFunction(sDef.init), "sDef's init is a function");
	
	test.ok(sDef instanceof esEngine.SystemDef, "Can use 'instanceof' with objects created by esEngine.SystemDef()");
    test.strictEqual(sDef.constructor, esEngine.SystemDef, "Correct constructor for objects created by esEngine.SystemDef()");
	
	test.throws(function() {
		esEngine.SystemDef( { name: currentName(), cDefs: [], init: function() {} } );
	}, /exists/, "2 systems cannot have the same name");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "name", cDefs: [""], init: function() {} } );
	}, /found/, "cDef name must exists");
	
	test.throws(function() {
		esEngine.SystemDef( { name: "name", cDefs: [{}], init: function() {} } );
	}, /valid/, "cDef must be valid");
	
	sDef = esEngine.SystemDef( { name: currentName.next(), cDefs: [cNames[0], cDefs[1], cNames[2], cDefs[3]], init: function() {} } );
	for(i = 0; i < 4; i++) {
		test.strictEqual(sDef.cDefs[i], cDefs[i], "sDef's has the correct cDef[" + i + "]");
	}
	
	
	// Systems
	
	var es = esEngine(),
		nbExecutions = 0,
		sDef0 = esEngine.SystemDef( {
			name: "sDef1",
			cDefs: [cDefs[0], cDefs[1], cDefs[2]], 
			init: function( entities, nb, creator1, creator2, creator3 ) {
				test.ok(entities instanceof es.bag, "entities is a bag");
				test.ok(!isNaN(nb), "nb is a number");
				test.strictEqual(creator1, es.componentCreator(cDefs[0]), "creator1 is correct");
				test.strictEqual(creator2, es.componentCreator(cDefs[1]), "creator2 is correct");
				test.strictEqual(creator3, es.componentCreator(cDefs[2]), "creator3 is correct");
				test.strictEqual(arguments.length, 5, "We only received the requested arguments");
				this.bag = entities;
				this.execute = function() {
					nbExecutions++;
				};
			}
		}),
		system0,
		system1;
	
	test.throws(function() {
		es.system();
	}, /valid/, "es.system require a systemDef");
	
	test.throws(function() {
		es.system( [sDef0.name, ":wrongTag"] );
	}, /tag/, "Tag names must not start with a \":\"");
	
	test.throws(function() {
		system0 = es.system( sDef0, 1 );
		es.system( sDef0, 1 );
	}, /same name/, "Systems from the same systemDef cannot have the same tag");
	system0.dispose();
	
	test.throws(function() {
		system0 = es.system( [sDef0, "aTag"], 2 );
		es.system( [sDef0, "aTag"], 2 );
	}, /same name/, "Systems from the same systemDef cannot have the same tag");
	system0.dispose();
	
	system0 = es.system( sDef0, 20 );
	test.strictEqual(system0.def, sDef0, "system0 has the correct def");
	test.strictEqual(system0.name, sDef0.name, "system0 has the correct name");
	test.strictEqual(system0.tag, "", "system0 has the correct tag");
	test.ok(system0.bag, "Initialisation of system worked");
	test.strictEqual(system0.bag, es.entities, "system0 uses the default es.entities");
	system0.execute();
	test.strictEqual(nbExecutions, 1, "System was executed");
	system0.dispose();
	
	system0 = es.system( sDef0.name, 21 );
	test.strictEqual(system0.def, sDef0, "system0 has the correct def");
	test.strictEqual(system0.name, sDef0.name, "system0 has the correct name");
	test.strictEqual(system0.tag, "", "system0 has the correct tag");
	system0.dispose();
	
	system0 = es.system( sDef0.name + ":withTag1", 22 );
	test.strictEqual(system0.def, sDef0, "system0 has the correct def");
	test.strictEqual(system0.name, sDef0.name + ":withTag1", "system0 has the correct name");
	test.strictEqual(system0.tag, "withTag1", "system0 has the correct tag");
	system0.dispose();
	
	system0 = es.system( [sDef0.name], 23 );
	test.strictEqual(system0.def, sDef0, "system0 has the correct def");
	test.strictEqual(system0.name, sDef0.name, "system0 has the correct name");
	test.strictEqual(system0.tag, "", "system0 has the correct tag");
	system0.dispose();
	
	system0 = es.system( [sDef0.name, "withTag2"], 24 );
	test.strictEqual(system0.def, sDef0, "system0 has the correct def");
	test.strictEqual(system0.name, sDef0.name + ":withTag2", "system0 has the correct name");
	test.strictEqual(system0.tag, "withTag2", "system0 has the correct tag");
	system0.dispose();
	
	var bag0 = es.bag("bag0");
	system0 = es.system( sDef0, bag0, 30 );
	test.strictEqual(system0.def, sDef0, "system0 has the correct def");
	test.strictEqual(system0.tag, "", "system0 has the correct tag");
	test.ok(system0.bag, "Initialisation of system worked");
	test.strictEqual(system0.bag, bag0, "system0 received the correct bag");
	system0.execute();
	test.strictEqual(nbExecutions, 2, "System was executed");
	system0.dispose();
	
	
	// ExecutableGroups
	
	var group0;
	
	test.throws(function() {
		es.executableGroup();
	}, /name/, "ExecutableGroup need a name");
	
	group0 = es.executableGroup("group0");
	test.strictEqual(group0.name, "group0", "group0 has the correct name");
	
	// Can have 2 ExecutableGroups with same name:
	group0 = es.executableGroup("group0");
	test.strictEqual(group0.name, "group0", "group0 has the correct name");
	
	// .execute()
	system0 = es.system(sDef0, 100);
	group0.append(system0);
	test.ok(group0.has(system0), "group0 has system0");
	test.ok(group0.has(system0.name), "group0 has system0 by name");
	group0.execute();
	test.strictEqual(nbExecutions, 3, "System0 was executed");
	
	// .remove()
	group0.remove(system0);
	test.ok(!group0.has(system0), "group0 has not system0");
	test.ok(!group0.has(system0.name), "group0 has not system0 by name");
	group0.execute();
	test.strictEqual(nbExecutions, 3, "System0 was executed");
	group0.append(system0);
	test.ok(group0.has(system0), "group0 has system0");
	
	
	// .pause()
	//test.ok(!group0.isPaused(system0), "System0 is not paused");
	group0.pause(system0);
	test.ok(group0.isPaused(system0), "System0 is paused");
	group0.execute();
	test.strictEqual(nbExecutions, 3, "System0 was not executed");
	group0.unpause(system0.name);
	test.ok(!group0.isPaused(system0.name), "System0 is not paused");
	group0.execute();
	test.strictEqual(nbExecutions, 4, "System0 was executed");
	
	test.done();
};
