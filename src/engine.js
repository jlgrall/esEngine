var version = "@VERSION";

var 
	// Prototype for all es:
	ESProto = {};


// Function that creates a new es.
// This function will be exported to the global object.
// Structure of the function:
// - entities
// - ComponentCreators
// - Bags
// - es.entities
var esEngine = function() {
		
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
		
		
		
		// #### Create structures for managing components.
		// Each type of component has an id, the creatorId.
		// This id is used to efficiently store and retrieve components from arrays and maps.
		// Prototype chain: component -> proto (1 for each componentCreator) -> componentDef.helpers -> ComponentProto
		var 
			// Keep all ComponentCreators (simply referred as "creators"):
			allCreators = RecycledIndexedNamedList({
				onArrayExpanded: function( length ) {
					if( length > allEntities.size ) {
						allEntities.size = Math.ceil( length / INTEGERBITS ) * INTEGERBITS;
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
								var entity = this.$e;
								if( entity === 0 ) throw "This component was not added to an entity: " + name;
								delete components[ entity ];
								this.$e = 0;
								// If this is the last component of the entity, dispose the entity:
								if( allEntities.unset( entity, creatorId ) === 0 ) {
									disposeOneEmptyEntity( entity );
								}
							},
							$dispose: function() {
								// Check if we need to be removed:
								if( this.$e !== 0 ) this.$remove();
								poolDef_disposer.call( this );
							}
						});
					
					// Store the new creator and implicitly give it an id:
					allCreators.add( name, creator );
					
					var creatorId = creator._id,
						components = allComponents[ creatorId ] = {};
					
					// Add properties and methods to the creator:
					compactDefine( creator, defPropsUnenumerableUnwriteable, {
						_es: es,
						_id: creatorId
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
			bag = function( name ) {
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
			};
		
		
		
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
				disposeEntity: disposeEntity,
				componentCreator: componentCreator,
				bag: bag
			});
	};
