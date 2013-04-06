
var BagProto = compactDefine({
		add: function() {
			var args = arguments,
				length = args.length,
				entities = this._e,
				i;
			for( i = 0; i < length; i++ ) {
				entities[ args[i] ] = true;
			}
		},
		addOne: function( entity ) {
			this._e[ entity ] = true;
		},
		addFrom: function() {
			this._doForEntitiesFrom( this.addOne, arguments );
		},
		remove: function() {
			var args = arguments,
				length = args.length,
				entities = this._e,
				i;
			for( i = 0; i < length; i++ ) {
				delete entities[ args[i] ];
			}
		},
		removeOne: function( entity ) {
			delete this._e[ entity ];
		},
		removeFrom: function() {
			this._doForEntitiesFrom( this.removeOne, arguments );
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
		}
	}, defPropsUnwriteable, {
		_doForEntitiesFrom: function( action, args ) {
			var selector = null,
				length = args.length - (selector ? 1 : 0),
				entities = this._e,
				oEntities,
				length2,
				arg,
				i, j;
			for( i = 1; i < length; i++ ) {
				arg = args[i];
				if( arg > 0 ) {
					action.call( this, arg );
				}
				else if( isArray( arg ) ) {
					length2 = arg.length;
					for( j = 0; j < length2; j++ ) {
						action.call( this, arg[j] );
					}
				}
				else if( isPrototypeOf( BagProto, arg ) ) {
					oEntities = arg._e;
					for( j in oEntities ) {
						action.call( this, j );
					}
				}
				else throw "This is not an entity container: " + arg;
			}
		}
	});
