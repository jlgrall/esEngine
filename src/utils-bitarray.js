// Fast BitArray implementations for internal use.
// There is no check on received arguments, so be careful.

// Inspired by: https://github.com/bramstein/bit-array and https://github.com/madrobby/bitarray.js
// http://blog.n01se.net/blog-n01se-net-p-248.html
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
// ~~ = Math.floor(). See:  http://rocha.la/JavaScript-bitwise-operators-in-practice

var 
	// Number of useable bits in bitwise operations in a JavaScript number:
	INTEGERBITS = 32,
	
	// Used for lookups in counting trailing 0s:
	// See: http://graphics.stanford.edu/~seander/bithacks.html#ZerosOnRightMultLookup
	MultiplyDeBruijnBitPosition = Object_freeze([
		0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
		31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
	]),
	
	// Returns the position of the lower set bit:
	// See: http://stackoverflow.com/questions/757059/position-of-least-significant-bit-that-is-set
	lowerSetBit = function( v ) {
		return MultiplyDeBruijnBitPosition[ ( ( v & -v ) * 0x077CB531 ) >> 27 ];
	},
	
	// Returns the positions of the lower not set bit:
	// Uses:
	// - Bit Hack #9: Isolate the rightmost 0-bit (http://www.catonmat.net/blog/low-level-bit-hacks-you-absolutely-must-know/)
	// - And the formula from the previous function lowerSetBit().
	lowerUnsetBit = function( v ) {
		return MultiplyDeBruijnBitPosition[ ( ( v | (v-1) ) * 0x077CB531 ) >> 27 ];
	};


// An array of bitArrays to efficiently manage many bitArrays.
// Every method requires the index of the bitArray (named "bitarray") on which you want to work.
// The second argument is usually the position of the bit you want to access.
// Each bitArray keeps an internal counter of bitsSet, that is, how many bits are true.
var 
	// Prototype of ArrayOfBitArray:
	ArrayOfBitArrayProto = compactDefine( {}, defPropsUnwriteable, {
		// Set a bit at pos to true.
		// Don't execute if the bit is already true, or the bitsSet will be shifted !
		set: function( bitArray, pos ) {
			this._arr[ ~~( pos / INTEGERBITS ) ][ bitArray ] |= 1 << ( pos % INTEGERBITS );
			return ++this._bitsSet[ bitArray ];
		},
		// Set a bit at pos to false.
		// Don't execute if the bit is already false, or the bitsSet will be shifted !
		unset: function( bitArray, pos ) {
			this._arr[ ~~( pos / INTEGERBITS ) ][ bitArray ] &= ~( 1 << ( pos % INTEGERBITS ) );
			return --this._bitsSet[ bitArray ];
		},
		// Returns true if the bit at pos is set:
		isSet: function( bitArray, pos ) {
			return ( this._arr[ ~~( pos / INTEGERBITS ) ][ bitArray ] & 1 << ( pos % INTEGERBITS ) ) !== 0;
		},
		// Return the number of bits that are true:
		// Returns the current value of the internal bitsSet counter.
		bitsSet: function( bitArray ) {
			return this._bitsSet[ bitArray ];
		},
		// Executes callback for each bit set.
		// Callback receives 2 arguments: position of the bit, index of the bitArray.
		eachSet: function( bitArray, callback ) {
			var arr = this._arr,
				nbValues = arr.length,
				val,
				lowestBit,
				pos;
			
			for( var v = 0; v < nbValues; v++ ) {
				val = this._arr[v][ bitArray ];
				while( val !== 0 ) {
					lowestBit = val & -val;
					val &= ~lowestBit;
					pos = MultiplyDeBruijnBitPosition[ ( lowestBit * 0x077CB531 ) >> 27 ];
					callback( pos, bitArray );
				}
			}
		},
		// Resets the internal bitsSet counter to the current number of bits set:
		resetBitSet: function( bitArray ) {
			// http://graphics.stanford.edu/~seander/bithacks.html#CountBitsSetKernighan
			var arr = this._arr,
				nbValues = arr.length,
				val,
				count = 0;
			for( var v = 0; v < nbValues; v++ ) {
				val = arr[v][ bitArray ];
				for( ; val !== 0; count++ ) {
					val &= val - 1;
				}
			}
			this._bitsSet[ bitArray ] = count;
			return count;
		},
		// Resets all bits to false:
		reset: function( bitArray ) {
			var arr = this._arr,
				nbValues = arr.length;
			for( var v = 0; v < nbValues; v++ ) {
				arr[v][ bitArray ] = 0;
			}
			this._bitsSet[ bitArray ] = 0;
		}
	}, defDescriptors, {
		// Length is the number of bitArrays:
		// Directly setting the length allows you to change the number of bitArrays:
		// New bitArrays have no bit set. Removed bitArrays are lost.
		length: {
			get: function() {
				return this._length;
			},
			set: function( newLength ) {
				var arr = this._arr,
					nbValues = arr.length,
					bitsSet = this._bitsSet,
					length = this._length,
					values,
					v, i;
				if( newLength < length ) {
					for( v = 0; v < nbValues; v++ ) {
						arr[v].length = newLength;
					}
					bitsSet.length = newLength;
				}
				else {
					for( v = 0; v < nbValues; v++ ) {
						values = arr[v];
						for( i = length; i < newLength; i++ ) {
							values[i] = 0;
						}
					}
					for( i = length; i < newLength; i++ ) {
						bitsSet[i] = 0;
					}
				}
				this._length = newLength;
			}
		},
		// Size is the number of bits of each bitArray.
		// Directly setting the size allows you to change the number of bits of all bitArrays.
		// New bits will be false. Removed bits are erased properly.
		size: {
			get: function() {
				return this._size;
			},
			set: function( newSize ) {
				var nbValues = Math.ceil( newSize / INTEGERBITS ),
					arr = this._arr,
					length = this._length,
					values,
					v, i;
				if( newSize < this._size ) {
					var clear = INTEGERBITS - ( newSize % INTEGERBITS );
					// Clear removed bits:
					arr.length = nbValues;
					for( i = 0; i < length; i++ ) {
						arr[ nbValues ][i] = ( ( values[ i ] << clear ) >>> clear );
						this.resetBitSet( i );
					}
				}
				else {
					for( v = arr.length; v < nbValues; v++ ) {
						values = arr[v] = [];
						for( i = 0; i < newSize; i++ ) {
							values[i] = 0;
						}
					}
				}
				this._size = newSize;
			}
		}
	}),
	ArrayOfBitArray = function( size ) {
		var obj = compactCreate( ArrayOfBitArrayProto, defPropsUnenumerable, {
			_length: 0,
			_size: 0,
		}, defPropsUnenumerableUnwriteable, {
			_arr: [],
			_bitsSet: []
		}, defProps, {
			size: size	// Directly set the size now.
		});
		return obj;
	};
