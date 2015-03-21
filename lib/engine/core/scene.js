/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A Scene is a container for game objects. You should create scenes to hold your content (Actors and resources) then
// add them to App to be processed. You can add logic to the actor via its update() method and or by attaching an
// onTick event handler. A Scene has the following features:
// - Manages scene local resources
// - Manages scene local timeline animations
// - Manages a collection of Actors
// - Supports a camera
// - Camera can target actors and follow them on x and y axis
// - Has a position
// - Touch panning (user can drag the camera around)
// - Box2D world physics
// - Extents which limit camera movement
// - Can detect when an actor in the scene has been touched
// - Clipping of child actors against scene, also supports clipping shapes
// - Scene wide opacity
//
// Supports the following event handlers:
// - onCreate() - Called just after Scene has been created
// - onDestroy() - Called just before Scene is destroyed
// - onTick(dt) - Called each time the Scene is updated (every frame)
// - onBeginTouch(touch_pos) - Called when the Scene is touched
// - onEndTouch(touch_pos) - Called when the Scene has stop being touched
// - onMoveTouch(touch_pos) - Called when a touch is moved over the Scene
//
//// Example that shows how to create a scene
// var scene = new b5.Scene();
// scene.name = "my_scene";         // Name the scene
// b5.app.addScene(scene);      // Add the scene to the app for processing
// b5.app.focus_scene = scene;  // Set our scene as the focus scene
//
//// Enable scene touch panning
// scene.touch_pan_x = true;
// scene.touch_pan_y = true;
//
//// Add clipper to scene
// var clipper = new b5.Shape();
// clipper.type = b5.Shape.TypeCircle;
// clipper.width = 300;
// scene.clip_shape = clipper;
//
//// Add a scene update (onTick) handler
// scene.onTick = function(dt) {
//     this.x++;
// };
//
//// Add touch handlers to a scene
// scene.onBeginTouch = function(touch_pos) {
//     console.log("Scene touch begin");
// };
// scene.onEndTouch = function(touch_pos) {
//     console.log("Scene touch end");
// };
// scene.onMoveTouch = function(touch_pos) {
//     console.log("Scene touch move");
// };
//
//// Make scene camera follow a target actor
// scene.target_x = actor6;
// scene.target_y = actor6;


b5.Scene = function()
{
    // Internal variables
    this.app = null;				// Parent app
    this.actors = [];				// Array of actors
    this.removals = [];             // Array of actors that were deleted last frame
    this.frame_count = 0;			// Number of frames that this scene has been running
    this.world = null;				// Box2D world
    this.touching = false;			// Set to true when user touching in the scene
    this.touchmove = false;			// Set to true when touch is moving in this scene
    this.timelines = new b5.TimelineManager();  // Scene local animation timelines
    this.actions = new b5.ActionsListManager(); // Actions list manager
    this.order_changed = true;      // Set to true when child actors change order

    // Public variables
    this.name = "";					// Name of the scene (used to find actors in the scene)
    this.tag = "";					// Tag (used to find groups of actors in the scene)
    this.active = true;				// Active state, inactive scenes will not be updated
    this.visible = true;			// Visible state, invisible scenes will not be drawn
    this.layer = 0;                 // Visible layer (set via property _layers)
    this.x = 0;						// Scene x axis position
    this.y = 0;						// Scene y axis position
    this.w = 1024;					// Scene canvas width
    this.h = 768;					// Scene canvas height
    this.clip_children = true;		// If set to true then actors will be clipped against extents of this scene
    this.clip_shape = null;         // If none null and clipping is enabled then children will be clipped against shape (clip origin is at centre of canvas)
    this.camera_x = 0;				// Camera x position
    this.camera_y = 0;				// Camera y position
    this.camera_vx = 0;				// Camera x velocity
    this.camera_vy = 0;				// Camera y velocity
    this.vx_damping = 1;			// Camera x velocity damping
    this.vy_damping = 1;			// Camera y velocity damping
    this.follow_speed_x = 0.3;		// Camera target follow speed x axis
    this.follow_speed_y = 0.3;		// Camera target follow speed y axis
    this.target_x = null;			// Camera actor target on x axis
    this.target_y = null;			// Camera actor target on y axis
    this.touch_pan_x = false;		// If true then scene will be touch panned on x axis
    this.touch_pan_y = false;		// If true then scene will be touch panned on y axis
    this.panning = false;           // Set to true if scene is currently being panned
    this.min_panning = 0;           // Minimum distance that a touch moves to be classed a as a pan (squared)
    this.world_scale = 20;			// Scaling from graphical world to Box2D world
    this.time_step = 0;             // Physics time step in seconds (use 0 for based on frame rate)
    this.extents = [0,0,0,0];	    // Scene camera extents [left, top, width, height]
    this.opacity = 1.0;				// Scene opacity

    // Resources
    this.bitmaps = [];				// Bitmap resources
    this.brushes = [];				// Brush resources
    this.shapes = [];				// Shape resources
    this.materials = [];			// Material resources
    this.sounds	= [];				// Audio resources
};

