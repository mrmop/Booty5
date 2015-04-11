/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// App is the main application controller and is responsible for general housekeeping and Scene processing, You should
// create a single instance of App object and assign it to b5.app. Scenes should then be created to hold your
// content then added to this instance of the app. App has the following features:
// - Manages global resources
// - Manages a collection of Scenes
// - Handles touch input
// - Finds which Actor was touched
// - Main loop processing
// - Manages global animation Timelines via a TimelineManager
// - Controls rescaling of canvas to best fit to different display sizes
// - Tracks time
//

b5.App = function(canvas)
{
    // Internal variables
    this.removals = [];             // Array of scenes that were deleted last frame
    this.touched = false;           // true if the screen is being touched, false otherwise
    this.touch_pos = {x:0, y:0};    // Position of last screen touch
    this.touch_drag_x = 0;          // Amount touch position was last dragged on x axis
    this.touch_drag_y = 0;          // Amount touch position was last dragged on y axis
    this.timer = null;				// Logic main loop timer
    this.last_time = Date.now();    // Time of last frame in ms
    this.dt = 0;                    // Last frame time delta
    this.avg_time = 0;              // Total time since last measure
    this.avg_fps = 60;              // Average frames per second of app
    this.avg_frame = 0;             // Counter used to measure average frame rate
    this.canvas_fill_window = true; // If set to true then canvas will be scaled to fit window
    this.canvas_scale = 1;                      // Canvas to client scaling
    this.canvas_cx = this.canvas_width >> 1;    // Canvas x axis centre on display
    this.canvas_cy = this.canvas_height >> 1;   // Canvas y axis centre on display
    this.order_changed = true;      // Set to true when scenes change order
    this.total_loaded = 0;          // Total pre-loadable resources that have been loaded
    this.total_load_errors = 0;     // Total pre-loadable resource load errors

    // Public variables
    this.scenes = [];               // An array of Scenes
    this.canvas = canvas;			// The HTML5 canvas
    this.pixel_ratio = 1;                       // Device pixel ratio
    this.canvas_width = canvas.width;           // The width of the virtual canvas
    this.canvas_height = canvas.height;         // The height of the virtual canvas
    this.display_width = canvas.width;          // The width of the display
    this.display_height = canvas.height;        // The height of the display
    this.canvas_scale_method = b5.App.FitNone;  // Virtual canvas scaling method
    this.touch_supported = this.isTouchSupported();
    this.allow_touchables = true;	// if true then app will search to find Actor that was touched
    this.target_frame_rate = 60;	// Frame rate at which to update the game (o for measured)
    this.adaptive_physics = false;  // When true physics update will be ran more than once if frame rate falls below target
    this.focus_scene = null;		// Scene that has current input focus
    this.focus_scene2 = null;		// Scene that has will receive touch events if focus scene does not process them
    this.clear_canvas = false;		// If true then canvas will be cleared each frame
    this.touch_focus = null;		// The Actor that has the current touch focus
    this.debug = false;				// Can be used to enable / disable debug trace info
    this.use_marm = false;          // Set true if deploying using the Marmalade SDK
    this.timelines = new b5.TimelineManager();	    // Global animation timeline manager
    this.actions = new b5.ActionsListManager();     // Global actions list manager
    this.box2d = typeof Box2D != "undefined";   // True if Box2D module is present
    this.loading_screen = {
        background_fill: "#fffff",              // Loading background fill style
        background_image: "loading.png",        // Loading background image
        bar_background_fill: "#8080ff",         // Loading bar background fill style
        bar_fill: "#ffffff"                     // Loading bar fill style
    };

    // Resources
    this.bitmaps = [];				// Bitmap resources
    this.brushes = [];				// Brush resources
    this.shapes = [];				// Shape resources
    this.materials = [];			// Material resources
    this.sounds = [];				// Audio resources
    this.onResourceLoaded = function(resource, error)
    {
        this.onResourceLoadedBase(resource, error);
    };

    if (window.devicePixelRatio !== undefined)
        this.pixel_ratio = window.devicePixelRatio;

    // Create the 2D canvas
    this.display = new b5.Display(this.canvas);

    // Set up touch / mouse event handlers
    if (window.navigator.msPointerEnabled)
    {   // WP8
        canvas.addEventListener("MSPointerDown", this.onTouchStart, false);
        canvas.addEventListener("MSPointerMove", this.onTouchMove, false);
        canvas.addEventListener("MSPointerUp", this.onTouchEnd, false);
    }
    else
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
        b5.app.setCanvasScalingMethod();
    };
    this.orientationChange = function(event)
    {
//        b5.app.setCanvasScalingMethod();
    };
    window.addEventListener("resize", this.resize);
//    window.addEventListener("orientationchange", this.orientationChange);
};

Object.defineProperty(b5.App.prototype, "_focus_scene", {
    get: function() { return this.focus_scene; },
    set: function(value) { if (this.focus_scene !== value) { this.focus_scene = b5.Utils.resolveObject(value); } }
});
Object.defineProperty(b5.App.prototype, "_focus_scene2", {
    get: function() { return this.focus_scene2; },
    set: function(value) { if (this.focus_scene2 !== value) { this.focus_scene2 = b5.Utils.resolveObject(value); } }
});


