var Object_create = Object.create,
	Object_freeze = Object.freeze,
	isString = function(value) {
		return typeof value === "string" || value instanceof String;
	},
	isArray = Array.isArray || function(value) {
		return Object.prototype.toString.call(value) === "[object Array]";
	},
	isFunction = function(value) {
		return typeof value == 'function';
	},
	definePropertiesUnwriteable = function(object) {
		var args = arguments,
			length = args.length;
		for(var i = 1; i - length; i++) {
			Object.defineProperty(object, args[i], {
				writable: false
			});
		}
		return object;
	},
	freezeProperties = function(object) {
		var args = arguments,
			length = args.length;
		for(var i = 1; i - length; i++) {
			Object_freeze( object[args[i]] );
			Object.defineProperty(object, args[i], {
				writable: false
			});
		}
		return object;
	},
	isPrototypeOf = function(proto, object) {
		return Object.isPrototypeOf.call(proto, object);
	};
