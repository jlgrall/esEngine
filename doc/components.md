Components
==========


## ComponentDef

Definition for a type of component.  
Components store data. They don't have any logic in them.  
But they can have helpers, that is, methods to access or store data but which has no game logic. For example: a Position component can have the helpers setPosition(x, y) or getDistanceTo(position2).  
A component can only contain primitive values (undefined, null, booleans, numbers, strings) eLinks, cLinks, arrays and objects. Arrays and objects must be defined empty (ie. they are empty before initialization), and can only contain primitive values, eLinks and cLinks.
Once a ComponentDef is made, you can inspect its properties, but you must not change nor execute them.  
Name of components must be unique.

### esEngine.ComponentDef( objectDef )
**Defines** and returns a new type of component.  
Throws an error if the name is already taken.
- **objectDef**: an object with the following properties:
    - **name**: a string with the name for the components.
    - **attr** (optional): an object whose properties define the attributes of the components.
    - **init** (optional): a function that will be executed on newly created components. It can use any argument.
    - **helpers** (optional): an object whose properties are methods that will be available on the created components for getting/setting datas.

### .name
Name of the component type.

### .data
Properties of the components and their default values.

### .init
Function that initialises the new components.

### .helpers
Methods that will be available on the created component for getting/setting datas.

## ComponentCreator

An object used to control components of a certain type in an ES engine.  
You can obtain a ComponentCreator in two ways:
- in a system where you get it automatically
- `es.componentCreator()`

### es.componentCreator( ComponentDef )
Returns a componentCreator for the given ComponentDef.
- **ComponentDef**: can be a reference to a ComponentDef or the name of a ComponentDef as a string.

### .def
A reference to the ComponentDef of this ComponentCreator.

### .name
Name of the component type.

### 'ComponentCreator'( args... )
_(ie. calling a ComponentCreator directly)_  
**Constructor**: returns a new component from this ComponentCreator.
- **args...**: the arguments will be given to the ComponentDef's `init()` function.

### .getFor( entity )
Retrieves the component of the type of the current componentCreator, associated with the given entity. Or `null` if not found.  
This is relatively slow and unoptimized if you call it repetitively. If you want to retrieve all the components from a set of entities, use a `Query` instead.

## Component

A component contains datas, also named the component's attributes. It also has simple getters and setters for the datas also called helpers.  
You can directly access the attributes and helpers on the component: `myComponent.attr1` or `myComponent.helperX()`. You can directly modify the attributes, but you must never add/remove new properties to components, and you must not modify the helpers. In addition, components offer useful functions prefixed with "$" and made non-enumerable to prevent conflicts with other attributes and helpers names.

### .$creator
A reference to the ComponentCreator for this component.

### .$addTo( entity )
Adds this component to an entity.  
Throws an error if the component was already added to another entity.

### .$dispose()
Removes this component from its entity and from the ES engine and disposes it. (You must not continue to use this component afterwards, as it may be reused by esEngine to make future components)


## cLink

Link to a component.  
Keeps a direct reference to a component until the component is disposed, safeguarding you from inadvertently keeping a reference to a component that has been disposed by another system.  
When a link is disposed, it can be reused by the engine.

### es.cLink( [component] )
**Constructor**: returns a new link to a component.
- **entity** (optional): the initial component. By default it is `null`.

### .c
The linked component or `null` if not linked or if the component was disposed.  
You should directly read and write to this property.

### .dispose()
Disposes the cLink. (Not the component)
