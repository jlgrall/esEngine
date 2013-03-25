

// Following part is taken from: https://github.com/jquery/jquery/blob/master/src/exports.js

if ( typeof module === "object" && typeof module.exports === "object" ) {
	// Expose esEngine as module.exports in loaders that implement the Node
	// module pattern (including browserify). Do not create the global, since
	// the user will be storing it themselves locally, and globals are frowned
	// upon in the Node module world.
	module.exports = esEngine;
} else {
	// Otherwise expose esEngine to the global object as usual
	window.esEngine = esEngine;

	// Register as a named AMD module, since esEngine can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase esengine is used because AMD module names are
	// derived from file names, and esEngine is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of esEngine, it will work.
	if ( typeof define === "function" && define.amd ) {
		define( "esengine", [], function () { return esEngine; } );
	}
}

})( this );