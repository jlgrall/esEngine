
// A list that sets unique ids to each element and allows efficient (unordered) iterations.
// Ids are set to the property: element._id
// Ids are never modified until the element is removed.
// Efficient iteration: a dense array containing all the elements (list.array).
// Efficient lookup: a map of the ids (list.map) backed by an array.
// Adding and removing elements are slower.
// Note: ids are reused.

var RecycledIndexedListProto = {
		add: function( obj ) {
			var map = this.map,
				id = this._indexRecycler.acquire();
			obj._id = id;
			map[ id ] = obj;
			this.array.push( obj );
		},
		remove: function( obj ) {
			var array = this.array,
				length = array.length,
				id = obj._id;
			this.map[ id ] = undefined;
			this._indexRecycler.release( id );
			for( var i = 0; i < length; i++ ) {
				if( array[i] === obj ) {
					array.splice( i, 1 );
					return;
				}
			}
		}
	},
	RecycledIndexedList = function( indexRecyclerOptions ) {
		var map = [],
			indexRecycler = SimpleIndexRecycler( map, indexRecyclerOptions ),
			list = compactCreate( RecycledIndexedListProto, defProps, {
				array: [],
				map: map
			}, defPropsUnenumerableUnwriteable, {
				_indexRecycler: indexRecycler
			});
		
		return list;
	};


var RecycledIndexedNamedListProto = {
		add: function( name, obj ) {
			this._list.add( obj );
			this.names[ name ] = obj;
		},
		remove: function( name ) {
			var names = this.names;
			this._list.remove( names[ name ] );
			delete names[ name ];
		}
	},
	RecycledIndexedNamedList = function() {
		var list = RecycledIndexedList(),
			namedList = compactCreate( RecycledIndexedNamedListProto, defProps, {
				array: list.array,
				map: list.map,
				names: {}
			}, defPropsUnenumerableUnwriteable, {
				_list: list
			});
		
		return namedList;
	};
