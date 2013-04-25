Systems
=======


## SystemDef

Definition for a type of system.  
Systems contain logics that act on a set of components and their datas. 
A system contains logics that act on a set of components.  
Once a ComponentDef is made, you can inspect its properties, but you must not change nor execute them.  
Name of systems must be unique.

### esEngine.SystemDef( objectDef )
**Defines** and returns a new type of system.  
Throws an error if the name is already taken.
- **objectDef**: an object with the following properties:
    - **name**: a string with the name for the system.
    - **cDefs**: an array of ComponentDef that this system requires to work. You can give references to ComponentDefs or their names.
    - **init**: `function( bag, args..., componentCreator...)`: `bag` and `componentCreator...` are automatically given by esEngine.
        - **bag**: the default bag that the system will work on. By default esEngine will provide `es.entities`, but you can choose an alternative bag at system instanciation (see next point).
        - **args...**: any additional argument you can give when instanciating the system. If the first argument is a bag, it will replace the default **bag** argument.
        - **componentCreator...**: the componentCreators that correspond to the cDefs, automatically given by esEngine.

### .name
Name of the system.

### .cDefs
Array of required componentDefs.

### .init
Function that initialises the new system.


## System

A system has a `.execute()` function which is called each time the system is run. It can also have other user added methods.

### es.system( SystemDef, [bag], args... )
**Constructor**: returns a new system from the given SystemDef.  
Throws an error if the tag is already taken for the system name.
- **SystemDef**: can be a reference to a SystemDef or the name of a SystemDef as a string:
    - **name**: in the form `"SystemDefName:tag"` where `":tag"` is optinal.
    - **SystemDef**: to add a tag you must give an array in the form `[ SystemDef, "tag" ]`.
- **bag** (optional): alternative bag that will be processed by the system. By default it is `es.entities`.
- **args...**: additional arguments required by the SystemDef.


### .def
A reference to the SystemDef of this system.

### .name
Complete name of the system, including its tag. (ie. def.name + ":" + tag)

### .tag
Tag of the system. The default tag is "", the empty string.

### .execute( args... )
Called to run the system.
- **args...**: arguments needed by this system.

### .dispose()
Removes a system from the engine and disposes it.
  
### .onDisposed()
Called when disposed, just before removing it from the engine.
  
### .signals.onDisposed => function( system )
Triggered just before calling `.onDisposed()`.
- system: this system.

## _Executable_
Refers to any object that has an `execute()` method and a `name` property.

Systems and executableGroups are _Executables_.

## ExecutableGroup

An ExecutableGroup is an ordered container for executables like systems and other executableGroups. It allows to easily group, manage and control your systems. It is optimized for fast execution.  
Note that an ExecutableGroup cannot contain 2 executables with the same name.
**execSelect**: a string that allows to select an Executable in the current executableGroup. Uses a namespace-like notation. For example: "subgroup.subsubgroup" or "subgroup.subsubgroup.system:tag".

### es.executableGroup( name )
**Constructor**: returns a new SytemGroup.  
- **name**: name of the executableGroup. Does not need to be unique.

### .name
Name of this executableGroup.

### .execute( args... )
Executes all non paused systems with the given arguments.  
Allows chaining.

### .append( executable... )
Appends the given executable at the end.  
Allows chaining.
- **executable...**: any executable. Also accepts system and executableGroup names.

### .after( execSelect, executable... )
Appends the given executables after execSelect.  
Allows chaining.
- **executable...**: any executable. Also accepts system and executableGroup names.

### .before( execSelect, executable.... )
Appends the given executables before execSelect.  
Allows chaining.
- **executable...**: any executable. Also accepts system and executableGroup names.

### .has( execSelect... )
Returns true if it contains all the given executables.

### .get( execSelect )
Returns the given executable if it has it, or returns `null`.

### .remove( execSelect... )
Removes the given executables.  
Allows chaining.

### .pause( execSelect... )
Pauses the given executables.  
Allows chaining.

### .isPaused( execSelect... )
Returns true if all given executables are paused.

### .unpause( execSelect... )
Resumes the given executables.  
Allows chaining.

### .time( execSelect... )
Turns on the timing of the given executables.  
Timing uses console.time() and console.timeEnd().  
Allows chaining.  
_TODO: what if console.time() is not available ? Use Date.now() ? window.performance.webkitNow() ?_

### .untime( execSelect... )
Turns off the timing of the given executables.  
Allows chaining.
