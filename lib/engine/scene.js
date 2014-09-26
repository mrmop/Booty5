/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Scene is a container for game objects. You should create scenes to hold your content (Actors and resources) then
// add them to TheApp to be processed. You can add logic to the actor via its update() method and or by attaching an
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
// - onTick(delta_time) - Called each time the Scene is updated (every frame)
// - onBeginTouch(touch_pos) - Called when the Scene is touched
// - onEndTouch(touch_pos) - Called when the Scene has top being touched
// - onMoveTouch(touch_pos) - Called when a touch is moved over the Scene
//
function Scene()
{
    // Internal variables
    this.app = null;				// Parent app
    this.actors = [];				// Array of actors
    this.removals = [];             // Array of actors that were deleted last frame
    this.frame_count = 0;			// Number of frames that this scene has been running
    this.world = null;				// Box2D world
    this.touching = false;			// Set to true when user touching in the scene
    this.touchmove = false;			// Set to true when touch is moving in this scene
    this.timelines = new TimelineManager(); // Scene local animation timelines

    // Public variables
    this.name = "";					// Name of the scene (used to find actors in the scene)
    this.tag = "";					// Tag (used to find groups of actors in the scene)
    this.active = true;				// Active state, inactive scenes will not be updated
    this.visible = true;			// Visible state, invisible scenes will not be drawn
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
    this.follow_speed_x = 0.3;		// Camera target follow speed x axis
    this.follow_speed_y = 0.3;		// Camera target follow speed y axis
    this.target_x = null;			// Camera actor target on x axis
    this.target_y = null;			// Camera actor target on y axis
    this.touch_pan_x = false;		// If true then scene will be touch panned on x axis
    this.touch_pan_y = false;		// If true then scene will be touch panned on y axis
    this.world_scale = 20;			// Scaling from graphical world to Box2D world
    this.extents = [0,0,0,0];	    // Scene camera extents [left, top, width, height]
    this.opacity = 1.0;				// Scene opacity

    // Resources
    this.bitmaps = [];				// Bitmap resources
    this.brushes = [];				// Brush resources
    this.shapes = [];				// Shape resources
    this.materials = [];			// Material resources
    this.geoms = [];				// Geometry resources
    this.sounds	= [];				// Audio resources

}

Scene.prototype.release = function()
{
    if (this.onDestroy != undefined)
        this.onDestroy();
    this.world = null;
    this.actors = null;
};

Scene.prototype.destroy = function()
{
    this.app.removeScene(this);
};


//
// Children
//
Scene.prototype.addActor = function(actor)
{
    this.actors.push(actor);
    actor.scene = this;
};

Scene.prototype.removeActor = function(actor)
{
    this.removals.push(actor);
};

Scene.prototype.removeActorsWithTag = function(tag)
{
    var acts = this.actors;
    var count = acts.length;
    var removals = this.removals;
    for (var t = 0; t < count; t++)
    {
        if (acts[t].tag == tag)
            removals.push(acts[t]);
    }
};

Scene.prototype.cleanupDestroyedActors = function()
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
                if (dact == acts[t])
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

Scene.prototype.findActor = function(name, recursive)
{
    if (recursive == undefined)
        recursive = false;
    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        if (acts[t].name == name)
            return acts[t];
        else if (recursive)
        {
            var act = acts[t].findActor(name, recursive);
            if (act != null)
                return act;
        }
    }
    return null;
};

Scene.prototype.bringToFront = function()
{
    var scenes = this.app.scenes;
    var count = scenes.length;
    var index = -1;
    for (var t = 0; t < count; t++)
    {
        if (scenes[t] == this)
        {
            index = t;
            break;
        }
    }
    if (index >= 0)
    {
        scenes.splice(index, 1);
        scenes.push(this);
    }
};

Scene.prototype.sendToBack = function()
{
    var scenes = this.app.scenes;
    var count = scenes.length;
    var index = -1;
    for (var t = 0; t < count; t++)
    {
        if (scenes[t] == this)
        {
            index = t;
            break;
        }
    }
    if (index >= 0)
    {
        scenes.splice(index, 1);
        scenes.unshift(this);
    }
};

//
// Touch events
//
Scene.prototype.onBeginTouchBase = function(touch_pos)
{
    this.touching = true;
    if (this.onBeginTouch != undefined)
        this.onBeginTouch(touch_pos);
};
Scene.prototype.onEndTouchBase = function(touch_pos)
{
    if (this.touching && this.onTapped != undefined)
        this.onTapped(touch_pos);
    this.touching = false;
    this.touchmove = false;
    if (this.onEndTouch != undefined)
        this.onEndTouch(touch_pos);
};
Scene.prototype.onMoveTouchBase = function(touch_pos)
{
    this.touchmove = true;
    if (this.onMoveTouch != undefined)
        this.onMoveTouch(touch_pos);

    if (this.touching)
    {
        var app = this.app
        if (this.touch_pan_x)
        {
            var d = app.touch_drag_x;
            this.camera_vx = d * app.target_frame_rate;
            this.camera_x += d;
        }
        if (this.touch_pan_y)
        {
            var d = app.touch_drag_y;
            this.camera_vy = d * app.target_frame_rate;
            this.camera_y += d;
        }
    }
};

