"use strict";

function SheepGame()
{
	this.loadResources = function()
	{
		this.reel_image = new Image();
		this.reel_image.src = "images/sheep.png";
		this.reel_atlas = new ImageAtlas();
		this.reel_atlas.width = 86;
		this.reel_atlas.height = 89;
		this.reel_atlas.image = this.reel_image;
		this.reel_atlas.addFrame(0,0,86,89);
		this.reel_atlas.addFrame(86,0,86,89);

		this.background_image = new Image();
		this.background_image.src = "images/background.jpg";

		this.floor_image = new Image();
		this.floor_image.src = "images/hbar.png";
	}

	this.initGame = function()
	{
		window.app.clear_canvas = true;
		var cw = window.canvas2d.canvas_width;
		var ch = window.canvas2d.canvas_height;
		
		// Load resources
		this.loadResources();
	
		// Create a scene
		var scene = new Scene();
		scene.name = "main_scene";
		scene.initWorld(0, 40, true);
		window.app.addScene(scene);
		window.app.focus_scene = scene;

		// Create background
		var bg = new Actor();
		bg.name = "background";
		bg.x = 0;
		bg.y = 0;
		bg.w = 800;
		bg.h = 600;
		bg.rotation = 0;
		bg.image = this.background_image;
		bg.touchable = false;
		scene.addActor(bg);
		
		// Create floor
		var floor = new Actor();
		floor.name = "floor";
		floor.w = 800;
		floor.h = 57;
		floor.x = cw / 2;
		floor.y = ch - 30;
		floor.rotation = 0;
		floor.image = this.floor_image;
		floor.use_transform = true;
		floor.touchable = false;
		scene.addActor(floor);
		floor.initBody("static");
		floor.addFixture({type: "box", width: floor.w, height: floor.h});
		
		// Create sides
	/*	var left_side = new Actor();
		left_side.name = "left_side";
		left_side.w = 800;
		left_side.h = 57;
		left_side.x = 0;
		left_side.y = ch / 2;
		left_side.rotation = Math.PI / 2;
		left_side.image = this.floor_image;
		left_side.use_transform = true;
		left_side.touchable = false;
		scene.addActor(left_side);
		left_side.initBody("static");
		left_side.addFixture({type: "box", width: left_side.w, height: left_side.h});
		var right_side = new Actor();
		right_side.name = "right_side";
		right_side.w = 800;
		right_side.h = 57;
		right_side.x = cw;
		right_side.y = ch / 2;
		right_side.rotation = Math.PI / 2;
		right_side.image = this.floor_image;
		right_side.use_transform = true;
		right_side.touchable = false;
		scene.addActor(right_side);
		right_side.initBody("static");
		right_side.addFixture({type: "box", width: right_side.w, height: right_side.h});*/
		
		// Add some actors
		for (var t = 0; t < 20; t++)
		{
			var actor = new SheepActor();
			actor.name = "reel" + t;
			actor.touchable = true;
			actor.x = Math.random() * window.canvas2d.canvas_width;
			actor.y = Math.random() * window.canvas2d.canvas_height - 100;
			actor.w = 86;
			actor.h = 89;
			actor.frame = Math.random() * 2;
			actor.frame_speed = 0.01 + Math.random() * 0.01;
			actor.atlas = this.reel_atlas;
			scene.addActor(actor);
			actor.initBody("dynamic");
			floor.touchable = true;
			actor.addFixture({type: "box", width: 86, height: 89, restitution: 0.2, friction: 1.0, density: 1.0});
		}
	}
	
	this.releaseGame = function()
	{
		window.app.removeScene(window.app.focus_scene);
		window.app.focus_scene = null;
	}
}

