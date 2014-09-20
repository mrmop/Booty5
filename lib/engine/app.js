/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// TheApp is the main app controller and is responsible for general housekeeping and Scene processing, ThEApp ahs the following features:
// - Manages a collection of Scenes
// - Handles touch input
// - Finds which Actor was touched
// - Main loop processing
//
function TheApp(canvas)
{
    // Private variables
	this.touched = false;
	this.touch_pos = {x:0, y:0};
	this.touch_drag_x = 0;
	this.touch_drag_y = 0;
	
	// Public variables
	this.scenes = [];
    this.removals = [];             // Array of scenes that were deleted last frame
	this.canvas = canvas;			// The HTML5 canvas
	this.touch_supported = false;	//'ontouchstart' in window;
	this.allow_touchables = true;	// if true then app will search to find Actor that was touched
	this.target_frame_rate = 60;	// Frame rate at which to update the game
	this.focus_scene = null;		// Scene that has current input focus
	this.clear_canvas = false;		// If true then canvas will be cleared each frame
	this.touch_focus = null;		// The Actor that has the current touch focus
	this.debug = false;				// Can be used to enable / disable debug trace info
	this.timer = null;				// Main loop timer
    this.timelines = new TimelineManager();	// Global animation timeline manager
	
	// Resources
	this.bitmaps = [];				// Bitmap resources
	this.brushes = [];				// Brush resources
	this.shapes = [];				// Shape resources
	this.materials = [];			// Material resources
	this.geoms = [];				// Geometry resources
	this.sounds = [];				// Audio resources
	
	// Create the 2D canvas
	this.display = new Display(this.canvas);

	// Set up touch / mouse event handlers
	if (this.touch_supported)
	{
		canvas.addEventListener("touchstart", this.onTouchStart, false);
		canvas.addEventListener("touchmove", this.onTouchMove, false);
		canvas.addEventListener("touchend", this.onTouchEnd, false);
	}
	else
	{
		canvas.addEventListener("mousedown", this.onTouchStart, false);
		canvas.addEventListener("mousemove", this.onTouchMove, false);
		canvas.addEventListener("mouseup", this.onTouchEnd, false);
		canvas.addEventListener("mouseout", this.onTouchEnd, false);
	}
	
}

TheApp.version = 1.2;

//
// Touch handling
//
TheApp.prototype.onTouchStart = function(e)
{
	var app = window.app;
	if (app.touch_supported)
	{
		e.stopPropagation();
		e.preventDefault();
	}
	var display = app.display;
	app.touched = true;
	if (app.touch_supported)
		app.touch_pos = display.getCanvasPoint(e.touches[0].pageX, e.touches[0].pageY);
	else
		app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);
	app.touch_pos.x -= display.canvas_width / 2;
	app.touch_pos.y -= display.canvas_height / 2;
	if (app.focus_scene != null)
		app.focus_scene.onBeginTouchBase(app.touch_pos);
	if (app.allow_touchables)
	{
		var actor = app.findHitActor(app.touch_pos);
		if (actor != null)
		{
//console.log(actor);
			app.touch_focus = actor;
			actor.onBeginTouchBase(app.touch_pos);
		}
	}
};
TheApp.prototype.onTouchEnd = function(e)
{
	var app = window.app;
	if (app.touch_supported)
	{
		e.stopPropagation();
		e.preventDefault();
	}
	var display = app.display;
	app.touched = false;
	if (app.touch_supported)
		app.touch_pos = display.getCanvasPoint(e.touches[0].pageX, e.touches[0].pageY);
	else
		app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);
	app.touch_pos.x -= display.canvas_width / 2;
	app.touch_pos.y -= display.canvas_height / 2;
	if (app.focus_scene != null)
		app.focus_scene.onEndTouchBase(app.touch_pos);
	if (app.allow_touchables)
	{
		var actor = app.findHitActor(app.touch_pos);
		if (actor != null)
			actor.onEndTouchBase(app.touch_pos);
		if (app.touch_focus != null)
		{
			if (app.touch_focus.onLostTouchFocus != undefined)
				app.touch_focus.onLostTouchFocus(app.touch_pos);
			app.touch_focus = null;
		}
	}
};
TheApp.prototype.onTouchMove = function(e)
{
	var app = window.app;
	if (app.touch_supported)
	{
		e.stopPropagation();
		e.preventDefault();
	}
	var old_x = app.touch_pos.x;
	var old_y = app.touch_pos.y;
	var display = app.display;
	if (app.touch_supported)
		app.touch_pos = display.getCanvasPoint(e.touches[0].pageX, e.touches[0].pageY);
	else
		app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);
	app.touch_pos.x -= display.canvas_width / 2;
	app.touch_pos.y -= display.canvas_height / 2;
	app.touch_drag_x = old_x - app.touch_pos.x;
	app.touch_drag_y = old_y - app.touch_pos.y;

	if (app.focus_scene != null)
		app.focus_scene.onMoveTouchBase(app.touch_pos);
	if (app.allow_touchables)
	{
		var actor = app.findHitActor(app.touch_pos);
		if (actor != null)
			actor.onMoveTouchBase(app.touch_pos);
	}
};
	
