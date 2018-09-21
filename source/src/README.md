<img src="http://booty5.com/wp-content/uploads/2014/10/booty5_logo_large.jpg" alt="Booty5 HTML5 Game Maker API Documentation" />
<h1>Booty5 HTML5 Game Maker API Documentation</h1>

Booty5 is a free <a href="https://github.com/mrmop/Booty5" title="Booty5 HTML5 Game Engine">open source HTML5 game engine</a> written using JavaScript. A full game editor / game maker / Flash style animation editor is also available from the <a href="http://booty5.com/" title="Booty5 HTML5 Game Maker">Booty5 website</a>.

Booty5’s current set of features include:

- Free and open source
- Its tiny and fast, under 120k! (under 90k without pre-defined action)
- Support for mobile and desktop
- Global and local resource management
- Scene and Actor (sprite game object) management
- Particle systems
- Tiled and collision maps
- Animation via Timeline and tweening
- Tasks and user events
- Support for action lists
- Image, text and geometric shape rendering, including rounded rects
- Physics using Box2D via Box2DWeb including multiple fixtures, joints, materials and shapes
- Sprite atlas and frame based bitmap animation
- Game object docking to scene edges and other game objects
- Scene and game object clipping, including to circular and polygon shapes
- Scene and game object touch detection
- Scene cameras and touch panning
- Scene and actor local layering
- Image and gradient brushes, shadows, composite operations
- 3D sprite depth
- Touch event handlers
- Keyboard support
- 2D canvas
- Audio play back
- Support for automatic scaling / resizing to fit different sized gaming displays
- Support for cached rendering to speed up shape / gradient / font rendering etc..
- Support for Booty5 game Editor / IDE
- Support for Facebook Instant Games
- Support for Dragon Bones animation system

To get a rough idea of what the Booty5 game engine can do, take a look at the many different <a href="http://booty5.com/html5-game-engine/booty5-html5-game-engine-tutorials/" title="Booty5 HTML5 Game Maker Demos">HTML5 examples</a> that have been created with Booty5.

You can download the free ebook, <a href="http://booty5.com/booty5-free-html-game-maker-e-book-manual/">The Booty5 HTML5 Game Maker Manual</a> to help get you started quickly. 

You can also view the book in HTML format in the <a href="http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/" title="Booty5 HTML5 Game Engine Introduction">Booty5 HTML5 Game Engine Introduction</a>
and the <a href="http://booty5.com/html5-game-editor/booty5-html5-game-editor-introduction/" title="Booty5 HTML5 Game Editor Introduction">Booty5 HTML5 Game Editor Introduction</a> sections.

<h2>Adding Booty5 to a Project</h2>

To add Booty5 to your project simply add the following line to the head section of your HTML file, e.g:

	<script src="booty5_min.js"></script>

If you would also like to the use Box2D physics features of Booty5 then you should also include Box2D web, e.g:

	<script src="Box2dWeb-2.1.a.3.min.js"></script><script src="booty5_1_3_min.js"></script>

<h2>Using Booty5</h2>

Setting up Booty5 is very simple, a small Hello World style example can be viewed <a href="http://booty5.com/html5-examples/hello-world/index.html" title="Simple HTML5 Hello World Example">here</a>. Lets take a quick look at the source in main.js:

	window.onload = function()
	{
		// Create the app
		var app = new b5.App(document.getElementById('gamecanvas'), true);
		app.debug = false;
		app.clear_canvas = true;
	 
		// Tell Booty5 to scale canvas to best fit window
		app.setCanvasScalingMethod(b5.App.FitBest);
	 
		// Create a scene
		var scene = new b5.Scene();
		// Add scene to the app
		app.addScene(scene);
	 
		// Create an arc actor
		var actor = new b5.ArcActor();
		actor.fill_style = "rgb(80,80,255)";
		actor.x = 100;
		actor.y = 100;
		actor.vx = 100;
		actor.radius = 100;
		// Add the actor to the scene
		scene.addActor(actor);
	 
		// Attach an OnTick handler which gets called each frame
		actor.onTick = function(dt) {
			if (this.x &gt; 200) this.x = -200;
			this.y = Math.sin(this.frame_count / 20) * 100 + 100;
		}
	 
		// Create a bitmap
		var bitmap = new b5.Bitmap("crate", "crate.png", true);
	 
		// Create an image based actor
		var actor = new Actor();
		actor.x = 200;
		actor.y = 100;
		actor.w = 100;
		actor.h = 100;
		actor.vr = 10;
		actor.bitmap = bitmap;
		// Add the actor to the scene
		scene.addActor(actor);
	 
		// Start main loop
		app.start();
	};

The first and most important part of using Booty5 is setting up the App within the window.onload() function. The App is the main app controller that manages game scenes:


	// Create the app
	var app = new b5.App(document.getElementById('gamecanvas'), true);
	app.debug = false;
	app.clear_canvas = true;

	In the section of code we create the app, passing in the canvas element that will be used to render the game. Note that some internal parts of the engine will write debug output to the console, by setting debug to false we will prevent this from being written. We tell the app to clear the canvas each frame, you can set this to false if your game covers the entire area of the canvas to save a bit of time.


	// Tell Booty5 to scale canvas to best fit window
	app.setCanvasScalingMethod(b5.App.FitBest);

In the above section of code we tell Booty5 to scale the canvas so that it best fits the browser window, this will scale the canvas to fit either the entire height or width of the window.

Next we create a Scene that can host our game objects then add that to the app for processing. Note that until you add the scene to the app no processing of any actors within the scene will take place. You can think of a scene as a view into the canvas:

	// Create a scene
	var scene = new b5.Scene();
	// Add scene to the app
	app.addScene(scene);

Next we create an arc actor (an ArcActor can draw circles) then add it to the scene for processing. Note that until you add the actor to the scene it will not be processed or rendered:

	// Create an arc actor
	var actor = new b5.ArcActor();
	actor.fill_style = "rgb(80,80,255)";
	actor.x = 100;
	actor.y = 100;
	actor.vx = 100;
	actor.radius = 100;
	// Add the actor to the scene
	scene.addActor(actor);
 
	// Attach an OnTick handler which gets called each frame
	actor.onTick = function(dt) {
		if (this.x &gt; 200) this.x = -200;
		this.y = Math.sin(this.frame_count / 20) * 100 + 100;
	}

In the above code we also attach an onTick event handler, all Actors and Scenes support the OnTick event which is called each time it is updated (every frame). This is the code that makes the circle wrap around and bounce.

Next we create a Bitmap object:

	// Create a bitmap
	var bitmap = new b5.Bitmap("crate", "crate.png", true);

Then we create an image based Actor to render the bitmap:

	// Create an image based actor
	var actor = new b5.Actor();
	actor.x = 200;
	actor.y = 100;
	actor.w = 100;
	actor.h = 100;
	actor.vr = 10;
	actor.bitmap = bitmap;
	// Add the actor to the scene
	scene.addActor(actor);

Finally we start the apps main loop going with:


	// Start main loop
	app.start();

<h2>Booty5 2D Game Editor</h2>
	
The easier way by far of using Booty5 is to use it conjunction with the 2D Game Editor. The Editor is a game iDE and Flash style animation editor that enables you to create games visually and includes script editing capabilities for creating more powerful games. The editor exports JSON that can be loaded by the engines XOML loader (xoml.js). You can include this JSON either directly or load it asynchronously.