// Virtual canvas scaling methods
b5.App.FitNone = 0; // No scaling or resizing
b5.App.FitX = 1;    // Scale virtual canvas to fit x-axis
b5.App.FitY = 2;    // Scale virtual canvas to fit y-axis
b5.App.FitBest = 3; // Scale virtual canvas to fit best (ensure that no display is lost)
b5.App.FitSize = 4; // No scaling, however HTML canvas is resized to fit the entire display

//
// Keyboard handling
//
b5.App.prototype.onKeyPress = function(e)
{
    var app = b5.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyPressBase(e);
};
b5.App.prototype.onKeyDown = function(e)
{
    var app = b5.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyDownBase(e);
};
b5.App.prototype.onKeyUp = function(e)
{
    var app = b5.app;
    if (app.focus_scene != null)
        app.focus_scene.onKeyUpBase(e);
};

//
// Touch handling
//
b5.App.prototype.isTouchSupported = function()
{
    var msTouchEnabled = window.navigator.msMaxTouchPoints;
//    var generalTouchEnabled = "ontouchstart" in document.createElement("div");
    var generalTouchEnabled = "ontouchstart" in this.canvas;

    if (msTouchEnabled || generalTouchEnabled)
        return true;
    return false;
};

b5.App.prototype.onTouchStart = function(e)
{
    var app = b5.app;
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
    if (app.touch_supported && e.changedTouches !== undefined)
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
b5.App.prototype.onTouchEnd = function(e)
{
    var app = b5.app;
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
    if (app.touch_supported && e.changedTouches !== undefined)
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
b5.App.prototype.onTouchMove = function(e)
{
    var app = b5.app;
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
    if (app.touch_supported && e.changedTouches !== undefined)
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
b5.App.prototype.addScene = function(scene)
{
    this.scenes.push(scene);
    scene.app = this;
    return scene;
};

b5.App.prototype.removeScene = function(scene)
{
    if (this.focus_scene == scene)
        this.focus_scene = null;
    this.removals.push(scene);
};

b5.App.prototype.cleanupDestroyedScenes = function()
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

b5.App.prototype.findScene = function(name)
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
b5.App.prototype.addResource = function(resource, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res != null)
    {
        res.push(resource);
        resource.parent = this;
    }
};

b5.App.prototype.removeResource = function(resource, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res != null)
    {
        var count = res.length;
        for (var t = 0; t < count; t++)
        {
            if (res[t] == resource)
            {
                res.parent = null;
                res.splice(t, 1);
                return;
            }
        }
    }
};

b5.App.prototype.findResource = function(name, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res == null)
        return null;

    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].name === name)
            return res[t];
    }
    if (this.debug)
        console.log("resource '" + name + "' (" + type + ") not found");

    return null;
};

b5.App.prototype.countResourcesNeedLoading = function(include_scenes)
{
    var total = 0;
    var res = this.bitmaps;
    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].preload)
            total++;
    }

    res = this.sounds;
    count = res.length;
    for (t = 0; t < count; t++)
    {
        if (res[t].preload)
            total++;
    }

    if (include_scenes)
    {
        var scenes = this.scenes;
        count = scenes.length;
        for (t = 0; t < count; t++)
            total += scenes[t].countResourcesNeedLoading();
    }
    return total;
};

b5.App.prototype.onResourceLoadedBase = function(resource, error)
{
    if (resource.preload)
        b5.app.total_loaded++;
    if (error)
    {
        if (resource.preload)
            b5.app.total_load_errors++;
        console.log("Error loading resource " + resource.name);
    }
    else
    {
        if (this.debug)
            console.log("Resource loaded " + resource.name);
    }
    resource.loaded = true;
};

b5.App.prototype.waitForResources = function()
{
    // Draw background
    var app = this;
    var disp = app.display;
    var dscale = app.canvas_scale;
    var load_w = 400;
    var load_h = 80;
    disp.setTransform(1, 0, 0, 1, 0, 0);
    disp.setFillStyle(app.loading_screen.background_fill);
    disp.drawRect(0, 0, app.display_width, app.display_height);
    var bg = new Image();
    bg.src = app.loading_screen.background_image;
    bg.onload = function() {
        disp.setTransform(dscale, 0, 0, dscale, app.canvas_cx, app.canvas_cy);
        disp.drawImage(bg, -bg.width >> 1, -bg.height >> 1, bg.width, bg.height);
        disp.setFillStyle(app.loading_screen.bar_background_fill);
        disp.drawRoundRect(-load_w >> 1, (app.canvas_height >> 2) - (load_h >> 1), load_w, load_h, 20, true);
    };

    var total = app.countResourcesNeedLoading(true);
    var tmr = setInterval(function()
    {
        var loaded = b5.app.total_loaded;
        if (loaded >= total)
        {
            if (b5.app.debug)
            {
                console.log("Total resources loaded " + loaded + " of " + total);
                console.log("Total resource load errors " + b5.app.total_load_errors);
            }

            clearInterval(tmr);
            var tmr2 = setInterval(function(){
                // Start main loop
                app.start();
                clearInterval(tmr2);
            }, 1000);
        }
        var w = load_w - 20;
        var h = load_h - 20;
        var perc = loaded / total; if (perc > 1) perc = 1;
        var cw = (w * perc) << 0;
        disp.setFillStyle(app.loading_screen.bar_fill);
        disp.drawRoundRect(-w >> 1, (app.canvas_height >> 2) - (h >> 1), cw, h, 10, true);
    }, 100);
};