//
// Scene management
//
TheApp.prototype.addScene = function(scene)
{
	this.scenes.push(scene);
	scene.app = this;
};

TheApp.prototype.removeScene = function(scene, destroy)
{
    this.removals.push(scene);
};

TheApp.prototype.cleanupDestroyedScenes = function()
{
    var dcount = this.removals.length;
    if (dcount > 0)
    {
        var removals = this.removals;
        var scenes = this.scenes;
        var count = scenes.length;
        for (var s = 0; s < dcount; s++)
        {
            var dscene = removals[s];
            for (var t = 0; t < count; t++)
            {
                if (dscene == scenes[s])
                {
                    dscene.release();
                    scenes.splice(t, 1);
                    count--;
                    break;
                }
            }
        }
    }
    this.removals = [];
};

TheApp.prototype.findScene = function(name)
{
	var scenes = this.scemes;
	var count = scenes.length;
	for (var t = 0; t < count; t++)
	{
		if (scenes[t].name == name)
			return scenes[t];
	}
	return null;
};

//
// Resource management
//
TheApp.prototype.addResource = function(resource, type)
{
	var res;
	if (type == "brush")
		res = this.brushes;
	else if (type == "sound")
		res = this.sounds;
	else if (type == "shape")
		res = this.shapes;
	else if (type == "material")
		res = this.materials;
	else if (type == "bitmap")
		res = this.bitmaps;
	else if (type == "geometry")
		res = this.geoms;
	else
		return;
	res.push(resource);
};

TheApp.prototype.findResource = function(name, type)
{
	var res;
	if (type == "brush")
		res = this.brushes;
	else if (type == "sound")
		res = this.sounds;
	else if (type == "shape")
		res = this.shapes;
	else if (type == "material")
		res = this.materials;
	else if (type == "bitmap")
		res = this.bitmaps;
	else if (type == "geometry")
		res = this.geoms;
	else
		return null;
	
	var count = res.length;
	for (var t = 0; t < count; t++)
	{
		if (res[t].name == name)
			return res[t];
	}
	console.log("resource '" + name + "' (" + type + ") not found");
	
	return null;
};

//
// Rendering
//
TheApp.prototype.draw = function()
{
	var scenes = this.scenes;
	var count = scenes.length;
	for (var t = 0; t < count; t++)
		scenes[t].draw();
};

//
// Update
//
TheApp.prototype.update = function(dt)
{
	var app = window.app;
	var scenes = this.scenes;
	var count = scenes.length;
    app.timelines.update(dt);
	for (var t = 0; t < count; t++)
		scenes[t].update(dt);
    this.cleanupDestroyedScenes();
};

TheApp.prototype.mainLoop = function()
{
	if (app.clear_canvas)
		app.display.clear(true);
	app.update(1 / app.target_frame_rate);
	app.draw();
};

TheApp.prototype.start = function()
{
	this.timer = setInterval(this.mainLoop, 1000 / this.target_frame_rate);
};

//
// Utility
//
TheApp.prototype.findHitActor = function(position)
{
	if (this.focus_scene != null)
		return this.focus_scene.findHitActor(position);
	return null;
};