//
// Physics
//
Scene.prototype.initWorld = function(gravity_x, gravity_y, allow_sleep)
{
    this.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(gravity_x, gravity_y), allow_sleep);

    var listener = new Box2D.Dynamics.b2ContactListener;
    listener.BeginContact = function(contact)
    {
        var actor = contact.GetFixtureA().GetBody().GetUserData();
        if (actor.onCollisionStart != undefined)
            actor.onCollisionStart(contact);
//		console.log(actor);
    }
    listener.EndContact = function(contact)
    {
        var actor = contact.GetFixtureA().GetBody().GetUserData();
        if (actor.onCollisionEnd != undefined)
            actor.onCollisionEnd(contact);
//		console.log(actor);
    }
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
Scene.prototype.draw = function()
{
    if (!this.visible)
        return;

    var context = app.display.context;	// The rendering context
    if (this.clip_children)
    {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.save();
        context.beginPath();
        if (this.clip_shape == null)
            context.rect((this.x + 0.5) << 0, (this.y + 0.5) << 0, this.w, this.h);
        else
        {
            var display = app.display;
            var mx = display.canvas_width / 2;
            var my = display.canvas_height / 2;
            var x = (this.x + mx + 0.5) << 0;
            var y = (this.y + my + 0.5) << 0;
            var shape = this.clip_shape;
            if (this.clip_shape.type == Shape.TypeBox)
                context.rect(x, y, shape.width, shape.height);
            else
            if (this.clip_shape.type == Shape.TypeCircle)
                context.arc(x, y, shape.width, 0, 2 * Math.PI, false);
            else
            if (this.clip_shape.type == Shape.TypePolygon)
            {
                var points = shape.vertices;
                var count = points.length;
                context.moveTo(points[0] + x, points[1] + y);
                for (var i = 2; i < count; i += 2)
                    context.lineTo(points[i] + x, points[i + 1] + y);
                context.closePath();
            }
        }
        context.clip();
    }

    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        acts[t].draw();
    }

    if (this.clip_children)
        context.restore();
};

//
// Update
//
Scene.prototype.baseUpdate = function(dt)
{
    if (!this.active)
        return false;

    if (this.onTick != undefined)
        this.onTick(dt);

    this.timelines.update(dt);

    // Update camera;
    this.updateCamera(dt);

    if (this.world != null)
        this.world.Step(dt, 10, 10);		// frame-rate, velocity iterations, position iterations

    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        acts[t].update(dt);
    }

    if (this.world != null)
        this.world.ClearForces();

    this.frame_count++;

    this.cleanupDestroyedActors();

    return true;
};

Scene.prototype.update = function(dt)
{
    return this.baseUpdate(dt);

};

//
// Utility
//
Scene.prototype.updateCamera = function(dt)
{
    // Follow target
    if (this.target_x != null)
    {
        if (this.follow_speed_x == 0)
        {
            this.camera_x = this.target_x.x;
            this.camera_vx = 0;
        }
        else
            this.camera_vx += (this.target_x.x - this.camera_x) * this.follow_speed_x;
    }
    if (this.target_y != null)
    {
        if (this.follow_speed_y == 0)
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
        this.camera_vx *= 0.9;
        this.camera_vy *= 0.9;
    }
/*	if (this.camera_vx > -0.01 && this.camera_vx < 0.01)
        this.camera_vx = 0;
    if (this.camera_vy > -0.01 && this.camera_vy < 0.01)
        this.camera_vy = 0;*/

    // Keep camera within extents
    if (this.camera_x != 0 || this.camera_y != 0)
    {
        var sw = this.app.display.canvas_width;
        var sh = this.app.display.canvas_height;
        if (sw <= this.extents[2] && sh <= this.extents[3])
        {
            var cx = sw / 2;
            var left = this.extents[0] + cx;
            var right = (this.extents[0] + this.extents[2]) - cx;
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
            var cy = sh / 2;
            var top = this.extents[1] + cy;
            var bottom = (this.extents[1] + this.extents[3]) - cy;
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
    }
};

Scene.prototype.findHitActor = function(position)
{
    var acts = this.actors;
    var count = acts.length;
    var hit = null;
    for (var t = count - 1; t >=0 ; t--)
    {
        hit = acts[t].hitTest(position);
        if (hit != null)
            return hit;
    }
    return hit;
};

//
// Resource management
//
Scene.prototype.getResFromType = function(type)
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
    else if (type == "geometry")
        return this.geoms;
    return null;
};

Scene.prototype.addResource = function(resource, type)
{
    var res = this.getResFromType(type);
    if (res != null)
        res.push(resource);
};

Scene.prototype.removeResource = function(resource, type)
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

Scene.prototype.findResource = function(name, type)
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

    return this.app.findResource(name, type);	// Check parent app (globals) for resource as it was not found in this scene
};

