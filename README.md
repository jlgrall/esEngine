esEngine
=========


A JavaScript Entity System with focus on speed and efficiency.

_Entity Component System_ is often simply referenced as _Entity System_ or _ES_.

Documentation is written before the code. Code must conform to the written documentation. All example codes from the documentation are part of the unit tests.

Compatible with modern browsers and IE9+.

Published under the MIT license.


## Documentation

[Documentation summary](doc/README.md)

How it works:
- [Getting started](doc/gettingstarted.md)
- [Getting advanced](doc/gettingadvanced.md)

API:
- [Engine](doc/engine.md)
- [Entities](doc/entities.md)
- [Components](doc/components.md)
- [Systems](doc/systems.md)
- [Collections](doc/collections.md)


## Entity System (ES)

Entity System is a software architecture that is specially well suited to make games. It is data driven, offers great flexibility even at runtime (you can theoretically make most of your game at runtime), and scales very well.

Step-by-step introduction to ES: http://www.richardlord.net/blog/what-is-an-entity-framework  
More infos about ES: http://entity-systems.wikidot.com/


## How to build and contribute

### Install

You need to have [git](http://git-scm.com/) and [Node.js](http://nodejs.org/) installed. You also need to have [grunt-cli](http://gruntjs.com/) as a global Node.js install:

```sh
npm install -g grunt-cli
```

Clone the git repository locally and go in it:

```sh
git clone git://github.com/jquery/jquery.git
cd esEngine
```

Install the build dependencies (Node.js packages) in the folder (takes 2 minutes):

```sh
npm install
```

That's it, you are ready. Now you can use the following commands.

### Commands

- `grunt`: build and check everything. You can find built files in the `dist/` folder.
- `grunt clean`: clean the `dist/` folder.
- `grunt watch`: when you are editing the files, it will automatically rebuild the needed files when you save them.
- `grunt report`: reports the minified and gzipped sizes (project must be already built).

**Important: don't forget to run `grunt` before you commit to check that everything works.**

