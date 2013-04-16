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
		i, j;
	
	
    test.ok(entities instanceof es.bag, "Can use 'instanceof' with objects created by es.bag()");
    test.strictEqual(entities.constructor, es.bag, "Correct constructor for objects created by es.bag()");
	
	test.strictEqual(entities.name, "*", "es.entities.name is \"*\"");
	test.throws(function() {
		entities.name = "New name";
	}, /read only/, "Cannot change the name of es.entities");
	
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
	
    test.ok(products instanceof es.bag, "Can use 'instanceof' with objects created by es.bag()");
    test.strictEqual(products.constructor, es.bag, "Correct constructor for objects created by es.bag()");
	
	test.strictEqual(products.name, "products", "products.name is \"products\"");
	products.name = "New name";
	test.strictEqual(products.name, "New name", "products.name is \"New name\"");
	products.name = "products";
	
	
	test.strictEqual(entities.length, 0, "es.entities is empty");
	test.strictEqual(bag1.length, 0, "bag1 is empty");
	test.strictEqual(products.length, 0, "products is empty");
	var ent1, ent2, ent3, ent4, ent5;
	for(i=0; i<30; i++) {
		ent1 = es.newEntity(Product());
		ent2 = es.newEntity(Rare());
		ent3 = entities.newEntity(Product(), Rare());
		ent4 = entities.newEntity(Product(), Rare(), Used());
		ent5 = bag1.newEntity(Product(), Used());
		
		bag1.disposeEntity(ent2);
		
		
	}
	test.strictEqual(entities.length, 30*5-30*1, "All entities have been created");
	test.strictEqual(bag1.length, 30*1, "Bag1 contains all its entities");
	test.ok(!entities.has(ent2), "es.entities doesn't have the last removed entity");
	
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
	
	var anySelector = es.anySelector,
		selProduct = es.selector( cDefProduct ),
		selRareProduct = es.selector( cDefProduct, cDefRare ),
		selRareProductNotUsed = es.selector( { has: [ cDefProduct, cDefRare ], not: [ cDefUsed ] } );
	
    test.ok(anySelector instanceof es.selector, "Can use 'instanceof' with objects created by es.selector()");
    test.strictEqual(anySelector.constructor, es.selector, "Correct constructor for objects created by es.selector()");
	
    test.ok(selProduct instanceof es.selector, "Can use 'instanceof' with objects created by es.selector()");
    test.strictEqual(selProduct.constructor, es.selector, "Correct constructor for objects created by es.selector()");
	
	// selector.equals():
	test.ok(!selProduct.equals(anySelector), "selProduct not equals anySelector");
	test.ok(selProduct.equals(selProduct), "selProduct equals selProduct");
	test.ok(selRareProductNotUsed.equals(selRareProductNotUsed), "selRareProductNotUsed equals selRareProductNotUsed");
	test.ok(!selProduct.equals(selRareProduct), "selProduct not equals selRareProduct");
	test.ok(!selProduct.equals(selRareProductNotUsed), "selProduct not equals selRareProductNotUsed");
	
	// selector.matches():
	test.ok(anySelector.matches(ent1, ent3, ent4, ent5), "anySelector matches all");
	test.ok(selProduct.matches(ent1, ent3, ent4, ent5), "selProduct matches 1, 3, 4, 5");
	test.ok(selRareProduct.matches(ent3, ent4), "selRareProduct matches 3, 4");
	test.ok(!selRareProduct.matches(ent1), "selRareProduct matches not 1");
	test.ok(!selRareProduct.matches(ent5), "selRareProduct matches not 5");
	test.ok(selRareProductNotUsed.matches(ent3), "selRareProductNotUsed matches 3");
	test.ok(!selRareProductNotUsed.matches(ent4), "selRareProductNotUsed matches 4");
	
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
	
	testEntities = [1, es.eLink(32), 52, es.eLink(), 126];
	var nbTestEntities = testEntities.length - 1;
	
	// bag.addFrom() with entities
	test.ok(!bag1.has(1), "bag1 has not entity 1");
	bag1.addFrom.apply(bag1, testEntities);
	test.ok(bag1.has(1), "bag1 has entity 1");
	test.strictEqual(bag1.length, nbTestEntities, "bag1 is full");
	test.ok(bag1.hasFrom.apply(bag1, testEntities), "bag1 has the entities");
	
	// bag.removeFrom() with entities
	bag1.removeFrom.apply(bag1, testEntities);
	test.ok(!bag1.has(1), "bag1 has not entity 1");
	test.strictEqual(bag1.length, 0, "bag1 is empty");
	test.ok(!bag1.hasFrom.apply(bag1, testEntities), "bag1 has not the entities");
	
	// bag.addFrom() with entities and selector
	bag1.addFrom.apply(bag1, testEntities.concat([selRareProduct]));
	test.strictEqual(bag1.length, 2, "bag1 is full");
	test.ok(bag1.hasFrom.apply(bag1, testEntities.concat([selRareProductNotUsed])), "bag1 has the entities");
	
	// bag.removeFrom() with entities and selector
	bag1.removeFrom.apply(bag1, testEntities.concat([selRareProductNotUsed]));
	test.strictEqual(bag1.length, 1, "bag1 is empty");
	bag1.clear();
	test.ok(!bag1.hasFrom.apply(bag1, testEntities.concat([selRareProductNotUsed])), "bag1 has not the entities");
	
	// bag.addFrom() with array
	bag1.addFrom(testEntities);
	test.strictEqual(bag1.length, nbTestEntities, "bag1 is full");
	test.ok(bag1.hasFrom(testEntities), "bag1 has the entities");
	
	// bag.removeFrom() with array
	bag1.removeFrom(testEntities);
	test.strictEqual(bag1.length, 0, "bag1 is empty");
	test.ok(!bag1.hasFrom(testEntities), "bag1 has not the entities");
	
	// bag.addFrom() with array and selector
	bag1.addFrom(testEntities, selRareProduct);
	test.strictEqual(bag1.length, 2, "bag1 is full");
	test.ok(bag1.hasFrom(testEntities, selRareProductNotUsed), "bag1 has the entities");
	
	// bag.removeFrom() with array and selector
	bag1.removeFrom(testEntities, selRareProductNotUsed);
	test.strictEqual(bag1.length, 1, "bag1 is empty");
	bag1.clear();
	test.ok(!bag1.hasFrom(testEntities, selRareProductNotUsed), "bag1 has not the entities");
	
	// bag.addFrom() with es.entities
	test.strictEqual(products.length, 0, "products is empty");
	products.addFrom(entities);
	test.strictEqual(products.length, entities.length, "products is full");
	test.ok(products.hasFrom(entities), "products has the entities");
	
	// bag.removeFrom() with es.entities
	products.removeFrom(entities);
	test.strictEqual(products.length, 0, "products is empty");
	test.ok(!products.hasFrom(entities), "products has not the entities");
	
	// bag.addFrom() with es.entities and selector:
	test.strictEqual(products.length, 0, "products is empty");
	products.addFrom(entities, selRareProductNotUsed);
	test.strictEqual(products.length, 30*1, "products is filled");
	products.addFrom(entities, selRareProduct);
	test.strictEqual(products.length, 30*2, "products is filled");
	products.addFrom(entities, selProduct);
	test.strictEqual(products.length, 30*4, "products is full");
	test.ok(products.hasFrom(entities, selRareProductNotUsed), "products has the entities");
	
	// bag.removeFrom() with es.entities and selector:
	products.removeFrom(entities, selRareProductNotUsed);
	test.strictEqual(products.length, 30*3, "products was emptied");
	products.removeFrom(entities, selRareProduct);
	test.strictEqual(products.length, 30*2, "products was emptied");
	products.removeFrom(entities, selProduct);
	test.strictEqual(products.length, 0, "products is empty");
	test.ok(!products.hasFrom(entities, selRareProductNotUsed), "products has not the entities");
	
	// Prepare bag1 with entities:
	bag1.addFrom(entities);
	bag1.remove(3);
	test.strictEqual(bag1.length, entities.length - 1, "bag1 has all entities except 1");
	
	// bag.addFrom() with bag
	test.strictEqual(products.length, 0, "products is empty");
	products.addFrom(bag1);
	test.strictEqual(products.length, bag1.length, "products is full");
	test.ok(products.hasFrom(bag1), "products has the entities");
	
	// bag.removeFrom() with bag
	products.removeFrom(bag1);
	test.strictEqual(products.length, 0, "products is empty");
	test.ok(!products.hasFrom(bag1), "products has not the entities");
	
	// bag.addFrom() with bag and selector:
	test.strictEqual(products.length, 0, "products is empty");
	products.addFrom(bag1, selRareProductNotUsed);
	test.strictEqual(products.length, 30*1 - 1, "products is filled");
	products.addFrom(bag1, selRareProduct);
	test.strictEqual(products.length, 30*2 - 1, "products is filled");
	products.addFrom(bag1, selProduct);
	test.strictEqual(products.length, 30*4 - 1, "products is full");
	test.ok(products.hasFrom(bag1, selRareProductNotUsed), "products has the entities");
	
	// bag.removeFrom() with bag and selector:
	products.removeFrom(bag1, selRareProductNotUsed);
	test.strictEqual(products.length, 30*3, "products was emptied");
	products.removeFrom(bag1, selRareProduct);
	test.strictEqual(products.length, 30*2, "products was emptied");
	products.removeFrom(bag1, selProduct);
	test.strictEqual(products.length, 0, "products is empty");
	test.ok(!products.hasFrom(bag1, selRareProductNotUsed), "products has not the entities");
	
	
	
	// bag.dispose():
	bag1.add(5);
	test.ok(bag1.has(5), "bag1 has entity 5");
	bag1.dispose();
	// TODO: what can we test after dispose ?
	
	
	test.done();
};
