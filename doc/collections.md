Collections
===========


## Selector

Immutable object that act like filters to select entities based on what components they have. 

### es.anySelector
A selector that matches any entity.

### es.selector( objectDef | componentType... )
**Constructor**: returns a new selector or an existing selector if the description matches an existing one.  
Accepts either an objectDef or a list of component types.
- **objectDef**: an object with one of the following properties:
    - **has** (optional): an array of ComponentDefs or ComponentCreators or component names that the entities must have.
    - **not** (optional): an array of ComponentDefs or ComponentCreators or component names that the entities must **not** have.
- **componentType...**: list of ComponentDefs or ComponentCreators or component names that the entities must have. (ie. a shorthand for using only **has** from the objectDef)

### .matches( entity... )
Returns true if it matches all given entities.

### .equals( selector )
Returns true if both selectors matches the same entities.


## Bag

A set of entities.

### es.entities
A special Bag containing all the entities managed by this engine. See: es.

### es.bag( [name] )
**Constructor**: returns a new bag.
- **name** (optional): the name of the bag.

### .name
Name of the bag or `undefined`.

### .length
Number of entities in the bag.

### .newEntity( component... )
Creates a new entity and adds it to this bag. See: Entity.

### .disposeEntity( entity... )
Disposes given entities. See: Entity.

### .add( entity... )
Adds the given entities to this bag.
- **entity...**: entities only.

### .addFrom( entity..., [selector] )
Adds the given entities to this bag.
- **entity...**: entities, eLinks, arrays of entities, arrays of eLinks and bags.
- **selector** (optional): only add the entities that are matched by the selector. Also accepts components types directly.

### .remove( entity... )
Removes the given entities from this bag.
- **entity...**: entities only.

### .removeFrom( entity..., [selector] )
Removes the given entities from this bag.
- **entity...**: entities, eLinks, arrays of entities, arrays of eLinks and bags.
- **selector** (optional): only remove the entities that are matched by the selector. Also accepts components types directly.

### .has( entity... )
Returns true if this bag contains all the given entities.
- **entity...**: entities only.

### .hasFrom( entity..., [selector] )
Returns true if this bag contains all the given entities.
- **entity...**: entities, eLinks, arrays of entities, arrays of eLinks and bags.
- **selector** (optional): only consider the entities that are matched by the selector. Also accepts components types directly.

### .keep( selector )
Only keep the entities that match the selector.
- **selector**: only keep the entities that are matched by the selector. Also accepts components types directly.

### .discard( selector )
Discard all entities that match the selector.
- **selector**: only remove the entities that are matched by the selector. Also accepts components types directly.

### .clear()
Removes all entities from this bag.

### .query( componentType... )
Creates a new Query. See: Query.

### .liveQuery( componentType... )
Creates a new LiveQuery. See: LiveQuery.

### .dispose()
Calls .empty(), then removes all created views, liveViews and finally itself from the engine.


## Query

Allows you to efficiently iterate components of a bag that matches a selector. It runs through all the entities of the bag and only returns the selected components.  
Use this when the set of components changes rapidly and often over time.

### bag.query( [selector], componentType... )
**Constructor**: returns a new Query for that bag.
- **selector**: used to select matching entities. If missing, a selector will be made with the given componentType.
- **componentType...**: ComponentCreators and component names that define which component will be returned by the iteration. Order is important and will define the order in which you receive the components in `.each()`.

### .bag
The bag of this query.

### .selector
The selector of this query.

### .iterated
An array of the iterated ComponentCreators.

### .each( callback( entity, component... ) )
Iteration. Calls the callback for each matching entity. Iteration order is unpredictable.
- **callback( entity, component... )**: 
    - **entity**: the current entity.
    - **component...**: the requested components of the current entity in the order defined at Query instantiation.

### .dispose()
Disposes the query.

### .disposeWith( object )
Set this Query to be automatically disposed when the object is disposed.


## LiveQuery

Like Query, it allows you to efficiently iterate components of a bag that matches a selector.  
The difference is that a liveQuery doens't run through all the entities of the bag. Instead, it internally keeps a list of components that is always updated when entities are added/removed from the bag, and when components are added/removed from the entities.
Use this when you need fast iteration at the expense of some more memory.
Note: care must be taken when you add/remove components or entities while iterating, as it will be instantly reflected by the LiveQuery:
- entities removed wont be iterated if they have not already been iterated.
- entities added may or may not be iterated (it is unpredictable).

Thus, you should wait until the end of the iteration to add new entities or components that may result in the entity being included in the currently running iteration.

**It has exactly the same properties and methods as a Query. See: Query.**
