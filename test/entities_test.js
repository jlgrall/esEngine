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
		currentName.cName = "EntitiesName_" + (++currentName.cId);
		return currentName.cName;
	};
	
	
	// STARTING THE TEST:
	
	
	// eLinks
	
	var cDef0 = esEngine.ComponentDef( { name: currentName.next() } ),
		es = esEngine(),
		cCreator0 = es.componentCreator(cDef0),
		entity = es.newEntity(cCreator0());
	
	var eLink0 = es.eLink(),
		eLink1 = es.eLink(entity);
	
	test.ok(eLink0 instanceof es.eLink, "Can use 'instanceof' with objects created by es.eLink()");
    test.strictEqual(eLink0.constructor, es.eLink, "Correct constructor for objects created by es.eLink()");
	
	test.strictEqual(eLink0.e, 0, "eLink0 doesn't link to an entity");
	test.strictEqual(eLink1.e, entity, "eLink1 links to comp1");
	
	eLink0.e = entity;
	test.strictEqual(eLink0.e, entity, "eLink0 links to entity");
	eLink1.e = 0;
	test.strictEqual(eLink1.e, 0, "eLink1 doesn't link to an entity");
	
	es.disposeEntity(entity);
	test.strictEqual(eLink0.e, 0, "eLink0 doesn't link to an entity");
	
	test.throws(function() {
		eLink0.e = entity;
	}, /not exist/, "Cannot link to an entity that does not exist");
	entity = es.newEntity(cCreator0());
	
	eLink1.e = entity;
	eLink1.dispose();
	// Testing .dispose() (Though when an object is disposed we shouldn't access it.)
	test.strictEqual(eLink1.e, 0, "eLink1 doesn't link to an entity");
	
	
	test.done();
};
