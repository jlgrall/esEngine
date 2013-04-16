
// A list that sets unique ids to each element and allows efficient (unordered) iterations and lookups.
// Better for cases where you don't often add and remove objects.
// Ids are set to the property: element._id
// Ids are never modified until the element is removed.
// Efficient iteration: a dense array containing all the elements (list.array).
// Efficient lookup: a map of the ids (list.map) backed by an array (which is more efficient than an object).
// Adding and removing elements need iterations, because the array is unordered and not indexed.
// Note: ids are reused.

var RecycledIndexedListProto = {
		add: function( obj ) {
			var map = this.map,
				// Get the new id:
				id = this._indexRecycler.acquire();
			obj._id = id;
			Object_defineProperty( obj, "_id", defPropsUnwritable );
			
			// Add the object to the map and to the array:
			map[ id ] = obj;
			this.array.push( obj );
		},
		remove: function( obj ) {
			var array = this.array,
				length = array.length,
				// The object id is not reset on the object.
				id = obj._id,
				last;
			
			// Remove the object from the map and the array:
			this.map[ id ] = undefined;
			this._indexRecycler.release( id );
			for( var i = 0; i < length; i++ ) {
				if( array[i] === obj ) {
					// Because the array is unordered, we can the removed object with
					// the last object. It's faster than array.split( i, 1 ):
					last = array.pop();
					if( i !== length - 1 ) array[i] = last;
					return;
				}
			}
			Object_defineProperty( obj, "_id", defPropsWritable );
		}
	},
	RecycledIndexedList = function( indexRecyclerOptions ) {
		var 
			// Map is a dense array too, because the use of a SimpleIndexRecycler 
			// makes sure that all indexes are used efficiently (ie. holes are reused).
			// Map can have some elements set to undefined though.
			map = [],
			indexRecycler = SimpleIndexRecycler( map, indexRecyclerOptions ),
			list = compactCreate( RecycledIndexedListProto, defProps, {
				array: [],
				map: map
			}, defPropsUnenumerableUnwritable, {
				_indexRecycler: indexRecycler
			});
		
		return list;
	};


// Based on a RecycledIndexedList, allows to have a name associated to each object.
// Note: doesn't check if the name is already used.
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
		var 
			list = RecycledIndexedList(),
			namedList = compactCreate( RecycledIndexedNamedListProto, defProps, {
				array: list.array,
				map: list.map,
				names: {}
			}, defPropsUnenumerableUnwritable, {
				_list: list
			});
		
		return namedList;
	};
