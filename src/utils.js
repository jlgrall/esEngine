
// Shortcuts (helps minifications):
var 
	Object_prototype = Object.prototype,
	Object_create = Object.create,
	Object_defineProperty = Object.defineProperty,
	Object_isPrototypeOf = Object.isPrototypeOf,
	Object_preventExtensions = Object.preventExtensions,
	Object_seal = Object.seal,
	Object_freeze = Object.freeze,
	Object_toString = Object_prototype.toString,
	Object_keys = Object.keys,
	Array_prototype = Array.prototype;


// Simple utility functions:
var 
	isString = function( value ) {
		return typeof value === "string" || value instanceof String;
	},
	isArray = Array.isArray || function ( value ) {
		return Object_toString.call( value ) === "[object Array]";
	},
	isFunction = function( value ) {
		return typeof value == 'function';
	},
	isObject = function( value ) {
		return value ? typeof value === "object" || typeof value === "function" : false;
	},
	isPrototypeOf = function( proto, object ) {
		return Object_isPrototypeOf.call( proto, object );
	},
	// Like jQuery.extend() (Deep is unsupported):
	extend = function( src ) {
		var args = arguments,
			nbArgs = args.length,
			obj,
			key;
		for( var i = 1; i < nbArgs; i++ ) {
			obj = args[i];
			for( key in obj ) {
				src[key] = obj[key];
			}
		}
		return src;
	},
	newNoopFunc = function() {
		return function() {};
	},
	noopFunc = newNoopFunc(),
	idFunc = function( val ) {
		return val;
	},
	unsupportedOperationFunc = function() {
		throw "Unsupported operation !";
	};


// Functions to define properties on objects:
var 
	defProps, // = undefined
	defPropsUnenumerable = {
		enumerable: false
	},
	defPropsUnwriteable = {
		writable: false
	},
	defPropsWriteable = {
		writable: true
	},
	defPropsFreeze = {
		freeze: true
	},
	defPropsPreventExtensions = {
		preventExtensions: true
	},
	defPropsUnenumerableUnwriteable = extend({}, defPropsUnenumerable, defPropsUnwriteable),
	defPropsUnwriteablePreventExtensions = extend({}, defPropsUnwriteable, defPropsPreventExtensions),
	defPropsUnwriteableFreeze = extend({}, defPropsUnwriteable, defPropsFreeze),
	defDescriptors = {
		descriptors: true
	},
	compactDefine = function( obj ) {
		var args = arguments,
			nbArgs = args.length,
			descriptor,
			props,
			keys,
			key;
		for( var i = 1; i < nbArgs; i += 2 ) {
			descriptor = args[ i ];
			props = args[ i + 1 ];
			if( !descriptor ) {
				for( key in props ) {
					obj[key] = props[key];
				}
			}
			else {
				var action = noopFunc;
				if( descriptor.descriptors ) {
					for( key in props ) {
						Object_defineProperty( obj, key, props[key] );
					}
					continue;
				}
				if( descriptor.preventExtensions ) {
					action = Object_preventExtensions;
				}
				if( descriptor.seal ) {
					action = Object_seal;
				}
				if( descriptor.freeze ) {
					action = Object_freeze;
				}
				for( key in props ) {
					obj[key] = props[key];
					Object_defineProperty( obj, key, descriptor );
					action( obj[key] );
				}
			}
		}
		return obj;
	},
	definePropertiesUnwriteable = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_defineProperty( object, args[i], defPropsUnwriteable );
		}
	},
	definePropertiesUnenumerable = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_defineProperty( object, args[i], defPropsUnenumerable );
		}
	},
	definePropertiesUnenumerableUnwriteable = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_defineProperty( object, args[i], defPropsUnenumerableUnwriteable );
		}
	},
	preventExtensionsProperties = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_preventExtensions( object[args[i]] );
			Object_defineProperty( object, args[i], defPropsUnwriteable );
		}
	},
	freezeProperties = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_freeze( object[args[i]] );
			Object_defineProperty( object, args[i], defPropsUnwriteable );
		}
	},
	freezeObjectAndProperties = function(object) {
		var args = arguments,
			nbArgs = args.length;
		for(var i = 1; i - nbArgs; i++) {
			Object_freeze( object[args[i]] );
		}
		return Object_freeze(object);
	};


// Functions to create objects:
var 
	compactCreate = function( proto ) {
		var args = arguments;
		args[0] = Object_create( proto );
		return compactDefine.apply( undefined, args );
	};
