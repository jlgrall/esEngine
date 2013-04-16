
var BagProto = compactDefine({
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
		clear: function() {
			var entities = this._e,
				i;
			for( i in entities ) {
				delete entities[i];
			}
			// This is ok, because es.entities has no .clear():
			this._length = 0;
		}
	}, defPropsUnwriteable, {
		_doForEntitiesFrom: function( action, args, continueResult, endResult ) {
			var selector = null,
				length = args.length - (selector ? 1 : 0),
				entities = this._e,
				oEntities,
				length2,
				arg,
				i, j,
				result;
			for( i = 1; i < length; i++ ) {
				arg = args[i];
				if( arg > 0 ) {
					result = action.call( this, arg );
					if( result !== continueResult ) return result;
				}
				else if( isArray( arg ) ) {
					length2 = arg.length;
					for( j = 0; j < length2; j++ ) {
						result = action.call( this, arg[j] );
						if( result !== continueResult ) return result;
					}
				}
				else if( isPrototypeOf( BagProto, arg ) ) {
					oEntities = arg._e;
					for( j in oEntities ) {
						result = action.call( this, j );
						if( result !== continueResult ) return result;
					}
				}
				else throw "This is not an entity container: " + arg;
			}
			return endResult;
		}
	});
