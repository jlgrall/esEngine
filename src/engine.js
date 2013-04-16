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
			entitiesManager = BufferedIndexRecycler( allEntities, {
				bufferSize: 128,
				isAvailable: function( index ) {
					return allEntities_bitsSet[ index ] === -1;
				},
				expandArray: function( expandAmount, length, expandedLength, array ) {
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
				maxTrailingAvailable: 512,
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
					entity = entitiesManager.acquire();
				
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
				entitiesManager.release( entity );
			},
			// Internal. Disposes a component.
			disposeComponent = function( componentId, entity ) {
				allComponents[ componentId ][ entity ].$dispose();
			};
			
			// Acquire and discard the entity with id 0,
			// because entity ids must start at 1
			if( entitiesManager.acquire() !== 0 ) throw "First entity must be 0";
		
		
		
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
				
				compactDefine( eLinkESProto, defPropsUnwriteable, {
					dispose: poolDef.disposer
				}, defPropsUnenumerableUnwriteable, {
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
				onArrayExpanded: function( length ) {
					if( length > allEntities.size ) {
						var size = Math.ceil( length / INTEGERBITS ) * INTEGERBITS;
						allEntities.size = size;
						allSelectorsHas.size = size;
						allSelectorsNot.size = size;
					}
				},
				onArrayReduced: function( length ) {
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
						poolDef = poolFactory( constr, cDef.init, onAcquired, onReleased, cDef._reset ),
						poolDef_disposer = poolDef.disposer,
						
						// Component prototype, inheriting from cDef.helpers and adding functions specific to the creator.
						proto = compactCreate( cDef.helpers , defPropsUnenumerableUnwriteable, {
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
					
					var creatorId = creator._id,
						components = allComponents[ creatorId ] = {};
					
					// Add properties and methods to the creator:
					compactDefine( creator, defPropsUnenumerableUnwriteable, {
						_es: es,
						_id: creatorId,
						_isCreator: true
					}, defPropsUnwriteable, {
						def: cDef,
						getFor: function( entity ) {
							return components[ entity ] || null;
						},
						_pool: poolDef.pool
					});
				}
				
				return creator;
			};
		
		
		
		// ### Selectors
		var allSelectors = [],
			// Selector ids start at 1 (not 0).
			allSelectorsHas = Object_preventExtensions( ArrayOfBitArray( INTEGERBITS ) ),
			allSelectorsNot = Object_preventExtensions( ArrayOfBitArray( INTEGERBITS ) ),
			nbSelectors = 0,
			toCreators = function( array, destArray ) {
				if( !destArray ) destArray = array;
				var elem;
				for(var i = 0, length = array.length; i < length; i++ ) {
					elem = array[i];
					if( elem._isCreator ) {
						destArray[i] = elem;
					}
					destArray[i] = componentCreator( elem );
				}
			},
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
				
				toCreators( has );
				toCreators( not );
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
					
					selector = allSelectors[ idFound ] = compactCreate( SelectorESProto, defPropsUnenumerableUnwriteable, {
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
		
		var anySelector = allSelectors[ 1 ] = compactCreate( SelectorESProto, defPropsUnenumerableUnwriteable, {
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
					this.clear();
					allBags.remove( this );
				}
			}, defPropsUnenumerableUnwriteable, {
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
				}, defPropsUnenumerableUnwriteable, {
					// Map of contained entities:
					_e: {}
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
							if( callback.call( thisArg, i, this ) === false ) return false;
						}
					}
				},
				clearEntities: function() {}
			}, defPropsUnwriteable, {
				name: "*"
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
		return compactDefine( es, defPropsUnwriteable, {
				entities: entities,
				newEntity: newEntity,
				eLink: eLink,
				disposeEntity: disposeEntity,
				componentCreator: componentCreator,
				cLink: cLink,
				selector: Selector,
				anySelector: anySelector,
				bag: Bag
			});
	});
