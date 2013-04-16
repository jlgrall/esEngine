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
		currentName.cName = "ComponentName_" + (++currentName.cId);
		return currentName.cName;
	};
	
	
	// STARTING THE TEST:
	
	
	// ComponentDef
	
	var cDef0,
		cDef1;
		
	test.ok(_.isFunction(esEngine.ComponentDef), "esEngine.ComponentDef is a function");
	
	test.throws(function() {
		esEngine.ComponentDef( {} );
	}, /name/, "A component must have a name");
	
	// esEngine.ComponentDef() with simple definition:
	cDef0 = esEngine.ComponentDef( { name: currentName.next() } );
	test.strictEqual(cDef0.name, currentName(), "cDef0 accepts only a name");
	test.ok(_.isObject(cDef0.attr) && _.isEmpty(cDef0.attr), "cDef0's default attr is an empty object");
	test.ok(_.isFunction(cDef0.init), "cDef0's default init is a function");
	test.ok(_.isObject(cDef0.helpers) && _.isEmpty(cDef0.helpers), "cDef0's default helpers is an empty object");
	
	test.ok(cDef0 instanceof esEngine.ComponentDef, "Can use 'instanceof' with objects created by esEngine.ComponentDef()");
    test.strictEqual(cDef0.constructor, esEngine.ComponentDef, "Correct constructor for objects created by esEngine.ComponentDef()");
	
	// esEngine.ComponentDef() with complete definition:
	cDef1 = esEngine.ComponentDef({
		name: currentName.next(),
		attr: {
			x: 42,
			y: 0,
			arr: [],
			obj: {}
		},
		init: function() {
			this.y = 3.1416;
		},
		helpers: {
			incrX: function() {
				this.x++;
			}
		}
	});
	test.strictEqual(cDef1.name, currentName(), "cDef1 has the correct name");
	test.ok(_.isObject(cDef1.attr), "cDef1's attr has properties");
	test.ok(cDef1.attr.x === 42 && cDef1.attr.y === 0 && _.isArray(cDef1.attr.arr) && _.isObject(cDef1.attr.obj), "cDef1's attr has all properties");
	test.ok(_.isFunction(cDef1.init), "cDef1's init is a function");
	test.ok(_.isObject(cDef1.helpers) && _.isFunction(cDef1.helpers.incrX), "cDef1's helpers has a function");
	
	
	// ComponentCreator (creation)
	
	var es = esEngine(),
		cCreator0,
		cCreator1,
		cCreator1b;
	
	cCreator0 = es.componentCreator( cDef0 );
    cCreator1 = es.componentCreator( currentName() );
    cCreator1b = es.componentCreator( cDef1 );
    
    test.ok(_.isFunction(cCreator1), "ComponentCreator is a function");
    
    test.strictEqual(cCreator1.def, cDef1, "ComponentCreator.def is the correct ComponentDef");
	
    test.strictEqual(cCreator1, cCreator1b, "By name and by reference return the same ComponentCreator");
	
	
	// Component (creation, dispose and reuse)
	
	var comp0,
		comp1;
	
	comp0 = cCreator0();
	comp1 = cCreator1();
	
	test.ok(comp0 instanceof cCreator0, "Can use 'instanceof' with objects created by creator()");
    test.strictEqual(comp0.constructor, cCreator0, "Correct constructor for objects created by creator()");
	
	test.strictEqual(comp1.$creator, cCreator1, "component.$creator is the correct ComponentCreator");
	
	test.ok(_.isFunction(comp1.$addTo), "ComponentCreator.$addTo is a function");
	
	test.ok(_.isFunction(comp1.$remove), "ComponentCreator.$remove is a function");
	
	test.ok(_.isFunction(comp1.$dispose), "ComponentCreator.$dispose is a function");
	
	test.ok(comp1.arr !== cDef1.attr.arr, "Attribute arr is not the same object as the ComponentDef attribute");
	test.ok(comp1.obj !== cDef1.attr.obj, "Attribute obj is not the same object as the ComponentDef attribute");
	
	test.strictEqual(comp1.x, 42, "Attribute x is initialized correctly");
	test.strictEqual(comp1.y, 3.1416, "Attribute y is initialized correctly");
	test.ok(_.isArray(comp1.arr) && _.isEmpty(comp1.arr), "Attribute arr is initialized correctly");
	test.ok(_.isObject(comp1.obj) && _.isEmpty(comp1.obj), "Attribute obj is initialized correctly");
	
	comp1.incrX();
	test.strictEqual(comp1.x, 43, "Methods work on attributes");
	
	test.throws(function() {
		comp1.anyNewProperty = "FORBIDDEN";
	}, /extensible/, "Components are not extensible");
	
	comp1.x = -1;
	comp1.y = 3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679;
	comp1.arr.push(-1);
	comp1.obj.anyKey = -1;
	comp1.$dispose();
	var comp1b = comp1;
	comp1 = cCreator1();
	test.strictEqual(comp1, comp1b, "The pool reuses the disposed component");
	test.strictEqual(comp1.x, 42, "Reused component's key is correctly reset");
	test.strictEqual(comp1.y, 3.1416, "Reused component's key is correctly reset");
	test.strictEqual(comp1.arr.length, 0, "Reused component's array is correctly reset");
	test.ok(_.isEmpty(comp1.obj), "Reused component's object is correctly reset");
	
	
	// Component (adding to entities)
	
	var entity1,
		entity1b;
	
	test.throws(function() {
		comp1.$entity = 100;
	}, /Unsupported/, "The entity of a component cannot be modified");
	
	test.strictEqual(comp1.$entity, 0, "The component was not added to an entity");
	entity1 = es.newEntity(comp1);
	test.strictEqual(comp1.$entity, entity1, "The component was added to the entity");
	
	test.throws(function() {
		comp1.$addTo(entity1);
	}, /added/, "The component cannot be added to another entity");
	
	comp1b = cCreator1();
	test.throws(function() {
		comp1b.$addTo(entity1);
	}, /type/, "Cannot add another component of the same type");
	
	
	// Component (getting from entities)
	
	comp1b = cCreator1.getFor(entity1);
	test.strictEqual(comp1, comp1b, "component.getFor() returns the correct component");
	
	comp1b = cCreator0.getFor(entity1);
	test.strictEqual(comp1b, null, "component.getFor() returns null when there is no component");
	
	
	// Component (removing from entities)
	// Always keep at least one component in the entity so it is not diposed.
	
	comp0.$addTo(entity1);
	
	comp1.x = 100;
	comp1.$remove();
	test.strictEqual(comp1.$entity, 0, "The component was removed from the entity");
	test.strictEqual(cCreator1.getFor(entity1), null, "The component was removed from the entity");
	test.strictEqual(comp1.x, 100, "The component's attributes weren't modified");
	
	test.throws(function() {
		comp1.$remove();
	}, /not added/, "Cannot remove a component that was already removed");
	
	comp1.$addTo(entity1);
	test.strictEqual(comp1.$entity, entity1, "The component was re added to the entity");
	test.strictEqual(cCreator1.getFor(entity1), comp1, "The component was re added to the entity");
	comp1.$dispose();
	test.strictEqual(comp1.$entity, 0, "The component was removed from the entity");
	test.strictEqual(cCreator1.getFor(entity1), null, "The component was removed from the entity");
	comp1 = null;
	
	
	// cLinks
	
	comp1 = cCreator1();
	comp1.$addTo(entity1);
	var cLink0 = es.cLink(),
		cLink1 = es.cLink(comp1);
	
	test.ok(cLink0 instanceof es.cLink, "Can use 'instanceof' with objects created by es.cLink()");
    test.strictEqual(cLink0.constructor, es.cLink, "Correct constructor for objects created by es.cLink()");
	
	test.strictEqual(cLink0.c, null, "cLink0 doesn't link to a component");
	test.strictEqual(cLink1.c, comp1, "cLink1 links to comp1");
	
	cLink0.c = comp0;
	test.strictEqual(cLink0.c, comp0, "cLink0 links to comp0");
	cLink1.c = null;
	test.strictEqual(cLink1.c, null, "cLink1 doesn't link to a component");
	
	comp0.$remove();
	test.strictEqual(cLink0.c, null, "cLink0 doesn't link to a component");
	
	test.throws(function() {
		cLink0.c = comp0;
	}, /not added/, "Cannot link to a component that was not added to an entity");
	comp0.$addTo(entity1);
	
	cLink1.c = comp1;
	cLink1.dispose();
	// Testing .dispose() (Though when an object is disposed we shouldn't access it.)
	test.strictEqual(cLink1.c, null, "cLink1 doesn't link to a component");
	
	test.done();
};