Object.defineProperty(b5.Scene.prototype, "_x", {
    get: function() { return this.x; },
    set: function(value) { if (this.x !== value) { this.x = value; } }
});
Object.defineProperty(b5.Scene.prototype, "_y", {
    get: function() { return this.y; },
    set: function(value) { if (this.y !== value) { this.y = value; } }
});
Object.defineProperty(b5.Scene.prototype, "_layer", {
    get: function() { return this.layer; },
    set: function(value) { if (this.layer !== value) { this.layer = value; this.app.order_changed = true; } }
});
Object.defineProperty(b5.Scene.prototype, "_clip_shape", {
    get: function() { return this.clip_shape; },
    set: function(value) { if (this.clip_shape !== value) { this.clip_shape = b5.Utils.resolveResource(value, "shape"); } }
});

b5.Scene.prototype.release = function()
{
    if (this.onDestroy !== undefined)
        this.onDestroy();
    this.world = null;
    this.actors = null;
};

b5.Scene.prototype.destroy = function()
{
    this.app.removeScene(this);
};


//
// Children
//
b5.Scene.prototype.addActor = function(actor)
{
    this.actors.push(actor);
    actor.scene = this;
    return actor;
};

b5.Scene.prototype.removeActor = function(actor)
{
    this.removals.push(actor);
};

b5.Scene.prototype.removeActorsWithTag = function(tag)
{
    var acts = this.actors;
    var count = acts.length;
    var removals = this.removals;
    for (var t = 0; t < count; t++)
    {
        if (acts[t].tag === tag)
            removals.push(acts[t]);
    }
};

b5.Scene.prototype.cleanupDestroyedActors = function()
{
    var dcount = this.removals.length;
    if (dcount > 0)
    {
        var removals = this.removals;
        var acts = this.actors;
        var count = acts.length;
        for (var s = 0; s < dcount; s++)
        {
            var dact = removals[s];
            for (var t = 0; t < count; t++)
            {
                if (dact === acts[t])
                {
                    dact.release();
                    acts.splice(t, 1);
                    count--;
                    break;
                }
            }
        }
    }
    this.removals = [];
};

b5.Scene.prototype.findActor = function(name, recursive)
{
    if (recursive === undefined)
        recursive = false;
    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        if (acts[t].name === name)
            return acts[t];
        else if (recursive)
        {
            var act = acts[t].findActor(name, recursive);
            if (act !== null)
                return act;
        }
    }
    return null;
};

b5.Scene.prototype.bringToFront = function()
{
    var scenes = this.app.scenes;
    var count = scenes.length;
    var i = -1;
    for (var t = 0; t < count; t++)
    {
        if (scenes[t] === this)
        {
            i = t;
            break;
        }
    }
    if (i >= 0)
    {
        scenes.splice(i, 1);
        scenes.push(this);
    }
};

b5.Scene.prototype.sendToBack = function()
{
    var scenes = this.app.scenes;
    var count = scenes.length;
    var i = -1;
    for (var t = 0; t < count; t++)
    {
        if (scenes[t] === this)
        {
            i = t;
            break;
        }
    }
    if (i >= 0)
    {
        scenes.splice(i, 1);
        scenes.unshift(this);
    }
};

//
// Key events
//
b5.Scene.prototype.onKeyPressBase = function(e)
{
    if (this.onKeyPress !== undefined)
        this.onKeyPress(e);
};
b5.Scene.prototype.onKeyDownBase = function(e)
{
    if (this.onKeyDown !== undefined)
        this.onKeyDown(e);
};
b5.Scene.prototype.onKeyUpBase = function(e)
{
    if (this.onKeyUp !== undefined)
        this.onKeyUp(e);
};

