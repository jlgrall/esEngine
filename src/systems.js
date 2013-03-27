
// The class for all systemDefs:
var SystemDef = Object_freeze( {} ),
	esEngine_sDefs = esEngine._sDefs = {};


esEngine.SystemDef = function( objectDef ) {
	
	var name = objectDef.name,
		_cDefs = objectDef.cDefs,
		init = objectDef.init;
	
	if( !isString( name ) ) throw "A system must have a name.";
	if( !isArray( _cDefs ) ) throw "A system must have a cDefs array.";
	if( !isFunction( init ) ) throw "A system must have a init function.";
	
	// Check the given cDefs, and retrieve the cDef
	// when only its name is given:
	var _cDefsLength = _cDefs.length,
		cDefs = [],
		cDef;
	for( var i = 0; i < _cDefsLength; i++ ) {
		cDef = _cDefs[i];
		if( isString( cDef ) ) {
			if( !esEngine_cDefs[ cDef ] ) throw "No ComponentDef found with name: " + cDef;
			cDef = esEngine_cDefs[ cDef ];
		}
		if( !( isPrototypeOf(ComponentDef, cDef) ) ) throw "cDef is not a valid ComponentDef";
		cDefs.push( cDef );
	}
	
	var sDef = Object_create( SystemDef );
	
	sDef.name = name;
	sDef.cDefs = cDefs;
	sDef.init = init;
	
	// Freeze all added properties and the objects they reference:
	// Note: name is already immutable.
	definePropertiesUnwriteable( sDef, "name" );
	freezeProperties( sDef, "cDefs", "init" );
	
	if( name in esEngine_sDefs ) throw "A SystemDef already exists with the name: " + name;
	esEngine_sDefs[ name ] = sDef;
	
	return sDef;
};
