Booty5 is a free open source HTML5 game engine written using JavaScript. A full game editor / game maker application is also available from the [Booty5 website](http://booty5.com).

For more in-depth information about the Booty5 engine and game editor see the [Booty5 website](http://www.booty5.com/index.php/booty5). For API reference see the [Booty5 API reference](http://booty5.com/html5-game-engine/booty5-html5-game-engine-reference/)

Currently supports:
- Mobile and desktop
- Resource management
- Scene management
- Actor (game object) management, image, text, shape and particle system based
- Sprite, text and 2D polygon rendering
- Box2D via Box2DWeb
- Animation timelines / tweening
- Bitmap and gradient brushes
- Sprite atlases
- Frame based bitmap animation
- Touch event handlers
- Scene and actor clipping
- 2D canvas
- Audio play back, including reliable audio via Marmalasde Web if available
- Dynamic scaling of canvas to fit display
- Game object caching to speed up rendering
- Support for Booty5 game HTML5 editor / maker

#The Basics
##TheApp
TheApp is the main app controller and is responsible for general housekeeping and Scene processing, TheApp has the following features:
- Manages global resources
- Manages global animation timelines
- Manages a collection of Scenes
- Handles touch input
- Finds which Actor was touched
- Main loop processing
- Scales / resizes  canvas to fit the display

##Scenes
A Scene is a container for game objects and has the following features:
- Manages scene local resources
- Manages scene local timeline animations
- Manages a collection of Actors
- Supports a camera
- Camera can target actors and follow them on x and y axis
- Touch panning (user can drag the camera around)
- Box2D world physics
- Extents which limit camera movement
- Can detect when an actor in the scene has been touched
- Clipping of child actors against scene, also supports clipping shapes
- Scene wide opacity
- Scene layer ordering

Scenes support the following event handlers:
- onCreate() - Called just after Scene has been created
- onDestroy() - Called just before Scene is destroyed
- onTick(delta_time) - Called each time the Scene is updated (every frame)
- onBeginTouch(touch_pos) - Called when the Scene is touched
- onEndTouch(touch_pos) - Called when the Scene has top being touched
- onMoveTouch(touch_pos) - Called when a touch is moved over the Scene

##Actors
An Actor is a basic game object that carries our game logic and rendering. The base Actor has the following features:
- Position, size, scale, rotation (set use_transform to true if using rotation or scaling, auto set if using Box2D)
- Can be represented visually by arcs, rectangles (included rounded), polygons, bitmaps and labels
- Support for a virtual canvas that can scroll content around
- Absolute (pixel coordinate) and relative (based on size of Actor) origins
- 3D depth (allows easy parallax scrolling)
- Angular, linear and depth velocity
- Box2D physics support (including multiple fixtures and joints)
- Bitmap frame animation
- Sprite atlas and gradient brush support
- Child actor hierarchy
- Begin, end and move touch events (when touchable is true), also supports event bubbling
- Canvas edge docking with dock margins
- Can move in relation to camera or be locked in place
- Can be made to wrap with scene extents on x and y axis
- Clip child actors against the extents of the parent with margins and shapes
- Layer ordering
- Opacity
- Composite operations

Supports the following event handlers:
- onCreate() - Called just after Actor has been created
- onDestroy() - Called just before Actor is destroyed
- onTick(delta_time) - Called each time the Actor is updated (every frame)
- onTapped(touch_pos) - Called when the Actor is tapped / clicked
- onBeginTouch(touch_pos) - Called when the Actor is touching
- onEndTouch(touch_pos) - Called when the Actor has top being touching
- onMoveTouch(touch_pos) - Called when a touch is moved over the Actor
- onCollisionStart(contact) - Called when the Actor started colliding with another
- onCollisionEnd(contact) - Called when the Actor stopped colliding with another

Written by Mat Hopwood (http://www.drmop.com)

Note that this engine can utilise the following additional frameworks, please check the distribution rights of these frameworks if you use this engine:
- Box2dWeb (http://code.google.com/p/box2dweb/)
