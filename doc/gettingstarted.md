Getting started
===============


The only exposed variable is `window.eJSEngine`. It is the constructor that creates a new ES (Entity System).

Here are the main steps to make a project with entity.JS:

1. include the scripts: entity.js and any additional library that adds definitions of components and systems.
1. define your components. What kind of data they will hold.
1. define your systems. Each system states which components it will use.
1. create the ES engine.
1. initialize your systems (optionally grouping your systems into hierarchies).
1. create entities and components in the engine.
1. Bonus: learn about links to components and entities
1. start executing your systems (usually by calling them from a main loop)

Writting the definitions of the components and systems before creating the ES engine makes it easier to reuse them in different projects. You can group definitions of related components and systems in the same .js files.

Note that when refering to component and system definitions, I often use their name as a string. It is more readable. But for larger projects, there is a way to use direct references. Which allows you to more easily find their source codes when you are debugging from a live browser. (TODO)

## Including the scripts

First you include the entity.JS script.  
Then any additional library you want to use (optional).  
Finally you add your code.

For example, let's say you are going to use a simple renderer named Entity-SimpleRenderer, that provides components and systems for you. And let's say you put all your code in a single file "mycoolproject.js".

Put this at the end of your body:

```HTML
<script src="js/entity.js" type="text/javascript"></script>
<script src="js/entity-simplerenderer.js" type="text/javascript"></script>
<script src="js/mycoolproject.js" type="text/javascript"></script>
```

Good. Now let's see your code.


## Defining a component

```JavaScript
eJSEngine.ComponentDef({
	name: "Position",
	attr: {
		x: 0,
		y: 0
	},
	init: function( x, y ) {
		this.setPosition( x, y );
	},
	helper: {
		setPosition: function( x, y ) {
			this.x = x;
			this.y = y;
		},
		getDistanceTo: function( oPos ) {
			var xx = this.x + oPos.x,
				yy = this.y + oPos.y;
			return Math.sqrt( xx * xx + yy * yy );
		}
	}
});
```

You have defined a new component with the name "Position". It has 2 attributes (`x` and `y`) and 2 helper methods (`setPosition()` and `getDistanceTo()`).  
- `ìnit` is a special function. If it is present, it will be called to init the component.
- `ìnit`, `attr` and `helpers` are optional. Only `name` is mandatory.

_Don't forget, you should not put any game logic in your components. Only in the systems._

This component definition will be available from any ES engine to make new components from.

Now let's make another component definition:

```JavaScript
eJSEngine.ComponentDef({
	name: "Speed",
	attr: {
		dx: 0,
		dy: 0
	}	// No helpers this time.
});
```


## Defining a system

```JavaScript
eJSEngine.SystemDef({
	name: "Move",
	cDefs: [ "Position", "Speed" ],
	init: function( entities, reverseSpeed, Position, Speed ) {
		// A liveQuery for specific components from the view:
		// (Note that the order of components is important)
		var lq = entities.liveQuery( Speed, Position );
		
		// Automatically dispose lq when this system is disposed:
		lq.disposeWith( this );
		
		// Set a public function on the system:
		this.setReverseSpeed = function(reverse) {
			reverseSpeed = (reverse == true);
		};
		
		// Another public function.
		// This one is required. It is used to execute the system:
		this.execute = function( elapsed, time ) {
			// Here we receive the components in the order we asked
			// in the liveQuery constructor.
			lq.each( function( e, speed, pos ) {
				// First argument, e, is the entity.
				var dx = speed.dx * elapsed,
					dy = speed.dy * elapsed;
				if( reverseSpeed ) {
					pos.x -= dx;
					pos.y -= dy;
				}
				else {
					// Here we see the use of an helper:
					pos.setPosition( pos.x + dx, pos.y + dy );
				}
			});
		};
	}
});
```

You have defined a new system with the name "Move". It requires the 2 components named "Position" and "Speed".  
The structure of the `init` arguments is as folow:
- a `Bag` (collection of entities) as first argument. This is usually the bag of all the entities. (But it can be configured for special needs)
- arguments given at function creation, they can be any number. Here we have only 1: `reverseSpeed`.
- finally, the component constructors in the order defined in the `cDefs` array.

This system definition will be available from any ES engine to make new systems from.

Let's make 2 other systems. One randomly spawns new entities and the other destroys entities leaving the area.

```JavaScript
eJSEngine.SystemDef({
	name: "SpawnRandomMoveables",
	cDefs: [ "Position", "Speed" ],
	init: function( entities, width, height, Position, Speed ) {
		// Accumulate elapsed time:
		var timeAcc = 0;
		
		this.execute = function( elapsed, time ) {
			// Note: elapsed is in milliseconds (1 second = 1000 ms).
			timeAcc += elapsed;
			// 1 spawn every 2 seconds:
			if(timeAcc >= 2000) {
				var nbSpawns = timeAcc % 2000;
				timeAcc -= nbSpawns * 2000;
				while( nbSpaw-- > 0 ) {
					var x = Math.random() * width,
						y = Math.random() * height,
						dx = Math.random() * 10,
						dy = Math.random() * 10;
					entities.newEntity( Position(x, y), Speed(dx, dy) );
				}
			}
		};
	}
});

eJSEngine.SystemDef({
	name: "KillAtEdge",
	cDefs: [ "Position" ],
	init: function( entities, width, height, Position ) {
		var lq = entities.liveQuery( Position ).disposeWith( this );
		
		this.execute = function( elapsed, time ) {
			lq.each( function( e, pos ) {
				if(pos.x < 0 || pos.x > width ||
				   pos.y < 0 || pos.y > height) {
					entities.disposeEntity(e);
				}
			});
		};
	}
});
```


