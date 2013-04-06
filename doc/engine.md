Engine
======


## window.esEngine

This is the only exposed variable.

### window.esEngine()
**Constructor**: creates a new component system engine.  
Preferred way: `var es = window.es = window.esEngine();`  
`es` is the recommended name. It is the name we will use in all the documentations.

### esEngine.ComponentDef( objectDef )
Defines a new type of component. See: ComponentDef.

### esEngine.SystemDef( objectDef )
Defines a new type of component. See: SystemDef.


## es

An ES engine instance.

### .entities
A special Bag named "*" containing all the entities managed by this engine.  
You cannot directly add or remove entities from this bag (do it through `bag.newEntity()` and `component.$dispose()`).  
_Note: the name of this bag may change in a future release._

### .destroyEngine()
Destroys the engine and releases all its ressources.

### es.newEntity( component... )
Creates a new entity. See: Entity.

### es.disposeEntity( entity )
Disposes an entity. See: Entity.

### es.componentCreator( ComponentName | ComponentDef )
Get a ComponentCreator. See: ComponentCreator.

### es.newSystem( SystemDef, [bag], args... )
Creates a new system. See: System.

### es.systemGroup( name )
Creates a new SystemGroup. See: SystemGroup.

### es.eLink( [entity] )
Creates a new eLink. See: eLink.

### es.cLink( [component] )
Creates a new cLink. See: cLink.

### es.anySelector
A selector that matches any entity. See: Selector.

### es.selector( objectDef | componentType... )
Returns a selector. See: Selector.

### es.bag( [name] )
Creates a new bag. See: Bag.
