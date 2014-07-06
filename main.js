"use strict";

$(function()
{
	// Create the app
	window.app = new TheApp();

	// Create the 2D canvas
	window.canvas2d = new Canvas2D($("#main>canvas"));

/*	function resizeCanvas()
	{
		var scale;
		if (window.innerHeight > window.innerWidth)
			scale = window.innerWidth / canvas.width();
		else
			scale = window.innerHeight / canvas.height();
		document.getElementById("canvas").style.transform = "scale(" + scale + ")";
		document.getElementById("canvas").style.webkitTransform = "scale(" + scale + ")";
	}
	$(window).resize(resizeCanvas);
	resizeCanvas();*/
	
	// Create and load the resources
	window.resources = new Resources();
	window.resources.load();
	
	// Create a scene
	var scene = new Scene();
	scene.initWorld(0, 10, true);
	window.app.addScene(scene);

	// Create background
	var bg = new Actor();
	bg.name = "background";
	bg.x = 0;
	bg.y = 0;
	bg.w = 800;
	bg.h = 600;
	bg.rotation = 0;
	bg.atlas = window.resources.backgroundAtlas;
	scene.addActor(bg);
	
	// Create floor
	var floor = new Actor();
	floor.name = "floor";
	floor.x = 400;
	floor.y = 575;
	floor.w = 800;
	floor.h = 57;
	floor.rotation = 0;
	floor.atlas = window.resources.floorAtlas;
	floor.use_transform = true;
	scene.addActor(floor);
	floor.initBody("static");
	floor.addFixture({type: "box", width: 800, height: 57});
	
	// Add some actors
	for (var t = 0; t < 20; t++)
	{
		var actor = new Actor();
		actor.name = "reel" + t;
		actor.x = Math.random() * window.canvas2d.canvas_width;
		actor.y = Math.random() * window.canvas2d.canvas_height - 100;
		actor.w = 86;
		actor.h = 89;
		actor.frame = Math.random() * 2;
		actor.frame_speed = 0.01 + Math.random() * 0.01;
		actor.atlas = window.resources.reelAtlas;
		scene.addActor(actor);
		actor.initBody("dynamic");
		actor.addFixture({type: "box", width: 86, height: 89, restitution: 0.2, friction: 1.0, density: 1.0});
	}
	
	// Start main loop
	window.app.start();
	
})