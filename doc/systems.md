Systems
=======


## SystemDef

Definition for a type of system.  
Systems contain logics that act on a set of components and their datas. 
A system contains logics that act on a set of components.  
Once a ComponentDef is made, you can inspect its properties, but you must not change nor execute them.  
Name of systems must be unique.

### eJSEngine.SystemDef( objectDef )
**Defines** and returns a new type of system.  
Throws an error if the name is already taken.
- **objectDef**: an object with the following properties:
    - **name**: a string with the name for the system.
    - **cDefs**: an array of ComponentDef that this system requires to work. You can give references to ComponentDefs or their names.
    - **init**: `function( bag, args..., componentCreator...)`: `bag` and `componentCreator...` are automatically given by esEngine.
        - **bag**: the default bag that the system will work on. By default esEngine will provide `eJS.entities`, but you can choose an alternative bag at system instanciation (see next point).
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

### eJS.newSystem( SystemDef, [bag], args... )
**Constructor**: returns a new system from the given SystemDef.  
Throws an error if the tag is already taken for the system name.
- **SystemDef**: can be a reference to a SystemDef or the name of a SystemDef as a string:
    - **name**: in the form `"SystemDefName:tag"` where `":tag"` is optinal.
    - **SystemDef**: to add a tag you must give an array in the form `[ SystemDef, "tag" ]`.
- **bag** (optional): alternative bag that will be processed by the system. By default it is `eJS.entities`.
- **args...**: additional arguments required by the SystemDef.


### .definition
A reference to the SystemDef of this system.

### .name
Name of the system.

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


## SystemGroup

A SystemGroup is an ordered container for systems and other sub SystemGroups. It allows to easily group, manage and control your systems. It is optimized for fast execution of systems.  
**SysOrSysGr** (System or SystemGroup): means that the parameter can be either a System or a SystemGroup, and it can always be given as a string with the name of the System or SystemGroup or as a direct reference.  
If you want to access a SysOrSysGr in a sub SystemGroup, you can use a namespace-like notation. For example: "subgroup.subsubgroup" or "subgroup.subsubgroup.system:tag". Note that "." means the current SystemGroup.

### eJS.systemGroup( name )
**Constructor**: returns a new SstemGroup.  
Throws an error if the name is already taken.
- **name**: name of the SystemGroup.

### .name
Name of the SystemGroup.

### .execute( args... )
Executes all non paused systems with the given arguments.  
Allows chaining.

### .append( SysOrSysGr... )
Appends the given systems and SystemGroups at the end.  
Allows chaining.

### .after( anchorSysOrSysGr, SysOrSysGr... )
Appends the given systems and SystemGroups after anchorSysOrSysGr.  
Allows chaining.

### .before( anchorSysOrSysGr, SysOrSysGr... )
Appends the given systems and SystemGroups before anchorSysOrSysGr.  
Allows chaining.

### .has( SysOrSysGr... )
Returns true if it contains all given systems and SystemGroups.

### .get( SysOrSysGr )
Returns the given systems or SystemGroups if it has it. Otherwise returns `null`.

### .remove( SysOrSysGr... )
Removes the given systems and SystemGroups.  
Allows chaining.

### .pause( SysOrSysGr... )
Pauses the given systems and SystemGroups.  
Allows chaining.

### .isPaused( SysOrSysGr... )
Returns true if all given systems and SystemGroups are paused.

### .unpause( SysOrSysGr... )
Resumes the given systems and SystemGroups.  
Allows chaining.

### .time( SysOrSysGr... )
Turns on the timing of the given systems and SystemGroups.  
Timing uses console.time() and console.timeEnd().  
Allows chaining.  
_TODO: what if console.time() is not available ? Use Date.now() ? window.performance.webkitNow() ?_

### .untime( SysOrSysGr... )
Turns off the timing of the given systems and SystemGroups.  
Allows chaining.
