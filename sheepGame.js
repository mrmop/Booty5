"use strict";

function SheepGame(app)
{
	this.app = app;
	
	this.loadResources = function(scene)
	{
		var sheep_bitmap = new Bitmap("sheep", "images/sheep.png", true);
		scene.addResource(sheep_bitmap, "bitmap");
		
		var sheep_atlas = new ImageAtlas("sheep", sheep_bitmap);
		sheep_atlas.addFrame(0,0,86,89);
		sheep_atlas.addFrame(86,0,86,89);
		scene.addResource(sheep_atlas, "brush");

		var background_bitmap = new Bitmap("background", "images/background.jpg", true);
		scene.addResource(background_bitmap, "bitmap");

		var floor_bitmap = new Bitmap("floor", "images/hbar.png", true);
		scene.addResource(floor_bitmap, "bitmap");
	}

	this.initGame = function()
	{
		var app = this.app;
		app.clear_canvas = true;
		var cw = app.canvas_width;
		var ch = app.canvas_height;
		// Create a scene
		var scene = new SheepScene();
		scene.name = "main_scene";
		scene.initWorld(0, 40, true);
		app.addScene(scene);
		app.focus_scene = scene;	// Set as focus scene (scene that receives input

		// Enable scene touch panning
		scene.touch_pan_x = true;
		scene.touch_pan_y = true;
		scene.extents = [-2048,-2048,4096,4096];
		
		// Add clipper to scene
/*		var clipper = new Shape();
		clipper.type = Shape.TypeCircle;
		clipper.width = 300;
		scene.clip_shape = clipper;*/

		// Add a scene update (onTick) handler
		scene.onTick = function(dt) {
//			this.x++;
		};

		// Add touch handlers to a scene
		scene.onBeginTouch = function(touch_pos) {
			console.log("Scene touch begin");
		};
		scene.onEndTouch = function(touch_pos) {
			console.log("Scene touch end");
		};
		scene.onMoveTouch = function(touch_pos) {
//			console.log("Scene touch move");
		};
		
		// Load resources
		this.loadResources(scene);
	
		// Create background
		var bg = new Actor();
		bg.name = "background";
		bg.x = 0;
		bg.y = 0;
		bg.w = 800;
		bg.h = 600;
		bg.rotation = 0;
		bg.bitmap = scene.findResource("background", "bitmap");
		bg.touchable = false;
		bg.ignore_camera = true;
		scene.addActor(bg);
		
		// Create floor
		var floor = new Actor();
		floor.name = "floor";
		floor.w = 800;
		floor.h = 57;
		floor.x = 0;
		floor.y = (ch - 30) / 2;
		floor.rotation = 0;
		floor.bitmap = scene.findResource("floor", "bitmap");;
		floor.use_transform = true;
		floor.touchable = false;
		scene.addActor(floor);
		floor.initBody("static");
		floor.addFixture({type: Shape.TypeBox, width: floor.w, height: floor.h});
		
		// Create sides
		var left_side = new Actor();
		left_side.name = "left_side";
		left_side.w = 800;
		left_side.h = 57;
		left_side.x = -cw / 2;
		left_side.y = 0;
		left_side.rotation = Math.PI / 2;
		left_side.bitmap = floor.bitmap;
		left_side.use_transform = true;
		left_side.touchable = false;
		scene.addActor(left_side);
		left_side.initBody("static");
		left_side.addFixture({type: Shape.TypeBox, width: left_side.w, height: left_side.h});
		var right_side = new Actor();
		right_side.name = "right_side";
		right_side.w = 800;
		right_side.h = 57;
		right_side.x = cw / 2;
		right_side.y = 0;
		right_side.rotation = Math.PI / 2;
		right_side.bitmap = floor.bitmap;
		right_side.use_transform = true;
		right_side.touchable = false;
		scene.addActor(right_side);
		right_side.initBody("static");
		right_side.addFixture({type: Shape.TypeBox, width: right_side.w, height: right_side.h});
		
		// Add some actors
		var depth = 1;
		for (var t = 0; t < 20; t++)
		{
			var actor = new SheepActor();
			actor.name = "sheep" + t;
			actor.touchable = true;
			actor.x = Math.random() * cw - cw / 2;
			actor.y = Math.random() * ch - ch / 2 - 100;
			actor.w = 86;
			actor.h = 89;
			actor.frame = Math.random() * 2;
			actor.frame_speed = 0.5 + Math.random() * 0.5;
			actor.atlas = scene.findResource("sheep", "brush");
			scene.addActor(actor);
			actor.initBody("dynamic");
			actor.depth = depth;
			actor.addFixture({type: Shape.TypeBox, width: 86, height: 89, restitution: 0.2, friction: 1.0, density: 1.0});
//			depth += 0.1;
		}
		
		depth = 0.1;
		for (var t = 0; t < 20; t++)
		{
			var actor = new LabelActor();
			actor.name = "text" + t;
			actor.touchable = false;
			actor.x = Math.random() * cw - cw / 2;
			actor.y = Math.random() * ch - ch / 2 - 100;
			actor.w = 86;
			actor.h = 89;
			actor.text = "Hello World";
			scene.addActor(actor);
			actor.depth = depth;
			depth += 0.1;
		}
		
		var actor = new SheepActor();
		actor.name = "reel1";
		actor.touchable = true;
		actor.x = 0;
		actor.y = 0;
		actor.w = 186;
		actor.h = 189;
		actor.frame = Math.random() * 2;
		actor.frame_speed = 0.5 + Math.random() * 1.0;
		actor.atlas = scene.findResource("sheep", "brush");
		actor.vr = 0;
//		actor.vx = 500;
//		actor.vy = 300;
//		actor.dock_x = 0;
//		actor.dock_y = 1;
		actor.wrap_position = true;
		scene.addActor(actor);
		
		var actor2 = new SheepActor();
		actor2.name = "reel2";
		actor2.touchable = false;
		actor2.x = 100;
		actor2.y = 0;
		actor2.w = 86;
		actor2.h = 89;
		actor2.frame = Math.random() * 2;
		actor2.frame_speed = 0.5 + Math.random() * 1.0;
		actor2.atlas = scene.findResource("sheep", "brush");
		actor2.vr = -0.2;
		actor.addActor(actor2);
		
		var actor3 = new SheepActor();
		actor3.name = "reel3";
		actor3.touchable = false;
		actor3.x = 90;
		actor3.y = 0;
		actor3.w = 86;
		actor3.h = 89;
		actor3.frame = Math.random() * 2;
		actor3.frame_speed = 0.5 + Math.random() * 1.0;
		actor3.atlas = scene.findResource("sheep", "brush");
		actor3.vr = 2;
		actor2.addActor(actor3);
		
		var particles = new ParticleActor();
		actor3.addActor(particles);
		particles.generatePlume(20, ArcActor, 3, 40, 10, 0.25, 1, {
			fill_style: "#ffff00",
			radius: 20,
			vsx: 0.6,
			vsy: 0.6,
			y: -50,
			orphaned: false
		});
		
		var actor4 = new ArcActor();
		actor4.name = "arc1";
		actor4.touchable = true;
		actor4.x = 100;
		actor4.y = 0;
		actor4.stroke_style = "#ff00ff";
		actor4.fill_style = "#00ffff";
		actor4.start_angle = 0;
		actor4.end_angle = 2 * Math.PI * 0.75;
		actor4.radius = 50;
		actor4.filled = true;
//		actor4.ox = 2;
//		actor4.oy = 89 / 2;
		actor4.w = 86;
		actor4.h = 89;
		actor4.vr = 2;
		scene.addActor(actor4);
		
		var actor5 = new RectActor();
		actor5.name = "rect1";
		actor5.touchable = true;
		actor5.x = 0;
		actor5.y = 0;
		actor5.stroke_style = "#ff00ff";
		actor5.fill_style = "#40ff4f";
		actor5.filled = true;
//		actor5.ox = 2;
//		actor5.oy = 89 / 2;
		actor5.w = 86;
		actor5.h = 89;
		actor5.vr = 2;
		scene.addActor(actor5);
		
		var geom = new Shape("geom1");
		geom.vertices = [0, -50, 50, 50, -50, 50];
		
		var actor6 = new PolygonActor();
		actor6.name = "polygon1";
		actor6.touchable = true;
		actor6.x = 0;
		actor6.y = 0;
		actor6.points = geom.vertices;
		actor6.stroke_style = "#ffff0f";
		actor6.fill_style = "#804fff";
		actor6.filled = true;
//		actor6.ox = 2;
//		actor6.oy = 89 / 2;
		actor6.w = 86;
		actor6.h = 89;
//		actor6.vx = 100;
		actor6.vr = 2;
		scene.addActor(actor6);
		
		var timeline = new Timeline();
		timeline.add(actor6, "x", [0,100,200], [0, 1, 2], 0, [Ease.quadin, Ease.quadout]);
		timeline.add(actor6, "y", [0,100,200], [0, 1, 2], 0, [Ease.quadin, Ease.quadout]);
		scene.timelines.add(timeline);
		
		var canvas_actor = new Actor(true);
		canvas_actor.w = 200;
		canvas_actor.h = 200;
		canvas_actor.x = 100;
		canvas_actor.y = 100;
		canvas_actor.bitmap = scene.findResource("floor", "bitmap");;
		canvas_actor.touchable = true;
		canvas_actor.clip_children = true;
		canvas_actor.scroll_range = [-100,-100,200,200];
		scene.addActor(canvas_actor);
		
		var child_actor = new Actor();
		child_actor.w = 50;
		child_actor.h = 50;
		child_actor.bitmap = scene.findResource("floor", "bitmap");;
		canvas_actor.addActor(child_actor);
		
//		scene.target_x = actor6;
//		scene.target_y = actor6;

		// Create a smoke plume particles actor
		var smoke_particles = new ParticleActor();
//		smoke_particles.gravity = 40;
		app.focus_scene.addActor(smoke_particles);
		smoke_particles.generatePlume(20, ArcActor, 3, 40, 10, 0.25, 1, {
			fill_style: "#e0e0e0",
			radius: 20,
			vsx: 0.6,
			vsy: 0.6,
			orphaned: true
		});

		// Create a explosion particles actor
		var exp_particles = new ParticleActor();
		app.focus_scene.addActor(exp_particles);
		exp_particles.generateExplosion(50, ArcActor, 2, 50, 10, 1, 0.999, {
			fill_style: "#ffff00",
			x : -200,
			radius: 30
		});

		// Create a rain particles actor
		var rain_particles = new ParticleActor();
		app.focus_scene.addActor(rain_particles);
		rain_particles.generateRain(50, ArcActor, 4, 200, 10, 0.3, 1.0, 1000, {
			fill_style: "#8080ff",
			radius: 10,
			y: -500,
			vx: 0,
			ignore_camera: true
		});
		
		// Create a timeline animation
		var timeline = new Timeline();
		var anim = timeline.add(smoke_particles, "x", [0, 100, 300, 400], [0, 2, 4, 6], 2, [Ease.sin, Ease.sin, Ease.sin]);
		anim.setAction(0,function() { console.log("Hit start of frame 0"); });
		anim.setAction(1,function() { console.log("Hit start of frame 1"); });
		anim.setAction(2,function() { console.log("Hit start of frame 2"); });
		anim.onEnd = function() { console.log("Animation ended"); };
		anim.onRepeat = function() { console.log("Animation repeated"); };
		anim.setTime(-5);	// Delay start by two seconds
		scene.timelines.add(timeline);

		
	}
	
	this.releaseGame = function()
	{
		this.app.removeScene(this.app.focus_scene);
		this.app.focus_scene = null;
	}
}