//
// Touch events
//
b5.Scene.prototype.onBeginTouchBase = function(touch_pos)
{
    this.touching = true;
    if (this.onBeginTouch !== undefined)
        this.onBeginTouch(touch_pos);
};
b5.Scene.prototype.onEndTouchBase = function(touch_pos)
{
    if (this.touching && this.onTapped !== undefined)
        this.onTapped(touch_pos);
    this.touching = false;
    this.touchmove = false;
    if (this.onEndTouch !== undefined)
        this.onEndTouch(touch_pos);
    this.panning = false;
};
b5.Scene.prototype.onMoveTouchBase = function(touch_pos)
{
    this.touchmove = true;
    if (this.onMoveTouch !== undefined)
        this.onMoveTouch(touch_pos);

    if (this.touching)
    {
        var app = this.app;
        var d = 0;
        if (this.touch_pan_x)
        {
            d = app.touch_drag_x;
            this.camera_vx = d * app.target_frame_rate;
            this.camera_x += d;
        }
        if (this.touch_pan_y)
        {
            d = app.touch_drag_y;
            this.camera_vy = d * app.target_frame_rate;
            this.camera_y += d;
        }
        if ((app.touch_drag_x * app.touch_drag_x + app.touch_drag_y * app.touch_drag_y) > this.min_panning)
            this.panning = true;
    }
};

//
// Physics
//
b5.Scene.prototype.initWorld = function(gravity_x, gravity_y, allow_sleep)
{
    if (!this.app.box2d)
        return;
    this.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(gravity_x, gravity_y), allow_sleep);

    var listener = new Box2D.Dynamics.b2ContactListener;
    listener.BeginContact = function(contact)
    {
        var actor = contact.GetFixtureA().GetBody().GetUserData();
        if (actor.onCollisionStart !== undefined)
            actor.onCollisionStart(contact);
        actor = contact.GetFixtureB().GetBody().GetUserData();
        if (actor.onCollisionStart !== undefined)
            actor.onCollisionStart(contact);
//		console.log(actor.name);
    };
    listener.EndContact = function(contact)
    {
        var actor = contact.GetFixtureA().GetBody().GetUserData();
        if (actor.onCollisionEnd !== undefined)
            actor.onCollisionEnd(contact);
        actor = contact.GetFixtureB().GetBody().GetUserData();
        if (actor.onCollisionEnd !== undefined)
            actor.onCollisionEnd(contact);
//		console.log(actor);
    };
/*	listener.PostSolve = function(contact, impulse)
    {
    }
    listener.PreSolve = function(contact, oldManifold)
    {
    }*/
    this.world.SetContactListener(listener);

/*	var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;
    var debugDraw = new b2DebugDraw();
    var context = this.app.display.context;
    debugDraw.SetSprite(context);
    debugDraw.SetDrawScale(this.world_scale);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(1.0);
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    this.world.SetDebugDraw(debugDraw);*/
};

//
// Rendering
//
b5.Scene.prototype.draw = function()
{
    if (!this.visible)
        return;

    var app = this.app;
    var dscale = app.canvas_scale;
    var disp = app.display;
    if (this.clip_children)
    {
        var x = app.canvas_cx + this.x;
        var y = app.canvas_cy + this.y;
        disp.setTransform(dscale, 0, 0, dscale, x, y);
        disp.saveContext();
        if (this.clip_shape === null)
            disp.clipRect(-this.w/2, -this.h/2, this.w, this.h);
        else
        {
            var shape = this.clip_shape;
            if (this.clip_shape.type === b5.Shape.TypeBox)
                disp.clipRect(0, 0, shape.width, shape.height);
            else
            if (this.clip_shape.type === b5.Shape.TypeCircle)
                disp.clipArc(0, 0, shape.width, 0, 2 * Math.PI);
            else
            if (this.clip_shape.type === b5.Shape.TypePolygon)
                disp.clipPolygon(shape.vertices);
        }
    }

    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        acts[t].draw();
    }

    if (this.clip_children)
        disp.restoreContext();
};

//
// Update
//
b5.Scene.prototype.baseUpdate = function(dt)
{
    if (!this.active)
        return false;

    if (this.onTick !== undefined)
        this.onTick(dt);

    this.timelines.update(dt);
    this.actions.execute();

    // Update camera;
    this.updateCamera(dt);

    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        acts[t].update(dt);
    }

    if (this.world !== null)
    {
        var app = b5.app;
        if (this.time_step === 0)
            this.world.Step(dt, 10, 10);		// frame-rate, velocity iterations, position iterations
        else
        {
            var run_count = 1;
            if (app.adaptive_physics)
            {
                run_count = (app.target_frame_rate / app.avg_fps + 0.5) << 0;
                if (run_count < 1)
                    run_count = 1;
                else if (run_count > 3)
                    run_count = 3;
            }
            for (var t = 0; t < run_count; t++)
                this.world.Step(this.time_step, 10, 10);
        }
    }

    if (this.world !== null)
        this.world.ClearForces();

    this.frame_count++;

    this.cleanupDestroyedActors();

    // Re-sort actors if layers changed
    if (this.order_changed)
    {
        this.order_changed = false;
        b5.Utils.sortLayers(this.actors);
    }

    return true;
};

