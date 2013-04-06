var poolFactory = function( constr, init, onAcquired, onReleased, reset, capacity ) {
		if(!reset) reset = idFunc;
		if(!capacity) capacity = 20;
		var stack = [],
			count = 0,
			created= 0,
			dropped= 0,
			pool = {
				get count() { return count; },
				get capacity() {
					return capacity;
				},
				set capacity(val) {
					if(val < stack.length) {
						stack.length = val;
					}
					capacity = val;
				},
				drop: function(nb) {
					if(nb === undefined || nb > count) nb = count;
					while(nb-- > 0) {
						stack[--count] = null;
					}
				},
				get created() { return created; },
				set created(val) { created = val; },
				get dropped() { return dropped; },
				set dropped(val) { dropped = val; }
			};
		return {
			acquirer: function() {
				var obj;
				if( count > 0 ) {
					obj = stack[--count];
					stack[count] = null;
				}
				else {
					obj = constr();
					created++;
				}
				init.apply(obj, arguments);
				onAcquired(obj);
				return obj;
			},
			releaser: function(obj) {
				onReleased(obj);
				if(count < capacity) {
					reset(obj);
					stack[count++] = obj;
				}
				else dropped++;
			},
			disposer: function() {
				onReleased(this);
				if(count < capacity) {
					reset(this);
					stack[count++] = this;
				}
				else dropped++;
			},
			pool: pool
		};
	},
	attachPool = function(klass, options) {
		if(klass._pool) throw "This is already a pool: " + klass;
		var def = poolFactory(options.constr, options.init, options.reset, options.capacity),
			acquireName = options.acquireName || "acquire",
			releaseName = options.releaseName || "release",
			disposeName = options.disposeName || "dispose",
			proto = options.proto;
		klass[acquireName] = def.acquirer;
		klass[releaseName] = def.releaser;
		if(proto) proto[disposeName] = def.disposer;
		klass._pool = def.pool;
		return klass;
	},
	// The class for the pools:
	Pool = {},
	pool = function(options) {
		return attachPool(Object_create(Pool), options);
	};
