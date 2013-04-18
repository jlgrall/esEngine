
// Shortcuts (helps minifications):
var 
	Object_prototype = Object.prototype,
	Object_create = Object.create,
	Object_defineProperty = Object.defineProperty,
	Object_defineProperties = Object.defineProperties,
	Object_isPrototypeOf = Object.isPrototypeOf,
	Object_preventExtensions = Object.preventExtensions,
	Object_seal = Object.seal,
	Object_freeze = Object.freeze,
	Object_proto_toString = Object_prototype.toString,
	Object_keys = Object.keys,
	Array_prototype = Array.prototype,
	Array_proto_slice = Array_prototype.slice;


// Simple utility functions:
var 
	isString = function( value ) {
		return typeof value === "string" || value instanceof String;
	},
	isArray = Array.isArray || function ( value ) {
		return Object_proto_toString.call( value ) === "[object Array]";
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
	emptyArray = Object_freeze( [] ),
	unsupportedOperationFunc = function() {
		throw "Unsupported operation !";
	},
	disposedObjectFunc = function() {
		throw "This object was disposed: " + this;
	};


// Functions to define properties on objects:
var 
	defProps, // = undefined
	defPropsUnenumerable = {
		enumerable: false
	},
	defPropsUnwritable = {
		writable: false
	},
	defPropsWritable = {
		writable: true
	},
	defPropsFreeze = {
		freeze: true
	},
	defPropsPreventExtensions = {
		preventExtensions: true
	},
	defPropsUnenumerableUnwritable = extend({}, defPropsUnenumerable, defPropsUnwritable),
	defPropsUnwritablePreventExtensions = extend({}, defPropsUnwritable, defPropsPreventExtensions),
	defPropsUnwritableFreeze = extend({}, defPropsUnwritable, defPropsFreeze),
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
					Object_defineProperties( obj, props );
				}
				else {
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
		}
		return obj;
	},
	definePropertiesUnwritable = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_defineProperty( object, args[i], defPropsUnwritable );
		}
	},
	definePropertiesUnenumerable = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_defineProperty( object, args[i], defPropsUnenumerable );
		}
	},
	definePropertiesUnenumerableUnwritable = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_defineProperty( object, args[i], defPropsUnenumerableUnwritable );
		}
	},
	preventExtensionsProperties = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_preventExtensions( object[args[i]] );
			Object_defineProperty( object, args[i], defPropsUnwritable );
		}
	},
	freezeProperties = function( object ) {
		var args = arguments,
			nbArgs = args.length;
		for( var i = 1; i < nbArgs; i++ ) {
			Object_freeze( object[args[i]] );
			Object_defineProperty( object, args[i], defPropsUnwritable );
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
	},
	setProto = function( prototype, constructor ) {
		// Allow the use of instanceof with components:
		constructor.prototype = prototype;
		// Also set the correct constructor (not necessary, but good practice):
		prototype.constructor = constructor;
	
		return constructor;
	};
