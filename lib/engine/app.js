/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// TheApp is the main application controller and is responsible for general housekeeping and Scene processing, You should
// create a single instance of TheApp object and assign it to window.app. Scenes should then be created to hold your
// content then added to this instance of the app. TheApp has the following features:
// - Manages global resources
// - Manages a collection of Scenes
// - Handles touch input
// - Finds which Actor was touched
// - Main loop processing
// - Manages global animation timelines
// - Manages screen scaling
// - Manages the main loop
//
function TheApp(canvas)
{
    // Internal variables
    this.removals = [];             // Array of scenes that were deleted last frame
    this.touched = false;           // true if the screen is being touched, false otherwise
    this.touch_pos = {x:0, y:0};    // Position of last screen touch
    this.touch_drag_x = 0;          // Amount touch position was last dragged on x axis
    this.touch_drag_y = 0;          // Amount touch position was last dragged on y axis
//    this.timer = null;				// Main loop timer
    this.last_time = Date.now();    // Time of last frame in ms
    this.dt = 0;                    // Last frame time delta
    this.avg_time = 0;              // Total time since last measure
    this.avg_fps = 60;              // Average frames per second of app
    this.avg_frame = 0;             // Counter used to measure average frame rate
    this.canvas_scale = 1;                      // Canvas to client scaling
    this.canvas_cx = this.canvas_width / 2;     // Canvas x axis centre on display
    this.canvas_cy = this.canvas_height / 2;    // Canvas y axis centre on display
    this.order_changed = true;      // Set to true when scenes change order

    // Public variables
    this.scenes = [];               // An array of Scenes
    this.canvas = canvas;			// The HTML5 canvas
    this.pixel_ratio = 1;                       // Device pixel ratio
    this.canvas_width = canvas.width;           // The width of the virtual canvas
    this.canvas_height = canvas.height;         // The height of the virtual canvas
    this.display_width = canvas.width;          // The width of the display
    this.display_height = canvas.height;        // The height of the display
    this.canvas_scale_method = TheApp.FitNone;  // Virtual canvas scaling method
    this.touch_supported = this.isTouchSupported();
    this.allow_touchables = true;	// if true then app will search to find Actor that was touched
    this.target_frame_rate = 60;	// Frame rate at which to update the game
    this.adaptive_physics = false;  // When true physics update will be ran more than once if frame rate falls below target
    this.focus_scene = null;		// Scene that has current input focus
    this.focus_scene2 = null;		// Scene that has will receive touch events if focus scene does not process them
    this.clear_canvas = false;		// If true then canvas will be cleared each frame
    this.touch_focus = null;		// The Actor that has the current touch focus
    this.debug = false;				// Can be used to enable / disable debug trace info
    this.use_marm = false;          // Set true if deploying using the Marmalade SDK
    this.timelines = new TimelineManager();	    // Global animation timeline manager
    this.box2d = typeof Box2D != "undefined";   // True if Box2D module is present

    // Resources
    this.bitmaps = [];				// Bitmap resources
    this.brushes = [];				// Brush resources
    this.shapes = [];				// Shape resources
    this.materials = [];			// Material resources
    this.sounds = [];				// Audio resources

    if (window.devicePixelRatio !== undefined)
        this.pixel_ratio = window.devicePixelRatio;

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
    window.addEventListener("keypress", this.onKeyPress, false);
    window.addEventListener("keydown", this.onKeyDown, false);
    window.addEventListener("keyup", this.onKeyUp, false);

    this.resize = function(event)
    {
        window.app.setCanvasScalingMethod();
    };
    this.orientationChange = function(event)
    {
//        window.app.setCanvasScalingMethod();
    };
    window.addEventListener("resize", this.resize);
//    window.addEventListener("orientationchange", this.orientationChange);
}

TheApp.version = 1.41;

// Virtual canvas scaling methods
TheApp.FitNone = 0; // No scaling or resizing
TheApp.FitX = 1;    // Scale virtual canvas to fit x-axis
TheApp.FitY = 2;    // Scale virtual canvas to fit y-axis
TheApp.FitBest = 3; // Scale virtual canvas to fit best (ensure that no display is lost)
TheApp.FitSize = 4; // No scaling, however HTML canvas is resized to fit the entire display

