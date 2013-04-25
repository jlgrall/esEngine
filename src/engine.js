var version = "@VERSION";

var 
	// Prototype for all es:
	ESProto = {};


// Function that creates a new es.
// This function will be exported to the global object.
// Structure of the function:
// - entities
// - eLinks
// - ComponentCreators
// - Systems
// - ExecutableGroups
// - Selectors
// - Bags
// - es.entities
var esEngine = setProto( ESProto, function() {
		
		// #### Create the "es" that will be returned:
		var es = Object_create( ESProto );
		
		
		
		// #### Create structures that will manage the entities
		// Each entity is a pointer to a BitArray in a big ArrayOfBitArray.
		// Each bit of the BitArray tells which components the entity has.
		var 
			// Contains all entities and which component they have:
			allEntities = Object_preventExtensions( ArrayOfBitArray( INTEGERBITS ) ),
			allEntities_bitsSet = allEntities._bitsSet,
			// Manages which entities can be reused.
			// I use a simple hack in the underlying bitArray
			// of each entity: available entities returns that
			// they possess -1 components.
			entitiesHeap = BufferedHeap( {
				heap: allEntities,
				bufferSize: 128,
				isAvailable: function( index ) {
					return allEntities_bitsSet[ index ] === -1;
				},
				expandHeap: function( expandAmount, length, expandedLength, array ) {
					allEntities.length += expandAmount;
					for( var i = length; i < expandedLength; i++ ) {
						allEntities_bitsSet[i] = -1;
					}
					return expandedLength;
				},
				// When there is no more entity to be reused, creates 128 new
				// entities at the same time.
				expandAmount: 128,
				// When there are unused entities at the end, shrink the array
				// by 256, but not before there are more than 512 unused at the end.
				maxTrailingAllowed: 512,
				reduceAmount: 256,
				onAcquired: function( index ) {
					allEntities_bitsSet[ index ] = 0;
				},
				onReleased: function( index ) {
					if( allEntities_bitsSet[ index ] > 0 ) throw "That entity still has components";
					allEntities_bitsSet[ index ] = -1;
				}
			}),
			// {es,bag}.newEntity( component... )
			newEntity = function() {
				var args = arguments,
					nbArgs = args.length,
					entity = entitiesHeap.acquire();
				
				if( nbArgs === 0 ) throw "An entity cannot exist without a component";
				
				for( var i = 0; i < nbArgs; i++ ) {
					args[i].$addTo( entity );
				}
				return entity;
			},
			// {es,bag}.disposeEntity( entity... )
			disposeEntity = function() {
				var args = arguments,
					nbArgs = args.length;
				
				for( var i = 0; i < nbArgs; i++ ) {
					disposeOneEntity( args[i] );
				}
			},
			// Internally used instead of disposeEntity(),
			// because most of the time we dispose entities one by one.
			disposeOneEntity = function( entity ) {
				var bagsLength = allBagsArray.length;
				
				// Do this in advance, to prevent bags from processing the entity
				// each time a component will be removed from the entity.
				for( var j = 0; j < bagsLength; j++ ) {
					allBagsArray[j].removeOne( entity );
				}
				// Dispose all components of the entity:
				allEntities.eachSet( entity, disposeComponent );
			},
			// Internal. Disposes entities that have no more component.
			disposeOneEmptyEntity = function( entity ) {
				var bagsLength = allBagsArray.length;
				
				// Remove the entity from all the bags:
				for( var j = 0; j < bagsLength; j++ ) {
					allBagsArray[j].removeOne( entity );
				}
				
				var links = eLinkActive[ entity ];
				// Break all eLinks to this entity:
				if( links ) {
					var nbLinks = links.length;
					if( nbLinks > 0 ) {
						for( var i = 0; i < nbLinks; i++ ) {
							links[i]._e = 0;
						}
						links.length = 0;
					}
					eLinkArraysPool.release( links );
					delete eLinkActive[ entity ];
				}
				
				// The entity can be reused now:
				entitiesHeap.release( entity );
			},
			// Internal. Disposes a component.
			disposeComponent = function( componentId, entity ) {
				allComponents[ componentId ][ entity ].$dispose();
			};
			
			// Acquire and discard the entity with id 0,
			// because entity ids must start at 1
			if( entitiesHeap.acquire() !== 0 ) throw "First entity must be 0";
		
		
		
		// ### eLinks
		var 
			// Contains eLinks that are referencing an entity:
			eLinkActive = {},
			// A pool for eLinks:
			eLinkArraysPool = pool({
				constr: function() {
					return [];
				},
				reset: function( array ) {
					array.length = 0;
				},
				capacity: 256
			}),
			// Prototype for all eLinks of this es:
			eLinkESProto = compactCreate( eLinkProto, defDescriptors, {
				e: {
					enumerable: true,	// TODO; why doesn't it work ? "e" is not enumerable !
					get: function() {
						return this._e;
					},
					set: function( entity ) {
						var links;
						if( this._e !== 0 ) {
							links = eLinkActive[this._e];
							var _index = this._index,
								last = links.pop();
							if( _index !== links.length ) {
								links[ _index ] = last;
								last._index = _index;
							}
						}
						this._e = entity;
						if( entity !== 0 ) {
							if( !entities.has( entity ) ) throw "The entity does not exist";
							links = eLinkActive[ entity ];
							if( !links ) links = eLinkActive[ entity ] = eLinkArraysPool.acquire();
							this._index = links.push( this ) - 1;
						}
					}
				}
			}),
			// es.eLink( entity ).
			// Setup the eLink pool on top of the eLinkESProto.
			eLink = setProto( eLinkESProto, (function() {
				var instanceProperties = {
						_e: {
							writable: true,
							enumerable: false,
							value: 0
						},
						_index: {
							writable: true,
							enumerable: false,
							value: -1
						}
					},
					constr = function() {
						var eLink = Object_create( eLinkESProto );
						Object_defineProperties( eLink, instanceProperties );
						// Now we lock the eLink:
						Object_preventExtensions( eLink );
						return eLink;
					},
					init = function( entity ) {
						if( entity !== undefined ) this.e = entity;
					},
					reset = function( eLink ) {
						eLink.e = 0;
					},
					poolDef = poolFactory( constr, init, noopFunc, noopFunc, reset, 512 ),
					notACLinkFunc = function() {
						throw "This is not a cLink";
					};
				
				compactDefine( eLinkESProto, defPropsUnwritable, {
					dispose: poolDef.disposer
				}, defPropsUnenumerableUnwritable, {
					_pool: poolDef.pool
				}, defDescriptors, {
					// Just in case someone mistakes this for a cLink:
					c: {
						enumerable: false,
						get: notACLinkFunc,
						set: notACLinkFunc,
					}
				});
				
				return poolDef.acquirer;
			})() );
		
		Object_freeze( eLinkESProto );
		
		
		
		// #### Create structures for managing components.
		// Each type of component has an id, the creatorId.
		// This id is used to efficiently store and retrieve components from arrays and maps.
		// Prototype chain: component -> proto (1 for each componentCreator) -> componentDef.helpers -> ComponentProto
		var 
			// Keep all ComponentCreators (simply referred as "creators"):
			allCreators = RecycledIndexedNamedList({
				onHeapExpanded: function( length ) {
					if( length > allEntities.size ) {
						var size = Math.ceil( length / INTEGERBITS ) * INTEGERBITS;
						allEntities.size = size;
						allSelectorsHas.size = size;
						allSelectorsNot.size = size;
					}
				},
				onHeapReduced: function( length ) {
					// Removing creators is not in the API.
				}
			}),
			// Shortcuts:
			allCreatorsArray = allCreators.array,
			allCreators_byName = allCreators.names,
			allCreators_byId = allCreators.map,
			
			// Array of array of components. First index is the id of the creator,
			// second index is the id of the entity of the component.
			allComponents = [],
			
			// es.componentCreator( ComponentDef ):
			componentCreator = function( cDef ) {
				if( isString( cDef ) ) {
					if( !esEngine_cDefs[ cDef ] ) throw "No ComponentDef found with name: " + cDef;
					cDef = esEngine_cDefs[ cDef ];
				}
				if( !( isPrototypeOf( ComponentDefProto, cDef ) ) ) throw "cDef is not a valid ComponentDef";
				
				var name = cDef.name,
					creator = allCreators_byName[ name ];
				
				// If creator not found, create and store it:
				if( !creator ) {
					
					var 
						// Cache reference (used in constr):
						set = cDef._set,
						
						instanceProperties = {
							// The entity of the component (See: component.$entity ):
							$e: {
								writable: true,
								enumerable: false,
								value: 0
							},
							// cLinks referencing this component:
							$links: {
								writable: true,
								enumerable: false,
								value: null
							}
						},
						// Component constructor (used directly in the poolFactory)
						constr = function() {
							var component = Object_create( proto );
							Object_defineProperties( component, instanceProperties );
							set( component );	// Set the default attributes.
							// Now we lock the component:
							Object_preventExtensions( component );
							return component;
						},
						
						// For the poolFactory (Called by the pool when reusing a component instead of creating a new one):
						onAcquired = noopFunc,
						
						// For the poolFactory (Called by the pool when the component is disposed):
						onReleased = noopFunc;
					
					var 
						// Each creator has its pool, which automatically manages component creation and reuse.
						// Here we create the pool on top of the component constructor, and we get references to
						// the pool's functions.
						poolDef = poolFactory( constr, cDef.init, onAcquired, onReleased, cDef._reset, 20 ),
						poolDef_disposer = poolDef.disposer,
						
						// Component prototype, inheriting from cDef.helpers and adding functions specific to the creator.
						proto = compactCreate( cDef.helpers , defPropsUnenumerableUnwritable, {
							$creator: creator = poolDef.acquirer,
							$addTo: function( entity ) {
								if( !(entity > 0) ) throw "Cannot add to no entity: " + name;
								if( this.$e !== 0 ) throw "This component was already added to an entity: " + name;
								if( components[ entity ] ) throw "This entity already has a component of type: " + name;
								if( allEntities.set( entity, creatorId ) <= 0) throw "The entity was disposed";
								this.$e = entity;
								components[ entity ] = this;
							},
							$remove: function() {
								var entity = this.$e,
									links = this.$links;
								if( entity === 0 ) throw "This component was not added to an entity: " + name;
								delete components[ entity ];
								this.$e = 0;
								
								// Break all cLinks to this component:
								if( links !== null ) {
									var nbLinks = links.length;
									if( nbLinks > 0 ) {
										for( var i = 0; i < nbLinks; i++ ) {
											links[i]._c = null;
										}
										links.length = 0;
									}
								}
								
								// If this is the last component of the entity, dispose the entity:
								if( allEntities.unset( entity, creatorId ) === 0 ) {
									disposeOneEmptyEntity( entity );
								}
							},
							$dispose: function() {
								// Check if we need to be removed:
								if( this.$e !== 0 ) this.$remove();
								
								if( this.$links !== null ) {
									cLinkArraysPool.release( this.$links );
									this.$links = null;
								}
								
								poolDef_disposer.call( this );
							}
						});
					
					setProto( proto, creator );
					
					// Store the new creator and implicitly give it an id:
					allCreators.add( name, creator );
					Object_defineProperty( creator, "_id", defPropsUnenumerable );
					
					var creatorId = creator._id,
						components = allComponents[ creatorId ] = {};
					
					// Add properties and methods to the creator:
					compactDefine( creator, defPropsUnenumerableUnwritable, {
						_es: es,
						_isCreator: true
					}, defPropsUnwritable, {
						def: cDef,
						getFor: function( entity ) {
							return components[ entity ] || null;
						},
						_pool: poolDef.pool
					});
				}
				
				return creator;
			};
		
		
		// ### Systems
		var 
			allSystems = {},
			
			canonicalName = function( name ) {
				var lastChar = name.length - 1;
				if( name.charAt( lastChar ) === ":" ) name = name.substring( 0, lastChar );
				return name;
			},
			
			findSystem = function( name ) {
				return allSystems[ canonicalName( name ) ] || null;
			},
			
			SystemESProto = compactCreate( SystemProto, defPropsUnwritable, {
				dispose: function() {
					if( this.onDisposed ) this.onDisposed();
					
					delete allSystems[ this.name ];
				}
			}),
			
			System = setProto( SystemESProto, function( sDef, bag ) {
				var args = Array_proto_slice.call( arguments, 1 );
				if( !isPrototypeOf( BagProto, bag ) ) {
					bag = entities;
					args.unshift( bag );
				}
				
				// Find sDef, its name and the tag:
				var sDefName;
				var tag = "";
				if( isArray( sDef ) ) {
					if( sDef.length > 1 ) tag = sDef[1];
					sDef = sDef[0];
				}
				if( isString( sDef ) ) {
					var tagIndex = sDef.indexOf( ":" );
					if( tagIndex === -1 ) tagIndex = sDef.length;
					else tag = sDef.substring( tagIndex + 1 );
					sDefName = sDef.substring( 0, tagIndex );
					sDef = esEngine_sDefs[ sDefName ];
					if( !sDef ) throw "SystemDef not found: " + sDefName;
				}
				
				if( !isPrototypeOf( SystemDefProto, sDef ) ) throw "Not a valid SystemDef: " + sDef;
				if( !isString( tag ) )  throw "Not a valid tag: " + tag;
				if( tag.indexOf( ":" ) !== -1 ) throw "A tag should not contain the \":\" character: " + tag;
				
				var name = sDef.name;
				if( tag.length > 0 ) name += ":" + tag;
				
				if( allSystems[ name ] ) throw "There is already a system with the same name: " + allSystems[ name ];
				
				// Find the ComponentCreators:
				var creators = toCreators( es, sDef.cDefs, [] );
				args.push.apply( args, creators );
				
				// Create the system:
				var system = compactCreate( SystemESProto, defPropsUnwritable, {
					def: sDef,
					name: name,
					tag: tag
				}, defPropsUnenumerableUnwritable, {
					_es: es
				});
				
				// Init the system:
				sDef.init.apply( system, args );
				
				if( !isFunction( system.execute ) ) throw "Systems must have an \"execute()\" method";
				
				allSystems[ name ] = system;
				
				return system;
			});
		
		
		
		// ### ExecutableGroups
		var groupSep = ".",
			isExecutable = function( arg ) {
				return isString( arg.name ) && isFunction( arg.execute );
			},
			_getDeepestGroup = function( group, target, throwsError ) {
				var targetLength = target.lastIndexOf( "." );
				if( targetLength === -1 ) targetLength = 0;
				var name;
				var node;
				var lastIndex = 0;
				var index = 0;
				while( index !== targetLength ) {
					index = target.indexOf( groupSep, lastIndex );
					if( index === -1 ) index = targetLength;
					
					name = target.substring( lastIndex, index );
					node = group._byName[ name ];
					if( node === undefined ) {
						if( throwsError ) throw "Could not find target: " + name;
						else return null;
					}
					
					group = node.executable;
					if( !isPrototypeOf( ExecutableGroupESProto, group ) ) throw "This is not an ExecutableGroup: " + group;
					lastIndex = index + 1;
				}
				return group;
			},
			getNode  = function( group, target, throwsError ) {
				if( !isString( target ) ) {
					target = target.name;
				}
				group = _getDeepestGroup( group, target, throwsError );
				var lastIndex = target.lastIndexOf( groupSep ) + 1;	// Works even if not found.
				var name = target.substring( lastIndex );
				var node = group._byName[ name ] || null;
				if( node === null && throwsError ) throw "Could not find target: " + target;
				return node;
			},
			getAllNodes = function( group, target, allNodes, throwsError ) {
				if( !isString( target ) ) {
					target = target.name;
				}
				group = _getDeepestGroup( group, target, throwsError );
				var lastIndex = target.lastIndexOf( groupSep ) + 1;	// Works even if not found.
				var name = target.substring( lastIndex );
				if( name === "*" ) {
					Array_proto_push.apply( allNodes, group.executables );
				}
				else {
					var node = group._byName[ name ] || null;
					allNodes.push( node );
					if( node === null && throwsError ) throw "Could not find target: " + target;
				}
			},
			parseExecSelect = function( group, args, allNodes, throwsError ) {
				var nbArgs = args.length;
				for( var i = 0; i < nbArgs; i++ ) {
					getAllNodes( group, args[i], allNodes, throwsError );
				}
				return allNodes;
			},
			nextExecuted = function( group, fromIndex ) {
				var executables = group._executables;
				var nbExecutables = executables.length;
				var execIndex = group._executed.length;
				for( var i = fromIndex; i < nbExecutables; i++ ) {
					var node = executables[i];
					if( node.execIndex !== -1 ) {
						execIndex = node.execIndex;
						break;
					}
				}
				return execIndex;
			},
			shiftExecutables = function( group, fromIndex, shiftExecutables, shiftExecuted ) {
				var executables = group._executables;
				var nbExecutables = executables.length;
				for( var i = fromIndex; i < nbExecutables; i++ ) {
					var node = executables[i];
					node.index += shiftExecutables;
					if( node.execIndex !== -1 ) node.execIndex += shiftExecuted;
				}
			},
			shiftExecuted = function( group, fromIndex, shiftExecuted ) {
				var executed = group._executed;
				var nbExecuted = executed.length;
				for( var i = fromIndex; i < nbExecuted; i++ ) {
					var node = executed[i];
					node.execIndex += shiftExecuted;
				}
			},
			allNodesArray = [],
			insertArray = [ -1, 0 ],
			ExecutableGroupESProto = compactCreate( ExecutableGroupProto, defPropsUnwritable, {
				append: function() {
					this._insertAt( this._executables.length, arguments );
					return this;
				},
				after: function( target ) {
					var node = getNode( this, target, true );
					node.group._insertAt( node.index + 1, arguments, 1 );
					return this;
				},
				before: function( target ) {
					var node = getNode( this, target, true );
					node.group._insertAt( node.index, arguments, 1 );
					return this;
				},
				remove: function() {
					var allNodes = parseExecSelect( this, arguments, allNodesArray, true );
					var nbNodes = allNodes.length;
					for( var i = 0; i < nbNodes; i++ ) {
						var node = allNodes[i];
						var group = node.group;
						var index = node.index;
						delete group._byName[ node.name ];
						group._executables.splice( index, 1 );
						group._executed.splice( node.execIndex, 1 );
						shiftExecutables( this, index, -1, -1 );
					}
					allNodesArray.length = 0;
					return this;
				},
				has: function() {
					var args = arguments;
					var nbArgs = args.length;
					for( var i = 0; i < nbArgs; i++ ) {
						var node = getNode( this, args[i] );
						if( node === null ) return false;
					}
					return true;
				},
				get: function( arg ) {
					var node = getNode( this, arg );
					return node === null ? null : node.executable;
				},
				pause: function() {
					var allNodes = parseExecSelect( this, arguments, allNodesArray, true );
					var nbNodes = allNodes.length;
					for( var i = 0; i < nbNodes; i++ ) {
						var node = allNodes[i];
						var execIndex = node.execIndex;
						if( execIndex !== -1 ) {
							node.execIndex = -1;
							var group = node.group;
							group._executed.splice( execIndex, 1 );
							shiftExecuted( group, execIndex, -1 );
						}
					}
					allNodesArray.length = 0;
					return this;
				},
				unpause: function() {
					var allNodes = parseExecSelect( this, arguments, allNodesArray, true );
					var nbNodes = allNodes.length;
					for( var i = 0; i < nbNodes; i++ ) {
						var node = allNodes[i];
						var execIndex = node.execIndex;
						if( execIndex === -1 ) {
							var group = node.group;
							execIndex = nextExecuted( group, node.index + 1 );
							node.execIndex = execIndex;
							group._executed.splice( execIndex, 0, node );
							shiftExecuted( group, execIndex + 1, 1 );
						}
					}
					allNodesArray.length = 0;
					return this;
				},
				isPaused: function() {
					var allNodes = parseExecSelect( this, arguments, allNodesArray, true );
					var nbNodes = allNodes.length;
					for( var i = 0; i < nbNodes; i++ ) {
						var node = allNodes[i];
						if( node.execIndex !== -1 ) return false;
					}
					allNodesArray.length = 0;
					return true;
				}
			}, defPropsUnenumerableUnwritable, {
				_insertAt: function( index, args, nbSkippedArgs ) {
					if( !nbSkippedArgs ) nbSkippedArgs = 0;
					var nbArgs = args.length;
					var nbInsertions = nbArgs - nbSkippedArgs;
					var executables = this._executables;
					var nbExecutables = executables.length;
					var byName = this._byName;
					var executed = this._executed;
					
					var execIndex = nextExecuted( this, index );
					
					for( var i = nbSkippedArgs; i < nbArgs; i++ ) {
						var arg = args[i];
						if( isArray( arg ) ) arg = ExecutableGroup( arg );
						else if( isString( arg ) ) {
							arg = findSystem( arg );
							if( arg === null ) throw "Could not find System: " + arg;
						}
						else if( !isExecutable( arg ) ) throw "This is not an Executable: " + arg;
						if( byName[ arg.name ] ) throw "Already contains the name: " + arg.name;
						var node = {
							name: arg.name,
							executable: arg,
							group: this,
							index: index + i,
							execIndex: execIndex + i
						};
						byName[ arg.name ] = node;
						insertArray[ i + 2 ] = node;
					}
					
					shiftExecutables( this, index, nbInsertions, nbInsertions );
					insertArray[0] = index;
					Array_proto_splice.apply( executables, insertArray );
					insertArray[0] = execIndex;
					Array_proto_splice.apply( executed, insertArray );
					
					// Reset insertArray:
					insertArray[0] = -1;
					insertArray.length = 2;
				}
			}),
			ExecutableGroup = function( name ) {
				var array;
				if( isArray( name ) ) {
					array = Array_proto_slice.call( name , 1 );
					name = name[0];
				}
				
				if( !isString( name ) || name.length === 0 ) throw "ExecutableGroup must have a name";
				
				var executableGroup = compactCreate( ExecutableGroupESProto, defPropsUnwritable, {
					name: name
				}, defPropsUnenumerableUnwritable, {
					_es: es,
					_executables: [],
					_byName: {},
					_executed: []
				});
				
				if( array ) this.append.apply( this, array );
				
				return executableGroup;
			};
			
		
		
		// ### Selectors
		var allSelectors = [],
			// Selector ids start at 1 (not 0).
			allSelectorsHas = Object_preventExtensions( ArrayOfBitArray( INTEGERBITS ) ),
			allSelectorsNot = Object_preventExtensions( ArrayOfBitArray( INTEGERBITS ) ),
			nbSelectors = 0,
			// Prototype for all Selectors of this es:
			SelectorESProto = compactCreate( SelectorProto, defProps, {
				matches: function(  ) {
					var args = arguments,
						nbArgs = args.length;
					for( var i = 0; i < nbArgs; i++ ) {
						if( !this.matchesOne( args[i] ) ) return false;
					}
					return true;
				},
				matchesOne: function( entity ) {
					var id  = this._id;
					if( allSelectorsNot.eachSet( id, function( pos ) {
						if( allEntities.isSet( entity, pos ) ) return false;
					} ) === false ) return false;
					if( allSelectorsHas.eachSet( id, function( pos ) {
						if( !allEntities.isSet( entity, pos ) ) return false;
					} ) === false ) return false;
					return true;
				},
				alwaysSelects: function( creator ) {
					return allSelectorsHas.isSet( this._id, creator._id );
				},
				neverSelects: function( creator ) {
					return allSelectorsNot.isSet( this._id, creator._id );
				},
				maySelects: function( creator ) {
					return !allSelectorsNot.isSet( this._id, creator._id );
				}
			}),
			// es.selector():
			Selector = setProto( SelectorESProto, function() {
				var args = arguments,
					args0 = args[0],
					has = emptyArray,
					not = emptyArray,
					length,
					i;
				if( args.length === 0 ) throw "Missing arguments";
				
				if( args0.has || args0.not ) {
					if( args0.has && !isArray( args0.has ) || args0.not && !isArray( args0.not ) ) {
						throw "Wrong arguments";
					}
					if( args0.has ) has = args0.has;
					if( args0.not ) not = args0.not;
				}
				else {
					has = args;
				}
				
				toCreators( this, has );
				toCreators( this, not );
				allSelectorsHas.reset( 0 );
				allSelectorsNot.reset( 0 );
				for( i = 0, length = has.length; i < length; i++ ) {
					allSelectorsHas.set( 0, has[i]._id );
				}
				for( i = 0, length = not.length; i < length; i++ ) {
					allSelectorsNot.set( 0, not[i]._id );
				}
				
				var idFound = 0,
					selector;
				// Start after anySelector:
				for( i = 1; i < nbSelectors; i++ ) {
					if( allSelectorsHas.equals( 0, i + 1) && allSelectorsNot.equals( 0, i + 1) ) {
						idFound = i + 1;
					}
				}
				if( idFound === 0 ) {
					idFound = nbSelectors++ + 1;
					allSelectorsHas.length += 1;
					allSelectorsHas.copy( 0, idFound );
					allSelectorsNot.length += 1;
					allSelectorsNot.copy( 0, idFound );
					
					selector = allSelectors[ idFound ] = compactCreate( SelectorESProto, defPropsUnenumerableUnwritable, {
						_es: es,
						_id: idFound
					});
				}
				else {
					selector = allSelectors[ idFound ];
				}
				
				return selector;
			});
			
		// Reserve the id 0 as a working space for temporary datas,
		// and id 1 for anySelector.
		allSelectorsHas.length = 2;
		allSelectorsNot.length = 2;
		
		var anySelector = allSelectors[ 1 ] = compactCreate( SelectorESProto, defPropsUnenumerableUnwritable, {
				_es: es,
				_id: 1
			});
		nbSelectors++;
		
		
		
		// #### Create structures for managing bags.
		// All bags are kept in an unordered dense array for quick access.
		// Prototype chain: bag -> BagESProto -> BagProto
		var allBags = RecycledIndexedList(),
			allBagsArray = allBags.array,
			// Prototype for all bags of this es (and for es.entities):
			BagESProto = compactCreate( BagProto, defProps, {
				// Automatically adds the new entity to itself:
				newEntity: function() {
					var entity = newEntity.apply( es, arguments );
					this.addOne( entity );
					return entity;
				},
				disposeEntity: disposeEntity,
				dispose: function() {
					var allQueriesArray = this._allQueries.array;
					while( allQueriesArray.length > 0 ) {
						allQueriesArray[0].dispose();
					}
					this.clear();
					allBags.remove( this );
				},
				query: function() {
					var bag = this,
						args = arguments,
						nbArgs = args.length;
					if( nbArgs === 0) throw "Missing arguments";
					
					var hasSelector = isPrototypeOf( SelectorProto, args[ nbArgs - 1 ] );
					if( hasSelector ) {
						nbArgs--;
					}
					
					var iterated = Object_freeze( toCreators( es, args, [], nbArgs ) ),
						selector = hasSelector ? args[ nbArgs ] : Selector.apply( es, iterated ),
						queriedArgs = [ 0 ];
					
					for( var i = 0; i < nbArgs; i++ ) {
						if( selector.neverSelects( iterated[i] ) ) throw "Components of that kind will never be selected: " + iterated[i];
						queriedArgs[i + 1] = null;
					}
					
					var query = compactCreate( QueryProto, defPropsUnwritable, {
							bag: bag,
							selector: selector,
							iterated: iterated,
							each: bag._createQueryEach( selector, iterated, iterated.length, queriedArgs )
						}, defPropsUnenumerable, {
							_id: -1	// Will be set in this._allQueries.add()
						 });
					
					this._allQueries.add( query );
					
					return query;
				}
			}, defPropsUnenumerable, {
				_createQueryEach: function( selector, iterated, nbIterated, queriedArgs ) {
					var bag = this;
					return function( callback, thisArg ) {
						bag.eachSelector( selector, function( entity ) {
							queriedArgs[0] = entity;
							for( var i = 0; i < nbIterated; i++ ) {
								queriedArgs[i + 1] = allComponents[ iterated[i]._id ][ entity ] || null;
							}
							callback.apply( thisArg, queriedArgs );
						});
						// We don't really need to reset this:
						// for( var i = 0; i < nbIterated; i++ ) components[i] = null;
					};
				}
			}, defPropsUnenumerableUnwritable, {
				_es: es
			}, defDescriptors, {
				length: {
					get: function() {
						return this._length;
					},
					set: unsupportedOperationFunc
				}
			}),
			// Constructor for all bags (except es.entities):
			Bag = setProto( BagESProto, function( name ) {
				if( !isString( name ) && name !== undefined ) throw "Bag name must be a string (or undefined): " + name;
				
				var bag = compactCreate( BagESProto, defProps, {
					name: name
				}, defPropsUnenumerable, {
					_id: -1,	// Will be set in allBags.add()
					_length: 0
				}, defPropsUnenumerableUnwritable, {
					// Map of contained entities:
					_e: {},
					_allQueries: RecycledIndexedList()
				});
				
				allBags.add( bag );
				
				return bag;
			});
		
		
		
		// #### Create the special bag es.entities
		// It doesn't need to store it's own entities (no ._e property).
		// Many methods are deactivated because they don't make sense.
		// Prototype chain: entities -> BagESProto -> BagProto
		var entities = compactCreate( BagESProto, defProps, {
				newEntity: newEntity,
				disposeEntitiesFrom: function() {},
				has: function() {
					var args = arguments,
						nbArgs = args.length,
						nbEntities = allEntities.length,
						i;
					for( i = 0; i < nbArgs; i++ ) {
						if( args[i] >= nbEntities || allEntities_bitsSet[ args[i] ] === -1 ) {
							return false;
						}
					}
					return true;
				},
				hasOne: function( entity ) {
					return entity < allEntities.length && allEntities_bitsSet[ entity ] !== -1;
				},
				keepEntities: function() {},
				discardEntities: function() {},
				each: function( callback, thisArg ) {
					var nbEntities = allEntities.length;
					for( var i = 1; i < nbEntities; i++ ) {
						if( allEntities_bitsSet[ i ] !== -1  ) {
							callback.call( thisArg, i, this );
						}
					}
				},
				eachSelector: function( selector, callback, thisArg ) {
					var nbEntities = allEntities.length;
					for( var i = 1; i < nbEntities; i++ ) {
						if( allEntities_bitsSet[ i ] !== -1  ) {
							if( selector.matchesOne( i ) ) {
								callback.call( thisArg, i, this );
							}
						}
					}
				},
				eachUntil: function( callback, thisArg ) {
					var nbEntities = allEntities.length;
					for( var i = 1; i < nbEntities; i++ ) {
						if( allEntities_bitsSet[ i ] !== -1  ) {
							if( callback.call( thisArg, i, this ) === false ) return false;
						}
					}
				},
				eachSelectorUntil: function( selector, callback, thisArg ) {
					var nbEntities = allEntities.length;
					for( var i = 1; i < nbEntities; i++ ) {
						if( allEntities_bitsSet[ i ] !== -1  ) {
							if( selector.matchesOne( i ) ) {
								if( callback.call( thisArg, i, this ) === false ) return false;
							}
						}
					}
				},
				clearEntities: function() {}
			}, defPropsUnwritable, {
				name: "*"
			}, defPropsUnenumerableUnwritable, {
				_allQueries: RecycledIndexedList()
			}, defDescriptors, {
				length: {
					get: function() {
						// - 1 because the entity 0 doesn't count:
						return entitiesManager.used - 1;
					}
				}
			});
		// All these methods will throw if called:
		entities.add =
		entities.addOne =
		entities.addFrom =
		entities.remove =
		entities.removeOne =
		entities.removeFrom =
		entities.keep =
		entities.discard =
		entities.clear =
		entities.dispose = unsupportedOperationFunc;
		
		
		// #### Return the es, with all needed properties exposed:
		return compactDefine( es, defPropsUnwritable, {
				entities: entities,
				newEntity: newEntity,
				eLink: eLink,
				disposeEntity: disposeEntity,
				componentCreator: componentCreator,
				cLink: cLink,
				system: System,
				executableGroup: ExecutableGroup,
				selector: Selector,
				anySelector: anySelector,
				bag: Bag
			});
	});