//
// Rendering
//
b5.App.prototype.draw = function()
{
    var scenes = this.scenes;
    var count = scenes.length;
    for (var t = 0; t < count; t++)
        scenes[t].draw();
};

//
// Update
//
b5.App.prototype.update = function(dt)
{
    var app = b5.app;
    var scenes = this.scenes;
    var count = scenes.length;
    app.dt = dt;
    app.timelines.update(dt);
    app.actions.execute();
    for (var t = 0; t < count; t++)
        scenes[t].update(dt);
    this.cleanupDestroyedScenes();

    // Re-sort scenes if layers changed
    if (this.order_changed)
    {
        this.order_changed = false;
        b5.Utils.sortLayers(this.scenes);
    }
};

/*b5.App.prototype.mainLoop = function()
{
    if (app.clear_canvas)
        app.display.clear(true);
    app.update(1 / app.target_frame_rate);
    app.draw();
};*/

b5.App.prototype.mainLogic = function()
{
    var app = b5.app;
    var now = Date.now();
    var delta = now - app.last_time;
    app.last_time = now;
    if (app.target_frame_rate === 0)
        app.update(delta / 1000);
    else
        app.update(1 / app.target_frame_rate);
    app.avg_time += delta;
    app.avg_frame++;
    if (app.avg_frame == 60)
    {
        app.avg_frame = 0;
        app.avg_fps = 60000 / app.avg_time;
        app.avg_time = 0;
    }
//    if ((app.avg_frame & 59) == 0)
//        console.log(app.avg_fps);
};

b5.App.prototype.mainDraw = function()
{
    var app = b5.app;
    if (app.clear_canvas)
        app.display.clear(true);
    app.draw();
    requestAnimationFrame(app.mainDraw);
};

b5.App.prototype.start = function()
{
    this.timer = setInterval(this.mainLogic, 1000 / this.target_frame_rate);
    this.mainDraw();
    this.dirty();
};

//
// Utility
//
b5.App.prototype.findHitActor = function(position)
{
    var act = null;
    if (this.focus_scene !== null)
        act = this.focus_scene.findHitActor(position);
    if (act === null && this.focus_scene2 !== null)
        act = this.focus_scene2.findHitActor(position);
    return act;
};

b5.App.prototype.dirty = function()
{
    var s = this.scenes;
    var count = s.length;
    for (var t = 0; t < count; t++)
        s[t].dirty();
};

b5.App.prototype.setCanvasScalingMethod = function(method)
{
    if (method !== undefined)
        this.canvas_scale_method = method;
    var dw = window.innerWidth;
    var dh = window.innerHeight;
    var sw = this.canvas_width;
    var sh = this.canvas_height;
    var sx = 1;
    var sy = 1;
    this.canvas_scale = 1;
    if (this.canvas_scale_method === b5.App.FitNone)
    {
        dw = this.canvas.width;
        dh = this.canvas.height;
    }
    else
    if (this.canvas_scale_method === b5.App.FitSize)
    {
        dw = this.canvas.width;
        dh = this.canvas.height;
        this.canvas.width = dw * this.pixel_ratio;
        this.canvas.height = dh * this.pixel_ratio;
    }
    else
    {
        sx = dw / sw;
        sy = dh / sh;
        var scale = 1;
        switch (this.canvas_scale_method)
        {
            case b5.App.FitX:
                scale = sx;
                break;
            case b5.App.FitY:
                scale = sy;
                break;
            case b5.App.FitBest:
                scale = sx < sy ? sx : sy;
                break;
        }
        this.canvas_scale = scale;
        this.canvas.width = dw * this.pixel_ratio;
        this.canvas.height = dh * this.pixel_ratio;
    }

    if (!this.canvas_fill_window)
    {
        if (sy >= sx)
        {
            dh = dw * this.pixel_ratio * (sh / sw);
            this.canvas.height = dh;
        }
/*        else
        {
            dw = dh * this.pixel_ratio * (sw / sh);
            this.canvas.width = dw;
        }*/
    }

//    this.canvas.style.width = this.canvas.width;
//    this.canvas.style.height = this.canvas.width;
    this.canvas_cx = dw >> 1;
    this.canvas_cy = dh >> 1;

    this.display_width = dw;
    this.display_height = dh;
    this.dirty();
};

b5.App.prototype.parseAndSetFocus = function(scene_name)
{
    new b5.Xoml(this).parseResources(this, [window[scene_name]]);
    this.order_changed = true;
    this.focus_scene = this.findScene(scene_name);
};


