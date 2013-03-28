
// The prototype for all componentDefs:
var ComponentDefProto = Object_freeze( {} ),
	esEngine_cDefs = esEngine._cDefs = {};


esEngine.ComponentDef = function( objectDef ) {
	
	var name = objectDef.name;
	
	if( !isString( name ) ) throw "A component must have a name.";
	if( name in esEngine_cDefs ) throw "A ComponentDef already exists with the name: " + name;
	
	var cDef = Object_create( ComponentDefProto );
	
	cDef.name = name;
	cDef.attr = objectDef.attr || {};
	cDef.init = objectDef.init || function() {};
	cDef.helpers = objectDef.helpers || {};
	
	// Freeze all added properties and the objects they reference:
	// Note: name is already immutable.
	definePropertiesUnwriteable( cDef, "name" );
	freezeProperties( cDef, "attr", "init", "helpers" );
	
	esEngine_cDefs[ name ] = cDef;
	
	return cDef;
};
