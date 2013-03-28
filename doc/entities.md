Entities
===========


## Entity

An entity represents the relation of associated components.  
In esEngine, entities are not objects. They are just integers > 0.  When entities are disposed, the integers will be reused for new entities.  So don't store entities directly, but use Links.  
In most cases you can use entities as if they were objects. Returning `0` (a falsy value) when no entity is found allows to use conditions like: `if( entity ) ...`.  
Entity destruction can happen in 2 ways:
- when the last component of an entity is disposed.
- calling `.disposeEntity(entity)`.

### {es,bag}.newEntity( component... )
**Constructor**: returns a new entity with the given components.  
This method is available from `es` and from any bag. It will automatically add the entity to that bag in addition to the default `es.entities` bag.

### {es,bag}.disposeEntity( entity )
Disposes the given entity and all its components.  
This method is available from `es` and from any bag.


## eLink

Link to an entity.  
Keeps a direct reference to an entity until the entity is disposed, safeguarding you from inadvertently keeping a reference to an entity that has been disposed by another system.  
When a link is disposed, it can be reused by the engine.

### es.eLink( [entity] )
**Constructor**: returns a new link to an entity.
- **entity** (optional): the initial entity. By default it is `0` (a falsy value).

### .e
The linked entity or `0` if not linked or if the entity was disposed.  
You should directly read and write to this property.

### .dispose()
Disposes the eLink. (Not the entity)
