Engine
======


## window.eJSEngine

This is the only exposed variable.

### window.eJSEngine()
**Constructor**: creates a new component system engine.  
Preferred way: `var eJS = window.eJS = window.eJSEngine();`  
`eJS` is the recommended name. It is the name we will use in all the documentations.


## eJS

An ES engine instance.

### .entities
A special Bag named "*" containing all the entities managed by this engine.  
You cannot directly add or remove entities from this bag (do it through `bag.newEntity()` and `component.$dispose()`).  

### .destroyEngine()
Destroys the engine and releases all its ressources.

### eJS.newEntity( component... )
Creates a new entity. See: Entity.

### eJS.disposeEntity( entity )
Disposes an entity. See: Entity.

### eJSEngine.ComponentDef( objectDef )
Defines a new type of component. See: ComponentDef.

### eJS.componentCreator( ComponentName | ComponentDef )
Get a ComponentCreator. See: ComponentCreator.

### eJSEngine.SystemDef( objectDef )
Defines a new type of component. See: SystemDef.

### eJS.newSystem( SystemDef, [bag], args... )
Creates a new system. See: System.

### eJS.systemGroup( name )
Creates a new SystemGroup. See: SystemGroup.

### eJS.eLink( [entity] )
Creates a new eLink. See: eLink.

### eJS.cLink( [component] )
Creates a new cLink. See: cLink.

### eJS.anySelector
A selector that matches any entity. See: Selector.

### eJS.selector( objectDef | componentType... )
Returns a selector. See: Selector.

### eJS.bag( [name] )
Creates a new bag. See: Bag.