## Create the ES engine

This is simple:

```JavaScript
var eJS = window.eJS = window.eJSEngine();
```

Now `eJS` is a reference to the new engine.
You can use another name if you want, but I recommend using `eJS`: simple and easy to remember.


## Initialize a system

You can pass the additional arguments expected by the system's `init` function. In our case, `reverseSpeed` is set to false at the beginning.

```JavaScript
var moveSys = eJS.newSystem( "Move", false ),
	spawnSys = eJS.newSystem( "SpawnRandomMoveables", 200, 200 ),
	killSys = eJS.newSystem( "KillAtEdge", 200, 200 );
```

Now you have your systems. You can access their methods, for example:

```JavaScript
// Reverse all the speeds:
moveSys.setReverseSpeed( true );

// Execute the system manually:
moveSys.execute( 0, 0 );
```

If you have a lot of systems and want to organize them by groups, see here (TODO).
Also, if you want to make multiple systems of the same kind (for example with different arguments), you can use system tags (TODO).


# Create entities and components

Now that you have all your systems ready, it is time to put some entities in our empty engine. Usually the entities come from level datas, save game, online sync with a server, etc.

Since we are not in a system, we have a little bit more work to do to get ready. We need to get the component creators and use the bag with all the entities:

```JavaScript
// The bag with all the entities of the ES engine:
var entities = eJS.entities;

// Get the component creators:
var Position = eJS.componentCreator("Position"),
	Move = eJS.componentCreator("Move");

// You can create entities in different ways.

// Simple:
entities.newEntity(Position(10, 10));	// Doesn't move
entities.newEntity(Position(15, 15), Move(0, 1));	// Moves up

// Flexible:
var pos = Position(0, 0),
	move = Move(0, 0);
pos.setPosition(30, 30);
move.dx = 1;	// Moves right
entities.newEntity(move, pos);
```

Tips:
- don't keep references to entities or components between function execution. That means, don't keep references to them when you exit the function. (Because a system can destroy them at any time)
- when you need to keep a reference, use Links as explained in the next part.


## Bonus: links to components and entities

**Why do we need Links ?**  
To reduce the need for GC (Garbage Collection), entity.JS reuses objects and entity ids instead of throwing them away. It allows the ES to keep smooth FPS. But it also means that the reference you keep to them can be reused for new objects.
Thus, if you are not careful, and you keep a reference to an object, that object can be destroyed by other systems. The next time you try to access that object, it may not exist anymore or worse it may point to a completely different object.

**Where should we not use Links ?**  
When for example you only need to keep a reference to components or entities for the duration of 1 single execution of your system. As soon as you exit your system's `execute()` function, you don't know if another system is not going to destroy them and thus you should use Links.

**Where should we use Links ?**  
When a component keeps references to other related components.  
To keep references to special entities and components (like the player) from your game code (ie. from outside systems).

**How does it works ?**  
There are links for components: `cLink`, and links for entities: `eLink`. The engine keeps track of components and entities referenced by links and notifies the links when the components or entities are removed from the engine.  

Note that for convenience, the links constructors are accessible from either `eJSEngine`, `eJS` or `this` when you are in a system.

For example let's say some entities move by following other entities, those entities need to reference the position component of the entity they are following:

```JavaScript
eJSEngine.ComponentDef({
	name: "Follower",
	attr: {
		followed: eJSEngine.cLink(),
	},
	// Define relations to other components:
	links: [ "Position" ],
	init: function( position ) {
		this.followed.c = position;
	}
});

eJSEngine.SystemDef({
	name: "Follow",
	cDefs: [ "Position", "Speed", "Follower" ],
	init: function( entities, Position, Speed, Follower ) {
		var lv = entities.liveView( Position, Speed, Follower );
			q = lv.query( Position, Speed, Follower );
		
		this.execute = function( elapsed, time ) {
			q.each( function( e, pos, speed, follower ) {
				var followedPos = follower.followed.c;
				// In case the followed component has disappeared,
				// then we remove the follower component too.
				// (Alternatively we could choose another followed)
				if(followedPos === null) followedPos.$dispose();
				else {
					// Quick'n dirty (will stay around followedPos):
					speed.dx = (followedPos.x - pos.x) / 100;
					speed.dx = (followedPos.y - pos.y) / 100;
				}
			});
		};
		
		// Finally let's free the ressources when we are destroyed:
		this.onDisposed = function() {
			q.dispose();
			lv.dispose();
		};
	}
});

var	followSys = eJS.newSystem( "Follow" );
```

Here is how you can use `cLink` and `eLink`:

```JavaScript
var pos = Position( 0, 0 ),
	speed = Speed( 0, 0 ),
	entity = entities.newEntity( pos, speed );

// Set the link at initialization or after:
var posL = eJS.cLink( pos ),
	entityL = eJS.eLink();
entityL.e = entity;

// Let's see what happen when the links are cut:
pos.$dispose();
posL.c === null;	// => true
eJS.disposeEntity(entity);
entityL.e === -1;	// => true

// When you don't need a Link anymore, let entity.JS reuse it:
posL.dispose();
entityL.dispose();
```


## Start execution

Usually you will execute the systems in a defined order from a game loop.

Let's simulate an execution of 1 minute, where the systems are executed 10 times per seconds:

```JavaScript
var time = 0,
	elapsed = 1000 / 10,
	end = 10 * 60;
for( var i = 1; i <= end; i++ ) {
	time += elapsed;
	followSys.execute( elapsed, time );
	moveSys.execute( elapsed, time );
	killSys.execute( elapsed, time );
	spawnSys.execute( elapsed, time );
}
```
