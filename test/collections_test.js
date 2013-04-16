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
		currentName.cName = "CollectionName_" + (++currentName.cId);
		return currentName.cName;
	};
	
	
	// STARTING THE TEST:
	
	var cDefProduct = esEngine.ComponentDef( {
			name: "Product",
			attr: {
				price: 0
			},
			init: function( price ) {
				this.price = price || 0;
			}
		}),
		cDefRare = esEngine.ComponentDef( {
			name: "Rare"
		}),
		cDefUsed = esEngine.ComponentDef( {
			name: "Used",
			attr: {
				damage: 0.0	// Between 0.0 and 1.0
			},
			init: function( damage ) {
				this.damage = damage || 0;
			}
		});
	
	var es = esEngine(),
		entities = es.entities,
		Product = es.componentCreator(cDefProduct),
		Rare = es.componentCreator(cDefRare),
		Used = es.componentCreator(cDefUsed),
		bag1 = es.bag(),
		products = es.bag("products"),
		entity,
		i, j;
	
	
	test.strictEqual(entities.name, "*", "es.entities.name is \"*\"");
	
	test.throws(function() {
		entities.add();
	}, /Unsupported/, "Cannot directly add or remove entities from es.entities");
	test.throws(function() {
		entities.addFrom();
	}, /Unsupported/, "Cannot directly add or remove entities from es.entities");
	test.throws(function() {
		entities.remove();
	}, /Unsupported/, "Cannot directly add or remove entities from es.entities");
	test.throws(function() {
		entities.removeFrom();
	}, /Unsupported/, "Cannot directly add or remove entities from es.entities");
	test.throws(function() {
		entities.keep();
	}, /Unsupported/, "Cannot directly add or remove entities from es.entities");
	test.throws(function() {
		entities.discard();
	}, /Unsupported/, "Cannot directly add or remove entities from es.entities");
	test.throws(function() {
		entities.clear();
	}, /Unsupported/, "Cannot directly add or remove entities from es.entities");
	test.throws(function() {
		entities.dispose();
	}, /Unsupported/, "es.entities cannot be disposed");
	
	
	test.strictEqual(entities.length, 0, "es.entities is empty");
	test.strictEqual(bag1.length, 0, "bag1 is empty");
	test.strictEqual(products.length, 0, "products is empty");
	for(i=0; i<30; i++) {
		es.newEntity(Product());
		entity = es.newEntity(Rare());
		entities.newEntity(Product(), Rare());
		entities.newEntity(Product(), Rare(), Used());
		bag1.newEntity(Product(), Used());
		
		bag1.disposeEntity(entity);
	}
	test.strictEqual(entities.length, 30*5-30*1, "All entities have been created");
	test.strictEqual(bag1.length, 30*1, "Bag1 contains all its entities");
	test.ok(!entities.has(entity), "es.entities doesn't have the last removed entity");
	
	// This is not strictly defined in the API: test which entity ids have been removed.
	// The actual ids may vary, and this test let us know when they change so we can verify if it is a bug:
	var hasNot = [22, 47, 72, 97, 117, 122];
	for(i=1; i<entities.length + 1 + hasNot.length; i++) {
		if(_.contains(hasNot, i)) {
			test.ok(!entities.has(i), "Entity " + i + " was removed");
		}
		else {
			test.ok(entities.has(i), "Entity " + i + " has been created");
		}
	}
	
	// We will try to add and remove these entities:
	var testEntities = [1, 52, 126];
	// Check these entities exist:
	test.ok(entities.has.apply(entities, testEntities), "es.entities doesn't have the last removed entity");
	test.ok(!bag1.has.apply(bag1, testEntities), "bag1 has not the entities");
	bag1.add.apply(bag1, testEntities);
	// Can add twice the same entity:
	bag1.add(testEntities[0]);
	test.strictEqual(bag1.length, 30*1 + testEntities.length, "Bag1 contains the added entities");
	test.ok(bag1.has.apply(bag1, testEntities), "bag1 has the added entities");
	bag1.remove.apply(bag1, testEntities);
	// Can remove twice the same entity:
	bag1.remove(testEntities[0]);
	test.strictEqual(bag1.length, 30*1, "Bag1 contains doesn't contain the removed entities");
	test.ok(!bag1.has.apply(bag1, testEntities), "bag1 has not the removed entities");
	
	// bag.clear():
	test.ok(bag1.has(5), "bag1 has entity 5");
	bag1.clear();
	test.strictEqual(bag1.length, 0, "bag1 was cleared");
	test.ok(!bag1.has(5), "bag1 has no entity 5");
	test.ok(entities.has(5), "Entity 5 was not destroyed");
	
	bag1.add(5);
	test.ok(bag1.has(5), "bag1 has entity 5");
	bag1.dispose();
	// TODO: what can we test after dispose ?
	
	
	test.done();
};
