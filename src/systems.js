
var 
	// esEngine.sDefs, contains all defined SystemDef:
	esEngine_sDefs = {},
	
	// Prototype for all systemDefs:
	SystemDefProto = {},
	
	// esEngine.SystemDef( objectDef ):
	SystemDef = setProto( SystemDefProto, function( objectDef ) {
	
		var name = objectDef.name,
			_cDefs = objectDef.cDefs,
			init = objectDef.init;
	
		if( !isString( name ) ) throw "A system must have a name";
		if( name.length === 0 ) throw "A system must have a non empty name";
		if( !isArray( _cDefs ) ) throw "A system must have a cDefs array";
		if( !isFunction( init ) ) throw "A system must have an init function";
	
		if( name in esEngine_sDefs ) throw "A SystemDef already exists with the name: " + name;
	
		// Check the given cDefs, retrieving the cDef
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
			if( !( isPrototypeOf( ComponentDefProto, cDef ) ) ) throw "Not a valid ComponentDef: " + cDef;
			cDefs.push( cDef );
		}
	
		// Create the systemDef:
		var sDef = compactCreate( SystemDefProto, defPropsUnwritable, {
				name: name
			}, defPropsFreeze, {
				cDefs: cDefs,
				init: init
			});
	
		// Store the new systemDef:
		esEngine_sDefs[ name ] = sDef;
	
		return sDef;
	});

Object_freeze( SystemDefProto );


var 
	// Prototype for all systems:
	SystemProto = {
	};

Object_freeze( SystemProto );
