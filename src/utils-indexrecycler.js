// IndexRecycler is like a pool, but for objects that are in an array.
// It keeps track of unused indexes and automatically grows or shrinks the array as needed.

// Ideas ? :
// - http://stackoverflow.com/questions/3809800/javascript-i-need-a-good-data-structure-to-keep-a-sorted-list
// - http://eloquentjavascript.net/appendix2.html
// - http://jsperf.com/binary-heap/3

var 
	// Prototype for IndexRecycler:
	IndexRecyclerProto = {},
	
	IndexRecycler = function( array, nextIndex, releasedIndex, reducedArray, options ) {
		
		// Retrieve all options:
		var 
			// Length of the array:
			length = options.length || array.length,
			
			// isAvailable is a function that returns true when an index is available:
			isAvailable = options.isAvailable || function( i ) {
				return !!array[i];
			},
			
			// Tells the default expandArray() function by how much to expand the 
			// array each time it is run.
			expandAmount = options.expandAmount || 4,
			
			// expandArray is called when there are no more available indexes.
			// It must return the new size of the array, and there MUST be an available
			// index immediately at the position of the previous length.
			// Arguments: expandAmount, length, expandedLength, array
			expandArray = options.expandArray || function( expandAmount, length, expandedLength ) {
				for( var i = length; i < expandedLength; i++ ) {
					array[i] = undefined;
				}
				return expandedLength;
			},
			
			// Arguments: expandedLength
			onArrayExpanded = options.onArrayExpanded || noopFunc,
			
			// Tells the default reduceArray() function what is the maximum number of available
			// indexes at the end, before it actually shrinks the array.
			maxTrailingAvailable = options.maxTrailingAvailable || 16,
			
			// Tells the default reduceArray() function how much space to keep
			// at the end of the array when it is run.
			reduceAmount = options.reduceAmount || 4,
			
			// reduceArray is called each time a last index of the array is released.
			// It must return the new size of the array. minLength is the minimum length
			// currently required by the array.
			// Arguments: reduceAmount, length, reducedLength, array, trailingAvailable
			reduceArray = options.reduceArray || function( reduceAmount ) {
				return array.length -= reduceAmount;
			},
			
			// Arguments: reducedLength
			onArrayReduced = options.onArrayReduced || noopFunc,
			
			// onAcquired is called for every acquired index.
			// Arguments: index, array
			onAcquired = options.onAcquired || noopFunc,
		
			// onAcquired is called for every released index.
			// Arguments: index, array
			onReleased = options.onReleased || noopFunc;
		
		
		var 
			// Keep track of the higher used index, so we know when the array can be shrunk:
			higherUsed = -1,
			
			nbUsed = 0,
			
			makeNextAvailable = function() {
				var next = length;
				length = expandArray( expandAmount, length, length + expandAmount, array );
				onArrayExpanded( length );
				return next;
			},
			
			// Create the IndexRecycler:
			indexRecycler = compactCreate( IndexRecyclerProto, defPropsUnwriteable, {
				acquire: function() {
					var index = nextIndex();
					if( higherUsed < index ) higherUsed = index;
					onAcquired( index, array );
					return index;
				},
				release: function( index ) {
					onReleased( index, array );
					releasedIndex( index );
					if( index === higherUsed ) {
						do {
							higherUsed--;
						} while( isAvailable( higherUsed ) );
						var trailingAvailable = length - ( higherUsed + 1 );
						if( trailingAvailable > maxTrailingAvailable ) {
							var newLength = reduceArray( reduceAmount, length, length - reduceAmount, array, trailingAvailable );
							if( newLength < length ) {
								length = newLength;
								reducedArray( length );
								onArrayReduced( length );
							}
						}
					}
				}
			}, defPropsUnenumerableUnwriteable, {
				nextAvailable: function( from ) {
					while( from < length && !isAvailable( from )) from++;
					if( from === length ) {
						from = -1;
					}
					return from;
				},
				nextAvailableAutoExpand: function( from ) {
					while( from < length && !isAvailable( from )) from++;
					if( from === length ) {
						makeNextAvailable();
					}
					return from;
				},
				makeNextAvailable: makeNextAvailable
			});
		
		return indexRecycler;
	};


var 
	SimpleIndexRecycler = function( array, options ) {
		options =  options || {};
		
		var 
			// Keep track of the lowest index available:
			lowerAvailable = 0;
		
		var 
			// Returns the next index to be acquired:
			nextIndex = function() {
				var index = nextAvailableAutoExpand( lowerAvailable );
				lowerAvailable = index + 1;
				return index;
			},
			// Called with the released indexes:
			releasedIndex = function( index ) {
				if( index < lowerAvailable ) lowerAvailable = index;
			},
			// Called when the array is reduced:
			reducedArray = noopFunc;
		
		var indexRecycler = IndexRecycler( array, nextIndex, releasedIndex, reducedArray, options ),
			nextAvailable = indexRecycler.nextAvailable,
			nextAvailableAutoExpand = indexRecycler.nextAvailableAutoExpand;
		
		return indexRecycler;
	},
	
	BufferedIndexRecycler = function( array, options ) {
		options =  options || {};
		
		var 
			// Keep track of the lowest index available:
			lowerAvailable = 0,
			buffer = [],
			bufferCount = 0,
			bufferStart = 0;
		
		var 
			// bufferSize must be greater than 0:
			bufferSize = options.bufferSize || 64;
		
		// Allocate the buffer:
		for( var i = 0; i < bufferSize; i++ ) buffer[i] = 0;
		
		var 
			// Function that fills the buffer with available indexes:
			// Only called when the buffer is empty. Thus the content is always sorted.
			fillBuffer = function() {
				var index = lowerAvailable;
				while( bufferCount < bufferSize && ( index = nextAvailable( index ) ) != -1 ) {
					buffer[ bufferCount++ ] = index++;
					lowerAvailable = index;
				}
			},
			
			// Returns the next index to be acquired:
			nextIndex = function() {
				if( bufferCount === bufferStart ) {
					bufferCount = bufferStart = 0;
					fillBuffer();
					if( bufferCount === 0 ) {
						lowerAvailable = makeNextAvailable();
						return lowerAvailable++;
					}
				}
				return buffer[ bufferStart++ ];
			},
			// Called with the released indexes:
			releasedIndex = function( index ) {
				if( index < lowerAvailable ) lowerAvailable = index;
			},
			// Called when the array is reduced:
			reducedArray = function( length ) {
				// Trims the buffer of indexes higher than length.
				// It works because the buffer is always sorted.
				while( buffer[ bufferCount - 1 ] >= length ) bufferCount--;
			};
		
		var indexRecycler = IndexRecycler( array, nextIndex, releasedIndex, reducedArray, options ),
			nextAvailable = indexRecycler.nextAvailable,
			makeNextAvailable = indexRecycler.makeNextAvailable;
		
		return indexRecycler;
	};
