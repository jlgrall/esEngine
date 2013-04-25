// Heap is like a pool, but for objects that are allocated and indexed in an array.
// It keeps track of unused indexes and automatically grows or shrinks the array as needed.

// Ideas ? :
// - http://stackoverflow.com/questions/3809800/javascript-i-need-a-good-data-structure-to-keep-a-sorted-list
// - http://eloquentjavascript.net/appendix2.html
// - http://jsperf.com/binary-heap/3

var 
	// Prototype for Heap:
	HeapManagerProto = {},
	
	HeapManager = function( nextIndex, releasedIndex, reducedHeap, options ) {
		
		// Retrieve all options:
		var 
			// The heap is an array:
			heap = options.heap || [],
			
			// Length of the heap array:
			length = options.length || heap.length,
			
			// isAvailable is a function that returns true when an index is available:
			isAvailable = options.isAvailable || function( i ) {
				return !!heap[i];
			},
			
			// Tells the default expandHeap() function by how much to expand the 
			// array each time it is run.
			expandAmount = options.expandAmount || 4,
			
			// expandHeap is called when there are no more available indexes.
			// It must return the new size of the heap, and there MUST be an available
			// index immediately at the position of the previous length.
			// Arguments: expandAmount, length, expandedLength, heap
			expandHeap = options.expandHeap || function( expandAmount, length, expandedLength ) {
				for( var i = length; i < expandedLength; i++ ) {
					heap[i] = undefined;
				}
				return expandedLength;
			},
			
			// Arguments: expandedLength
			onHeapExpanded = options.onHeapExpanded || noopFunc,
			
			// Tells the default reduceHeap() function what is the maximum number of available
			// indexes at the end, before it actually shrinks the heap.
			maxTrailingAllowed = options.maxTrailingAllowed || 16,
			
			// Tells the default reduceHeap() function how much space to keep
			// at the end of the heap when it is run.
			reduceAmount = options.reduceAmount || 4,
			
			// reduceHeap is called each time a last index of the heap is released.
			// It must return the new size of the heap. minLength is the minimum length
			// currently required by the heap.
			// Arguments: reduceAmount, length, reducedLength, heap, trailingAvailable
			reduceHeap = options.reduceHeap || function( reduceAmount ) {
				return heap.length -= reduceAmount;
			},
			
			// Arguments: reducedLength
			onHeapReduced = options.onHeapReduced || noopFunc,
			
			// onAcquired is called for every acquired index.
			// Arguments: index, heap
			onAcquired = options.onAcquired || noopFunc,
		
			// onAcquired is called for every released index.
			// Arguments: index, heap
			onReleased = options.onReleased || noopFunc;
		
		
		var 
			// Keep track of the higher used index, so we know when the heap can be shrunk:
			higherUsed = -1,
			
			nbActive = 0,
			
			makeNextAvailable = function() {
				var next = length;
				length = expandHeap( expandAmount, length, length + expandAmount, heap );
				onHeapExpanded( length );
				return next;
			},
			
			// Create the Heap:
			heapManager = compactCreate( HeapManagerProto, defPropsUnwritable, {
				getNbActive: function() {
					return nbActive;
				},
				acquire: function() {
					var index = nextIndex();
					nbActive++;
					if( higherUsed < index ) higherUsed = index;
					onAcquired( index, heap );
					return index;
				},
				release: function( index ) {
					onReleased( index, heap );
					releasedIndex( index );
					nbActive--;
					if( index === higherUsed ) {
						do {
							higherUsed--;
						} while( isAvailable( higherUsed ) );
						var trailingAvailable = length - ( higherUsed + 1 );
						if( trailingAvailable > maxTrailingAllowed ) {
							var newLength = reduceHeap( reduceAmount, length, length - reduceAmount, heap, trailingAvailable );
							if( newLength < length ) {
								length = newLength;
								reducedHeap( length );
								onHeapReduced( length );
							}
						}
					}
				}
			}, defPropsUnenumerableUnwritable, {
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
		
		return heapManager;
	};


var 
	SimpleHeap = function( options ) {
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
			// Called when the heap is reduced:
			reducedHeap = noopFunc;
		
		var heapManager = HeapManager( nextIndex, releasedIndex, reducedHeap, options ),
			nextAvailable = heapManager.nextAvailable,
			nextAvailableAutoExpand = heapManager.nextAvailableAutoExpand;
		
		return heapManager;
	},
	
	BufferedHeap = function( options ) {
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
			// Called when the heap is reduced:
			reducedHeap = function( length ) {
				// Trims the buffer of indexes higher than length.
				// It works because the buffer is always sorted.
				while( buffer[ bufferCount - 1 ] >= length ) bufferCount--;
			};
		
		var heapManager = HeapManager( nextIndex, releasedIndex, reducedHeap, options ),
			nextAvailable = heapManager.nextAvailable,
			makeNextAvailable = heapManager.makeNextAvailable;
		
		return heapManager;
	};