b5.Scene.prototype.update = function(dt)
{
    return this.baseUpdate(dt);

};

//
// Utility
//
b5.Scene.prototype.updateCamera = function(dt)
{
    // Follow target
    if (this.target_x !== null)
    {
        if (this.follow_speed_x === 0)
        {
            this.camera_x = this.target_x.x;
            this.camera_vx = 0;
        }
        else
            this.camera_vx += (this.target_x.x - this.camera_x) * this.follow_speed_x;
    }
    if (this.target_y !== null)
    {
        if (this.follow_speed_y === 0)
        {
            this.camera_y = this.target_y.y;
            this.camera_vy = 0;
        }
        else
            this.camera_vy += (this.target_y.y - this.camera_y) * this.follow_speed_y;
    }

    if (!this.touching)
    {
        this.camera_x += this.camera_vx * dt;
        this.camera_y += this.camera_vy * dt;
        this.camera_vx *= this.vx_damping;
        this.camera_vy *= this.vy_damping;
    }
/*	if (this.camera_vx > -0.01 && this.camera_vx < 0.01)
        this.camera_vx = 0;
    if (this.camera_vy > -0.01 && this.camera_vy < 0.01)
        this.camera_vy = 0;*/

    // Keep camera within extents
    if (this.camera_x !== 0 || this.camera_y !== 0)
    {
        var ew = this.extents[2];
        var eh = this.extents[3];
        var sw = this.app.canvas_width;
        var sh = this.app.canvas_height;
        if (ew !== 0 && sw <= ew)
        {
            var cx = sw / 2;
            var left = this.extents[0] + cx;
            var right = (this.extents[0] + ew) - cx;
            if (this.camera_x < left)
            {
                this.camera_x = left;
                this.camera_vx = 0;
            }
            if (this.camera_x > right)
            {
                this.camera_x = right;
                this.camera_vx = 0;
            }
        }
        if (sw > ew)
            this.camera_x = 0;
        if (eh !== 0 && sh <= eh)
        {
            var cy = sh / 2;
            var top = this.extents[1] + cy;
            var bottom = (this.extents[1] + eh) - cy;
            if (this.camera_y < top)
            {
                this.camera_y = top;
                this.camera_vy = 0;
            }
            if (this.camera_y > bottom)
            {
                this.camera_y = bottom;
                this.camera_vy = 0;
            }
        }
        if (sh > eh)
            this.camera_y = 0;
    }
};

b5.Scene.prototype.findHitActor = function(position)
{
    var acts = this.actors;
    var count = acts.length;
    var hit = null;
    for (var t = count - 1; t >=0 ; t--)
    {
        hit = acts[t].hitTest(position);
        if (hit !== null)
            return hit;
    }
    return hit;
};
b5.Scene.prototype.dirty = function()
{
    var a = this.actors;
    var count = a.length;
    for (var t = 0; t < count; t++)
        a[t].dirty();
};

//
// Resource management
//
b5.Scene.prototype.addResource = function(resource, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res !== null)
    {
        res.push(resource);
        resource.parent = this;
    }
};

b5.Scene.prototype.removeResource = function(resource, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res !== null)
    {
        var count = res.length;
        for (var t = 0; t < count; t++)
        {
            if (res[t] === resource)
            {
                res.parent = null;
                res.splice(t, 1);
                return;
            }
        }
    }
};

b5.Scene.prototype.findResource = function(name, type)
{
    var res = b5.Utils.getResFromType(this, type);
    if (res === null)
        return null;

    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].name === name)
            return res[t];
    }

    return this.app.findResource(name, type);	// Check parent app (globals) for resource as it was not found in this scene
};

b5.Scene.prototype.areResourcesLoaded = function()
{
    var res = this.bitmaps;
    var count = res.length;
    for (var t = 0; t < count; t++)
    {
        if (res[t].preload && !res[t].loaded)
            return false;
    }

    return true;
};

b5.Scene.prototype.countResourcesNeedLoading = function()
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

    return total;
};