//
// Keyboard handling
//
TheApp.prototype.onKeyPress = function(e)
{
    var app = window.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyPressBase(e);
};
TheApp.prototype.onKeyDown = function(e)
{
    var app = window.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyDownBase(e);
};
TheApp.prototype.onKeyUp = function(e)
{
    var app = window.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyUpBase(e);
};

//
// Touch handling
//
TheApp.prototype.isTouchSupported = function()
{
    var msTouchEnabled = window.navigator.msMaxTouchPoints;
//    var generalTouchEnabled = "ontouchstart" in document.createElement("div");
    var generalTouchEnabled = "ontouchstart" in this.canvas;

    if (msTouchEnabled || generalTouchEnabled)
        return true;
    return false;
};

TheApp.prototype.onTouchStart = function(e)
{
    var app = window.app;
    if (app.touch_supported)
    {
        e.stopPropagation();
        e.preventDefault();
    }

    // Get touch pos
    var focus1 = app.focus_scene;
    var focus2 = app.focus_scene2;
    var display = app.display;
    app.touched = true;
    if (app.touch_supported)
        app.touch_pos = display.getCanvasPoint(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    else
        app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);

    // Handle scene touch
    if (focus1 != null)
        focus1.onBeginTouchBase(app.touch_pos);
    if (focus2 != null)
        focus2.onBeginTouchBase(app.touch_pos);

    // Handle actor touch
    if (app.allow_touchables)
    {
        var actor = app.findHitActor(app.touch_pos);
        if (actor != null)
        {
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

    // Get touch pos
    var focus1 = app.focus_scene;
    var focus2 = app.focus_scene2;
    var display = app.display;
    app.touched = false;
    if (app.touch_supported)
        app.touch_pos = display.getCanvasPoint(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    else
        app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);

    // Handle scene touch
    if (focus1 != null)
        focus1.onEndTouchBase(app.touch_pos);
    if (focus2 != null)
        focus2.onEndTouchBase(app.touch_pos);

    // Handle actor touch
    if (app.allow_touchables)
    {
        var actor = app.findHitActor(app.touch_pos);
        if (actor != null)
            actor.onEndTouchBase(app.touch_pos);
        if (app.touch_focus != null)
        {
            if (app.touch_focus.onLostTouchFocus !== undefined)
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
    // Get touch pos and drag
    var focus1 = app.focus_scene;
    var focus2 = app.focus_scene2;
    var old_x = app.touch_pos.x;
    var old_y = app.touch_pos.y;
    var display = app.display;
    if (app.touch_supported)
        app.touch_pos = display.getCanvasPoint(e.changedTouches[0].pageX, e.changedTouches[0].pageY);
    else
        app.touch_pos = display.getCanvasPoint(e.pageX, e.pageY);
    app.touch_drag_x = old_x - app.touch_pos.x;
    app.touch_drag_y = old_y - app.touch_pos.y;

    // Handle scene touch
    if (focus1 != null)
        focus1.onMoveTouchBase(app.touch_pos);
    if (focus2 != null)
        focus2.onMoveTouchBase(app.touch_pos);

    // Handle actor touch (could be performance hog)
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
    return scene;
};

TheApp.prototype.removeScene = function(scene)
{
    if (this.focus_scene == scene)
        this.focus_scene = null;
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
                if (dscene == scenes[t])
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
    var scenes = this.scenes;
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
TheApp.prototype.getResFromType = function(type)
{
    if (type == "brush")
        return this.brushes;
    else if (type == "sound")
        return this.sounds;
    else if (type == "shape")
        return this.shapes;
    else if (type == "material")
        return this.materials;
    else if (type == "bitmap")
        return this.bitmaps;
    return null;
};

TheApp.prototype.addResource = function(resource, type)
{
    var res = this.getResFromType(type);
    if (res != null)
    {
        res.push(resource);
        res.parent = this;
    }
};

TheApp.prototype.removeResource = function(resource, type)
{
    var res = this.getResFromType(type);
    if (res != null)
    {
        var count = res.length;
        for (var t = 0; t < count; t++)
        {
            if (res[t].name == name)
            {
                res.splice(t, 1);
                return;
            }
        }
    }
};

TheApp.prototype.findResource = function(name, type)
{
    var res = this.getResFromType(type);
    if (res == null)
        return null;

    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].name == name)
            return res[t];
    }
    if (this.debug)
        console.log("resource '" + name + "' (" + type + ") not found");

    return null;
};

TheApp.prototype.areResourcesLoaded = function(include_scenes)
{
    var res = this.bitmaps;
    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (!res[t].loaded)
            return false;
    }

    if (include_scenes)
    {
        var scenes = this.scenes;
        count = scenes.length;
        for (t = 0; t < count; t++)
        {
            if (!scenes[t].areResourcesLoaded())
                return false;
        }
    }

    return true;
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
    app.dt = dt;
    app.timelines.update(dt);
    for (var t = 0; t < count; t++)
        scenes[t].update(dt);
    this.cleanupDestroyedScenes();

    // Re-sort scenes if layers changed
    if (this.order_changed)
    {
        this.order_changed = false;
        Utils.sortLayers(this.scenes);
    }
};

/*TheApp.prototype.mainLoop = function()
{
    if (app.clear_canvas)
        app.display.clear(true);
    app.update(1 / app.target_frame_rate);
    app.draw();
};*/

TheApp.prototype.mainLoop = function()
{
    var app = window.app;
    var now = Date.now();
    var delta = now - app.last_time;
    app.last_time = now;
    if (app.clear_canvas)
        app.display.clear(true);
    app.update(delta / 1000);
    app.draw();
    app.avg_time += delta;
    app.avg_frame++;
    if (app.avg_frame == 60)
    {
        app.avg_frame = 0;
        app.avg_fps = 60000 / app.avg_time;
        app.avg_time = 0;
    }
//    app.update(1 / app.target_frame_rate);
    requestAnimationFrame(app.mainLoop);
};

TheApp.prototype.start = function()
{
//    this.timer = setInterval(this.mainLoop, 1000 / this.target_frame_rate);
    this.mainLoop();
};

//
// Utility
//
TheApp.prototype.findHitActor = function(position)
{
    var act = null;
    if (this.focus_scene !== null)
        act = this.focus_scene.findHitActor(position);
    if (act === null && this.focus_scene2 !== null)
        act = this.focus_scene2.findHitActor(position);
    return act;
};

TheApp.prototype.dirty = function()
{
    var s = this.scenes;
    var count = s.length;
    for (var t = 0; t < count; t++)
        s[t].dirty();
};

TheApp.prototype.setCanvasScalingMethod = function(method)
{
    if (method !== undefined)
        this.canvas_scale_method = method;
    var method = this.canvas_scale_method;
    var dw = window.innerWidth;
    var dh = window.innerHeight;
    if (this.canvas_scale_method === TheApp.FitNone)
    {
    }
    else
    if (this.canvas_scale_method === TheApp.FitSize)
    {
        this.canvas_scale = 1;
        this.canvas.width = dw;
        this.canvas.height = dh;
        this.display_width = dw;
        this.display_height = dh;
        this.canvas_cx = dw / 2;
        this.canvas_cy = dh / 2;
        this.dirty();
    }
    else
    {
        this.scaleCanvasToFit = true;
        var sw = this.canvas_width;
        var sh = this.canvas_height;

        var sx = dw / sw;
        var sy = dh / sh;
        var scale = 1;
        switch (this.canvas_scale_method)
        {
            case TheApp.FitX:
                scale = sx;
                break;
            case TheApp.FitY:
                scale = sy;
                break;
            case TheApp.FitBest:
                scale = sx < sy ? sx : sy;
                break;
        }
        this.canvas_scale = scale;
        this.display_width = dw;
        this.display_height = dh;
        this.canvas.width = dw * this.pixel_ratio;
        this.canvas.height = dh * this.pixel_ratio;
//    this.canvas.style.width = this.canvas.width;
//    this.canvas.style.height = this.canvas.width;
        this.canvas_cx = dw / 2;
        this.canvas_cy = dh / 2;

        this.dirty();
    }
};

TheApp.prototype.parseAndSetFocus = function(scene_name)
{
    var app = window.app;
    new Xoml(app).parseResources(app, [window[scene_name]]);
    app.order_changed = true;
    app.focus_scene = app.findScene(scene_name);

};
