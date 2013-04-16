
var 
	// Prototype for all Selectors:
	SelectorProto = Object_freeze( {
		equals: function( oSelector ) {
			return this._es === oSelector._es && this._id === oSelector._id;
		}
	});

var 
	// Prototype for all Bags:
	BagProto = compactDefine({
		add: function() {
			var args = arguments,
				nbArgs = args.length,
				entities = this._e,
				i;
			for( i = 0; i < nbArgs; i++ ) {
				this.addOne( args[i] );
			}
		},
		addOne: function( entity ) {
			if(!this._e[ entity ]) {
				this._length++;
				this._e[ entity ] = true;
			}
		},
		addFrom: function() {
			this._doForEntitiesFrom( this.addOne, arguments );
		},
		remove: function() {
			var args = arguments,
				nbArgs = args.length,
				entities = this._e,
				i;
			for( i = 0; i < nbArgs; i++ ) {
				this.removeOne( args[i] );
			}
		},
		removeOne: function( entity ) {
			if(this._e[ entity ]) {
				this._length--;
				delete this._e[ entity ];
			}
		},
		removeFrom: function() {
			this._doForEntitiesFrom( this.removeOne, arguments );
		},
		has: function() {
			var args = arguments,
				nbArgs = args.length,
				entities = this._e,
				i;
			for( i = 0; i < nbArgs; i++ ) {
				if( !entities[ args[i] ]) return false;
			}
			return true;
		},
		hasOne: function( entity ) {
			return !!this._e[ entity ];
		},
		hasFrom: function() {
			return this._doForEntitiesFrom( this.hasOne, arguments, true, true );
		},
		keep: function( selector ) {
			
		},
		discard: function( selector ) {
			
		},
		each: function( callback, thisArg ) {
			var entities = this._e;
			for( var entity in entities ) {
				if( callback.call( thisArg, entity, this ) === false ) return false;
			}
		},
		clear: function() {
			var entities = this._e,
				i;
			for( i in entities ) {
				delete entities[i];
			}
			// This is ok, because es.entities has no .clear():
			this._length = 0;
		}
	}, defPropsUnenumerableUnwriteable, {
		_doForEntitiesFrom: function( action, args, continueResult, endResult ) {
			var nbArgs = args.length,
				hasSelector = isPrototypeOf( SelectorProto, args[ nbArgs - 1 ] ),
				selector = null,
				entities = this._e,
				length2,
				arg,
				entity,
				i, j,
				result,
				eachCallback = hasSelector ? function( entity ) {
					if( selector.matches( entity ) ) {
						result = action.call( this, entity );
						if( result !== continueResult ) return false;
					}
				} : function( entity ) {
					result = action.call( this, entity );
					if( result !== continueResult ) return false;
				};
			if( hasSelector ) {
				nbArgs--;
				selector = args[ nbArgs ];
			}
			for( i = 0; i < nbArgs; i++ ) {
				arg = args[i];
				if( arg > 0 ) {
					entity = arg;
					if( !selector || selector.matches( entity ) ) {
						result = action.call( this, entity );
						if( result !== continueResult ) return result;
					}
				}
				else if( isArray( arg ) ) {
					length2 = arg.length;
					for( j = 0; j < length2; j++ ) {
						entity = arg[j];
						if( !selector || selector.matches( entity ) ) {
							result = action.call( this, entity );
							if( result !== continueResult ) return result;
						}
					}
				}
				else if( isPrototypeOf( BagProto, arg ) ) {
					if( arg.each( eachCallback, this ) === false ) return result;
				}
				else throw "This is not a collection of entities: " + arg;
			}
			return endResult;
		}
	});
