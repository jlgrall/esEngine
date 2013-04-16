
var 
	// esEngine.cDefs, contains all defined ComponentDef:
	esEngine_cDefs = {},
	
	// Prototype for all componentDefs:
	ComponentDefProto = {},
	
	// esEngine.ComponentDef( objectDef ):
	ComponentDef = setProto( ComponentDefProto, function( objectDef ) {
	
		var name = objectDef.name;
	
		if( !isString( name ) ) throw "A component must have a name.";
		if( name in esEngine_cDefs ) throw "A ComponentDef already exists with the name: " + name;
	
		var 
			// Analyse the attributes, checking if they are correct:
			attr = objectDef.attr || {},
			analyse = analyseAttr( name, attr ),
		
			// Create the componentDef:
			cDef = compactCreate( ComponentDefProto, defPropsUnwritable, {
				name: name,
				init: objectDef.init || noopFunc,
				_set: objectDef.set || makeComponentDefSet( attr, analyse ),
				_reset: objectDef.reset || makeComponentDefReset( attr, analyse )
			}, defPropsFreeze, {
				attr: attr,
				helpers: compactCreate( ComponentProto, defProps, objectDef.helpers )
			});
	
		// Store the new componentDef:
		esEngine_cDefs[ name ] = cDef;
	
		return cDef;
	});

Object_freeze( ComponentDefProto );


// Analyse the definitions of the attributes for the future components.
// Returns a record of all attributs by kind (primitive value, array, or object).
// This record will allow us to make efficient functions to create (called "set"),
// or reset (called "reset") the components when they are reused.
var analyseAttr = function( name, attr ) {
		var keys = attr ? Object_keys( attr ) : [],
			prop,
			arrays = [],
			objects = [],
			key;
		
		for( var i = 0; i < keys.length; ) {
			key = keys[i];
			prop = attr[ key ];
			if( isArray( prop ) ) {
				if( prop.length > 0 ) throw "Only empty arrays are allowed for ComponentDef attributes (for now): " + name + "." + key;
				arrays.push( key );
				keys.splice( i, 1 );
			}
			else if( isObject( prop ) ) {
				for( var j in prop ) {
					throw "Only empty objects are allowed for ComponentDef attributes (for now): " + name + "." + key;
				}
				objects.push( key );
				keys.splice( i, 1 );
			}
			else i++;
		}
		
		return {
			primitives: keys,
			arrays: arrays,
			objects: objects
		};
	},
	// Returns a functions that efficiently creates the default attributes
	// on newly created components before init() is executed on them.
	makeComponentDefSet = function( attr, analyse ) {
		var primKeys = analyse.primitives,
			primKeysLength = primKeys.length,
			arraysKeys = analyse.arrays,
			arraysKeysLength = arraysKeys.length,
			objectsKeys = analyse.objects,
			objectsKeysLength = objectsKeys.length;
		
		return function(obj) {
			for( var i = 0; i < primKeysLength; i++ ) {
				obj[ primKeys[i] ] = attr[ primKeys[i] ];
			}
			for( i = 0; i < arraysKeysLength; i++ ) {
				obj[ arraysKeys[i] ] = [];
			}
			for( i = 0; i < objectsKeysLength; i++ ) {
				obj[ objectsKeys[i] ] = {};
			}
		};
	},
	// Returns a function that efficiently resets the attributes
	// of a component before it can be reused.
	makeComponentDefReset = function( attr, analyse ) {
		var primKeys = analyse.primitives,
			primKeysLength = primKeys.length,
			arraysKeys = analyse.arrays,
			arraysKeysLength = arraysKeys.length,
			objectsKeys = analyse.objects,
			objectsKeysLength = objectsKeys.length;
		
		return function( component ) {
			var i,
				object,
				key;
			for( i = 0; i < primKeysLength; i++ ) {
				component[ primKeys[i] ] = attr[ primKeys[i] ];
			}
			for( i = 0; i < arraysKeysLength; i++ ) {
				component[ arraysKeys[i] ].length = 0;
			}
			for( i = 0; i < objectsKeysLength; i++ ) {
				object = component[ objectsKeys[i] ];
				for( key in object ) {
					delete object[ key ];
				}
			}
		};
	};


var 
	// Prototype for all components:
	ComponentProto = Object_freeze({
		get $entity() {
			return this.$e;
		},
		set $entity( val ) {
			unsupportedOperationFunc();
		}
	});

// Component utils:
var toCreators = function( es, array, destArray, length ) {
		if( !destArray ) destArray = array;
		if( length === undefined ) length = array.length;
		var elem,
			componentCreator = es.componentCreator;
		for(var i = 0; i < length; i++ ) {
			elem = array[i];
			destArray[i] = elem._isCreator ? elem : componentCreator( elem );
		}
		return destArray;
	};


// cLinks
// 
var 
	// A pool for arrays used for cLinks:
	cLinkArraysPool = pool({
		constr: function() {
			return [];
		},
		reset: function( array ) {
			array.length = 0;
		},
		capacity: 512
	}),
	
	// Prototype for all cLinks:
	cLinkProto = Object_create({
		get c() {
			return this._c;
		},
		set c( component ) {
			var links;
			if( this._c !== null ) {
				links = this._c.$links;
				var _index = this._index,
					last = links.pop();
				if( _index !== links.length ) {
					links[ _index ] = last;
				}
			}
			this._c = component;
			if( component !== null ) {
				if( component.$e === 0 ) throw "The component to link to was not added to an entity";
				links = component.$links;
				if( links === null ) links = component.$links = cLinkArraysPool.acquire();
				this._index = links.push( this ) - 1;
			}
		}
	}),
	
	// es.cLink( component ).
	// Setup the cLink pool on top of the cLinkProto.
	cLink = setProto( cLinkProto, (function() {
		var instanceProperties = {
				_c: {
					writable: true,
					enumerable: false,
					value: null
				},
				_index: {
					writable: true,
					enumerable: false,
					value: -1
				}
			},
			constr = function() {
				var cLink = Object_create( cLinkProto );
				Object_defineProperties( cLink, instanceProperties );
				// Now we lock the cLink:
				Object_preventExtensions( cLink );
				return cLink;
			},
			init = function( component ) {
				if( component !== undefined && component !== null ) this.c = component;
			},
			reset = function( cLink ) {
				cLink.c = null;
			},
			poolDef = poolFactory( constr, init, noopFunc, noopFunc, reset, 512 ),
			notAnELinkFunc = function() {
				throw "This is not an eLink";
			};
		
		compactDefine( cLinkProto, defPropsUnwritable, {
			dispose: poolDef.disposer
		}, defPropsUnenumerableUnwritable, {
			_pool: poolDef.pool
		}, defDescriptors, {
			// Just in case someone mistakes this for an eLink:
			e: {
				enumerable: false,
				get: notAnELinkFunc,
				set: notAnELinkFunc,
			}
		});
		
		return poolDef.acquirer;
	})() );

Object_freeze( cLinkProto );
