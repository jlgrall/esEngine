// Export some functions:

esEngine.version = version;

esEngine.ArrayOfBitArray = ArrayOfBitArray;
esEngine.BufferedIndexRecycler = BufferedIndexRecycler;

esEngine._cDefs = esEngine_cDefs;
esEngine.ComponentDef = ComponentDef;

esEngine._sDefs = esEngine_sDefs;
esEngine.SystemDef = SystemDef;


// Following part is taken from: https://github.com/jquery/jquery/blob/master/src/exports.js

if ( typeof module === "object" && typeof module.exports === "object" ) {
	// Expose esEngine as module.exports in loaders that implement the Node
	// module pattern (including browserify). Do not create the global, since
	// the user will be storing it themselves locally, and globals are frowned
	// upon in the Node module world.
	module.exports = esEngine;
} else {
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
// If there is a window object, that at least has a document property,
// define esEngine identifier.
if ( typeof window === "object" && typeof window.document === "object" ) {
	window.esEngine = esEngine;
}

})( this, Object, String, Array );
