Getting advanced
===============


Introduction to some of the more advanced features of esEngine:

1. ExecutableGroup: manage your systems
1. Multiple instances of the same systems (Tags, Alternative bag)
1. Selectors
1. Collections (Bag, Query and LiveQuery, IdMap)
1. Direct references


## ExecutableGroup: manage your systems

When you start to have a lot of systems or if you want a more powerful management of systems, use `ExecutableGroup`. An `ExecutableGroup` can be composed of systems and other `ExecutableGroup`.

```JavaScript
var updateGroup = es.executableGroup( "update" ),
  movementGroup = es.executableGroup( "movement" );

movementGroup.append( "Follow", "Move" );
updateGroup.append( movementGroup, "KillAtEdge", "SpawnRandomMoveables" );

// Another more readable way using arrays.
// Each sub array will also be translated into a new ExecutableGroup,
// and the first string of each array is the ExecutableGroup name.
updateGroup = es.executableGroup( [ "update",
	[ "movement",
		"Follow",
		"Move"
	],
	"KillAtEdge",
	"SpawnRandomMoveables"
] );

// We can get any element:
movementGroup = updateGroup.get( "movement" );
moveSys = updateGroup.get( "movement.Move" );

// This will return null:
var doesNotExists = updateGroup.get( "doesNotExists" );
```

Now that you have your groups, you can use some new features:

```JavaScript
// Execute all your systems in order:
updateGroup.execute( time, elapsed );

// Pause systems (it won't be execute by the group):
updateGroup.pause( "SpawnRandomMoveables", "movement.Follow" );
// Pause groups:
updateGroup.pause( "movement" );

// Unpause:
updateGroup.unpause( "SpawnRandomMoveables", "movement", "movement.*" );

// Time the execution of a system or group:
updateGroup.time( "KillAtEdge" );

// the following times each system and group
// directly under movementGroup:
updateGroup.time( "movement.*" );

// Stop timing the executions:
updateGroup.untime( "KillAtEdge", "movement.*" );
```


## Multiple instances of the same systems

### Tags

You can use multiple instances of the same SystemDef. Each system instance is distinguished by a different tag. Tags are added at the end of the system name like this: `MySystem:myTag`.

When the tag is omitted, systems have the empty tag: "", and the tag separator (":") can be omitted too.

For example, let's add another KillAtEdge system, but with a smaller area of only 50 x 50:

```JavaScript
// The tag is "smaller":
var killSmallerSys = es.system( "KillAtEdge:smaller", 50, 50 );

// Add it to the update group, after the 
// system "KillAtEdge" with the default empty tag:
updateGroup.after( "KillAtEdge", "KillAtEdge:smaller");
// Now KillAtEdge:smaller will be executed just after KillAtEdge.

// Pause the system:
updateGroup.pause( "KillAtEdge:smaller" );
// Now you can just pause and unpause whichever you want.
```
Note: you can use `"KillAtEdge:"` instead of `"KillAtEdge"`, it works too.

### Alternative bag

You can choose a different bag than the default `es.entities` for your system. Just pass it after the system name:

```JavaScript
// We want to run a parallel world whose entities
// are contained in a separate bag:
var parallelBag = es.bag( "Parallel world bag" );
var moveParaSys = es.system( "Move:parallel", parallelBag, false );
```

Combined with tags, it can be very useful.


## Selectors

Selectors act like filters to select entities based on what components they possess. They are used by queries among other things.

For example, let's say we want to reset the position of entities that are moving but not following another entity:

```JavaScript
var select = es.selector({
	has: [ "Position", "Speed" ],
	not: [ "Follower" ]
});

// Here we are only interested by the Position components:
var lqMovingNotFollowing = entities.liveQuery( select, Position );
lqMovingNotFollowing.each( function( e, pos ) {
	pos.setPosition( 0, 0 );
});
```

## Collections

All collections are unordered, meaning that the order in which entities are kept and iterated is unpredictable.

Currently there is only 1 kind of collection: the bags.

### Bags

A bag is a container in which you can add and remove any entity you want. Giving them name helps for debugging.

`es.entities` is a special bag created by the engine and which contains all the entities of the engine. You can't directly add or remove entities from it.

```JavaScript
// Create a new bag:
var bag = es.bag( "My bag" );

// Add entities with specific components from another bag:
bag.add( es.entities, "Position", "Speed" );
// Or with a selector:
bag.add( es.entities, es.selector( {
	has: [ "Position" ]
}));
```

`bag.count` tells you how many entities are in the bag.

### Query and LiveQuery

Why use `Query` and `LiveQuery` ?

Here is how to manually retrieve a component for an entity, but it is a slow process if done repeatedly in a loop:

```JavaScript
// Inside a system, you automatically receive references
// to ComponentCreators. But outside, you must do:
var Position = es.componentCreator( "Position" );

// Now suppose e is an entity:
var pos = Position.getFor( e );
```

`Query` and `LiveQuery` give you a faster way to iterate all components from entities in a bag. Both will give the same results, but they are optimized for 2 different cases:
- `Query` will always iterate over all the entities of the bag and filter out those that don't match the selector.
- `LiveQuery` will internally keep an always up to date list of entities and components that matches the selector. It means that the engine automatically updates all liveQueries when you add or remove components to entities accordingly to their selectors and in an optimized way.

In most case, you should use the `LiveQuery` which makes iteration faster. Use the `Query` when you want to save memory, when you rarely need to perform the iteration, or for components that are very often created and destroyed.

By the way, it is easy to switch between them, so if you are not sure, just test both in real conditions.

Here is an example with a Query:

```JavaScript
// Create a query that will iterate the Speed
// and Position components:
var q = es.entities.query( Speed, Position );

// When iterating, you receive the entity e,
// then the list of components:
q.each( function( e, speed, pos ) {
	// Do something...
});

// Release ressources when you don't need
// the query anymore:
q.dispose();
```

Note: You can also use `.disposeWith()` when working in a system.

Releasing ressources is especially important with LiveQuery.

### IdMap

When 2 ES engines need to communicate (for example between a server and a client), it may be difficult to identify the same entity in both engines, because the ids of entities will be different in the 2 engines.

In this case you should use `es.IdMap()` (TODO).


## Direct references

When you need to retrieve or pass a ComponentDef, a ComponentCreator or a component, you have the choice between using the name as a string, or a direct reference. Here is an exemple:

```JavaScript
// Inside a system, you automatically receive references
// to ComponentCreators. But outside, you must do:
var Position = es.componentCreator( "Position" ),
	lq;

// Using a string:
lq = es.entities.liveQuery( "Position" );
// Using a direct reference:
lq = es.entities.liveQuery( Position );
```

Advantage of using strings:
- it is a lot more readable.

Advantages of using direct references:
- it is faster. No string is used, even internally. It uses ids and array lookups which is faster than object properties lookups. And the JIT knows what is referenced and can finely optimize it, which is not the case with strings.
- live debugging. You can directly go to the code in your debugger and you can check all the references.
- better minification. Variable names are minified to 1 character only.
- allows to do introspection and manage things dynamically without knowing their names.

esEngine gives you the choice in most places, but requires the use of direct references in critical functions like when you are in loops.

It is usually better to use strings during initialization, definitions or rarely executed code, and keep direct references for performance intensive code.