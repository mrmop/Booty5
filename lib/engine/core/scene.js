/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A Scene is a container for game objects. You should create scenes to hold your content (Actors and resources) then
 * add them to App to be processed and rendered. You can add logic to the scene via its update() method and or by
 * attaching an onTick event handler. A Scene has the following features:
 *
 * - Manages scene local resources
 * - Manages scene local Timeline animations using a TimelineManager
 * - Manages a collection of local action lists using an ActionsListManager
 * - Manages an events manager for scene wide events
 * - Manages a task manager
 * - Manages a collection of Actors
 * - Supports a camera
 * - Camera can target actors and follow them on x and y axis
 * - Position and scaling
 * - Touch panning (user can drag the camera around)
 * - Box2D world physics
 * - Extents which limit camera movement
 * - Can detect when an actor in the scene has been touched
 * - Clipping of child actors against scene, also supports clipping shapes
 * - Scene wide opacity
 * - Layer ordering
 *
 * Supports the following event handlers:
 *
 * - onCreate() - Called just after Scene has been created
 * - onDestroy() - Called just before Scene is destroyed
 * - onTick(dt) - Called each time the Scene is updated (every frame)
 * - onBeginTouch(touch_pos) - Called when the Scene is touched
 * - onEndTouch(touch_pos) - Called when the Scene has stop being touched
 * - onMoveTouch(touch_pos) - Called when a touch is moved over the Scene
 * - onKeyPress(event) - Called when a key is pressed and this scene has focus
 * - onKeyDown(event) - Called when a key is pressed down and this scene has focus
 * - onKeyUp(event) - Called when a key is released and this scene has focus
 *
 * <b>Examples</b>
 *
 * Example that shows how to create a scene with optional extras
 *
 *      var scene = new b5.Scene();
 *      scene.name = "my_scene";     // Name the scene
 *      b5.app.addScene(scene);      // Add the scene to the app for processing
 *      b5.app.focus_scene = scene;  // Set our scene as the focus scene
 *
 * Enable scene touch panning example
 *
 *      scene.touch_pan_x = true;
 *      scene.touch_pan_y = true;
 *
 * Add clipper to scene example
 *
 *      var clipper = new b5.Shape();
 *      clipper.type = b5.Shape.TypeCircle;
 *      clipper.width = 300;
 *      scene.clip_shape = clipper;
 *
 * Add a scene update (onTick) handler example
 *
 *      scene.onTick = function(dt) {
 *          this.x++;
 *      };
 *
 * Add touch handlers to a scene example
 *
 *      scene.onBeginTouch = function(touch_pos) {
 *          console.log("Scene touch begin");
 *      };
 *      scene.onEndTouch = function(touch_pos) {
 *          console.log("Scene touch end");
 *      };
 *      scene.onMoveTouch = function(touch_pos) {
 *          console.log("Scene touch move");
 *      };
 *
 * Make scene camera follow a target actor example
 *
 *      scene.target_x = player_actor;
 *      scene.target_y = player_actor;
 *
 * Create a resource and add it to the scenes resource manager then later find it and destroy it
 *
 *      var material = new b5.Material("static_bounce");
 *      material.restitution = 1;
 *      scene.addResource(material, "Material");
 *      // Find resource
 *      var material = b5.Utils.findResourceFromPath("scene1.material1", "material");
 *      material.destroy();
 *
 * Add a physics world to a scene
 *
 *      scene.initWorld(gravity_x, gravity_y, do_sleep);
 *
 * Add an actions list to a scene
 *
 *      // Create actions list
 *      var actions_list = new b5.ActionsList("turn", 0);
 *      // Add an action to actions list
 *      actions_list.add(new b5.A_SetProps(actor, "vr", 2 / 5));
 *      // Add actions list to the scenes actions list manager
 *      scene.actions.add(actions_list);
 *
 * Add an animation timeline to a scene
 *
 *      // Create a timeline that scales actor1
 *      var timeline = new b5.Timeline(actor1, "_scale", [1, 1.5, 1], [0, 0.5, 1], 1, [b5.Ease.quartin, b5.Ease.quartout]);
 *      // Add timeline to the scene for processing
 *      scene.timelines.add(timeline);
 *
 * For a complete overview of the Scene class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/scenes/ Booty5 Scene Overview}
 *
 * @class Scene
 * @constructor
 * @returns {b5.Scene} The created Scene
 *
 * @property {b5.App}                   app                     - Parent app (internal)
 * @property {b5.Actor[]}               actors = [];			- Array of top level actors (internal)
 * @property {b5.Actor[]}               removals                - Array of actors that should be deleted at end of frame (internal) (internal)
 * @property {object}                   world                   - Box2D world (internal)
 * @property {b5.TimelineManager}       timelines               - Actor local animation timelines (internal)
 * @property {b5.ActionsListManager}    actions                 - Actions list manager (internal)
 * @property {number}                   order_changed           - Set to true when child actors change order (internal)
 * @property {b5.Bitmap[]}              bitmaps                 - Bitmap resources (internal)
 * @property {object[]}                 brushes                 - Brush resources (internal)
 * @property {b5.Shape[]}               shapes                  - Shape resources (internal)
 * @property {b5.Material[]}            materials               - Material resources (internal)
 * @property {b5.Sound[]}               sounds                  - Audio resources (internal)
 * @property {b5.Font[]}                fonts                   - Font resources (internal)
 * @property {b5.Raw[]}                 raw                     - Raw JSON resources (internal)

 * @property {b5.EventsManager}         events                  - Events manager
 * @property {b5.TasksManager}          tasks                   - Tasks manager (internal)
 * @property {string}                   name                    - Name of the scene (used to find scenes in the app)
 * @property {string}                   tag                     - Tag (used to find groups of scenes in the app)
 * @property {boolean}                  active                  - Active state, inactive scenes will not be updated (default true)
 * @property {boolean}                  visible                 - Visible state, invisible scenes will not be drawn (default true)
 * @property {number}                   layer                   - Visible layer (set via property _layers) (default 0)
 * @property {number}                   x                       - Scene x axis position
 * @property {number}                   y                       - Scene y axis position
 * @property {number}                   w                       - Scene width (default 1024)
 * @property {number}                   h                       - Scene canvas height (default 768)
 * @property {boolean}                  clip_children           - If set to true then actors will be clipped against extents of this scene (default true)
 * @property {b5.Shape}                 clip_shape              - If none null and clipping is enabled then children will be clipped against shape (clip origin is at centre of canvas), if set via _clip_shape then instance of shape or string based path to shape can be used (default is null)
 * @property {number}                   camera_x                - Camera x position
 * @property {number}                   camera_y                - Camera y position
 * @property {number}                   camera_vx               - Camera x velocity
 * @property {number}                   camera_vy               - Camera y velocity
 * @property {number}                   vx_damping              - Camera x velocity damping (default 1)
 * @property {number}                   vy_damping              - Camera y velocity damping (default 1)
 * @property {number}                   follow_speed_x          - Camera target follow speed x axis (default 0.3)
 * @property {number}                   follow_speed_y          - Camera target follow speed y axis (default 0.3)
 * @property {b5.Actor}                 target_x                - Camera actor target on x axis (default null)
 * @property {b5.Actor}                 target_y                - Camera actor target on y axis (default null)
 * @property {boolean}                  touch_pan_x             - If true then scene will be touch panned on x axis (default false)
 * @property {boolean}                  touch_pan_y             - If true then scene will be touch panned on y axis (default false)
 * @property {boolean}                  panning                 - Set to true if scene is currently being panned
 * @property {number}                   min_panning             - Minimum distance that a touch moves to be classed a as a pan (squared)
 * @property {number}                   world_scale             - Scaling from graphical world to Box2D world (default 20)
 * @property {number}                   time_step               - Physics time step in seconds (use 0 for based on frame rate) (default 0)
 * @property {number[]}                 extents                 - Scene camera extents [left, top, width, height]
 * @property {number}                   opacity                 - Scene opacity (default 1)
 * @property {number}                   frame_count             - Number of frames that this scene has been running
 * @property {boolean}                  touching                - Set to true when user touching in the scene
 * @property {boolean}                  touchmove               - Set to true when touch is moving in this scene
 * @property {bool}                   	draw_reverse            - If set to true children are drawn in reverse order
 *
 */
b5.Scene = function()
{
    // Internal variables
    this.app = null;				// Parent app
    this.actors = [];				// Array of actors
    this.removals = [];             // Array of actors that were deleted last frame
    this.world = null;				// Box2D world
    this.timelines = new b5.TimelineManager();  // Scene local animation timelines
	if (b5.ActionsListManager !== undefined)
        this.actions = new b5.ActionsListManager(); // Actions list manager
    this.tasks = new b5.TasksManager();         // Tasks manager
    this.events = new b5.EventsManager();       // Events manager
    this.order_changed = true;      // Set to true when child actors change order

    // Public variables
    this.name = "";					// Name of the scene (used to find scenes in the app)
    this.tag = "";					// Tag (used to find groups of scenes in the app)
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
    this.frame_count = 0;			// Number of frames that this scene has been running
    this.touching = false;			// Set to true when user touching in the scene
    this.touchmove = false;			// Set to true when touch is moving in this scene
	this.draw_reverse = false;       // If set to true children are drawn in reverse order
    
    // Resources
    this.bitmaps = [];				// Bitmap resources
    this.brushes = [];				// Brush resources
    this.shapes = [];				// Shape resources
    this.materials = [];			// Material resources
    this.sounds	= [];				// Audio resources
    this.fonts	= [];				// Font resources
    this.raw	= [];				// Raw JSON resources
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
Object.defineProperty(b5.Scene.prototype, "_av", {
	set: function(value) { this.visible = value; this.active = value; }
});

/**
 * Releases this scene, destroying any attached physics world and child actors. If the scene has the onDestroy
 * callback defined then it will be called
 */
b5.Scene.prototype.release = function()
{
    if (this.onDestroy !== undefined)
        this.onDestroy();
    this.world = null;
    this.actors = null;
};

/**
 * Destroys the scene and all of its contained actors and resources
 */
b5.Scene.prototype.destroy = function()
{
    this.app.removeScene(this);
};


//
// Children
//

/**
 * Adds the specified actor to this scenes child list, placing the specified actor under control of this scene
 * @param actor {b5.Actor} An actor
 * @return {b5.Actor} The supplied actor
 */
b5.Scene.prototype.addActor = function(actor)
{
    this.actors.push(actor);
    actor.scene = this;
    return actor;
};

/**
 * Removes the specified actor from this scenes child list
 * @param actor {b5.Actor} An actor
 */
b5.Scene.prototype.removeActor = function(actor)
{
    this.removals.push(actor);
};

/**
 * Removes all actors from this scenes child list that match the specified tag
 * @param tag {String} Actor tag
 */
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

/**
 * Cleans up all child actors that were destroyed this frame
 * @private
 */
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

/**
 * Searches the scenes children to find the named actor
 * @param name {String} Name of actor to find
 * @param recursive {boolean} If true then this scenes entire child actor hierarchy will be searched
 * @returns {b5.Actor} The found actor or null if not found
 */
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

/**
 * Searches the scenes children to find the actor by its id
 * @param id {number} Id of actor to find
 * @param recursive {boolean} If true then this scenes entire child actor hierarchy will be searched
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Scene.prototype.findActorById = function(id, recursive)
{
    if (recursive === undefined)
        recursive = false;
    var acts = this.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        if (acts[t].id === id)
            return acts[t];
        else if (recursive)
        {
            var act = acts[t].findActorById(id, recursive);
            if (act !== null)
                return act;
        }
    }
    return null;
};

/**
 * Moves the scene to the end of the apps child list, effectively rendering it on top of all other scenes that have the
 * same depth
 */
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

/**
 * Moves the scene to the start of the apps child list, effectively rendering behind all other scenes that have the
 * same depth
 */
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
/**
 * Callback that is called by the App when the user presses a key and this scene has the primary focus
 * @private
 * @param e {object} The key event
 */
b5.Scene.prototype.onKeyPressBase = function(e)
{
    if (this.onKeyPress !== undefined)
        this.onKeyPress(e);
};
/**
 * Callback that is called by the App when the user presses down a key and this scene has the primary focus
 * @private
 * @param e {object} The key event
 */
b5.Scene.prototype.onKeyDownBase = function(e)
{
    if (this.onKeyDown !== undefined)
        this.onKeyDown(e);
};
/**
 * Callback that is called by the App when the user releases a key and this scene has the primary focus
 * @private
 * @param e {object} The key event
 */
b5.Scene.prototype.onKeyUpBase = function(e)
{
    if (this.onKeyUp !== undefined)
        this.onKeyUp(e);
};

//
// Touch events
//

/**
 * Callback that is called when the user touches the screen, provided that this scene has primary or secondary focus
 * @private
 * @param e {object} Touch event object
 */
b5.Scene.prototype.onBeginTouchBase = function(touch_pos)
{
    this.touching = true;
    if (this.onBeginTouch !== undefined)
        this.onBeginTouch(touch_pos);
};
/**
 * Callback that is called when the user stops touching the screen, provided that this scene has primary or secondary
 * focus
 * @private
 * @param e {object} Touch event object
 */
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
/**
 * Callback that is called when the user moves a touch around the screen, provided that this scene has primary or
 * secondary focus
 * @param e {object} Touch event object
 */
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
/**
 * Creates and initialises a Box2D world and attaches it to the scene. Note that all scenes that contain Box2D physics
 * objects must also contain a Box2D world
 * @param gravity_x {number} X axis gravity
 * @param gravity_y {number} Y axis gravity
 * @param allow_sleep {boolean} If set to true then actors with physics attached will be allowed to sleep which will
 * speed up the processing of physics considerably
 */
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
/**
 * Renders the scene and all of its contained actors
 */
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
    if (this.draw_reverse)
    {
        for (var t = count - 1; t >= 0; t--)
            acts[t].draw();
    }
    else
    {
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }

    if (this.clip_children)
        disp.restoreContext();
};

//
// Update
//
/**
 * Main base scene update method that is called by the main app object each logic loop. Performs many actions including:
 * - Calling onTick() callback
 * - Updating local timelines manager
 * - Updating local actions manager
 * - Update child actor hierarchy
 * - Update physics world
 * - Cleaning up destroyed child actors
 * - Sorting child actor layers
 * @param dt {number} Time that has passed since this scene was last updated in seconds
 */
b5.Scene.prototype.baseUpdate = function(dt)
{
    if (!this.active)
        return false;

    if (this.onTick !== undefined)
        this.onTick(dt);

    this.timelines.update(dt);
	if (this.actions !== undefined)
        this.actions.execute();
    this.tasks.execute();

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

/**
 * Updates the scene and all of its contained actors
 * @param dt {number} The amount of time that has passed since this scene was last updated in seconds
 */
b5.Scene.prototype.update = function(dt)
{
    return this.baseUpdate(dt);

};

//
// Utility
//
/**
 * Updates the scenes camera
 * @param dt The amount of time that has passed since this scene was last updated in seconds
 */
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
        var sw = this.app.design_width;
        var sh = this.app.design_height;
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

/**
 * Traverses the actor hierarchy testing touchable actors to see if the supplied position lies within their bounds
 * @param position {object} The x,y position to be tested
 * @returns {b5.Actor} The actor that was hit or null if no actor was hit
 */
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

/**
 * Dirties all child actor transforms forcing them to be rebuilt
 */
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
/**
 * Adds a resource to the this scenes local resource manager
 * @param resource {object} The resource to add
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 */
b5.Scene.prototype.addResource = function(resource, type)
{
	if (type === undefined)
		throw "Resource type not specified";
    var res = b5.Utils.getResFromType(this, type);
    if (res !== null)
    {
        res.push(resource);
        resource.parent = this;
    }
};

/**
 * Removes a resource from this scenes local resource manager
 * @param resource {object} The resource to remove
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 */
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

/**
 * Finds and plays the named timeline animation
 * @param name {string} Name of animation to play
 */
b5.Scene.prototype.playTimeline = function(name)
{
	if (!this.active)
	{
		this.active = true;
		this.visible = true;
	}
    var timeline = this.timelines.find(name);
    if (timeline !== null)
    {
        timeline.restart();
    }
};

/**
 * Creates and adds a task to the scenes task list
 * @param task_name {string} Task name
 * @param delay_start {number} The amount of time to wait in seconds before running the task
 * @param repeats {number} The number of times to run the task before destroying itself
 * @param task_function {function} The function call each time the task is executed
 * @param task_data {any} User data to pass to the task function
 */
b5.Scene.prototype.addTask = function(task_name, delay_start, repeats, task_function, task_data)
{
    this.tasks.add(task_name, delay_start, repeats, task_function, task_data);
};

/**
 * Removes the specified task from the task manager
 * @param task_name {string} Task name
 */
b5.Scene.prototype.removeTask = function(task_name)
{
    this.tasks.remove(task_name);
};


/**
 * Searches the scenes local resource manager for the named resource. If the resource is not found within the scene
 * then the app global resource space will be searched
 * @param name {string} Name of resource to find
 * @param type {string} Type of resource to add (brush, sound, shape, material, bitmap or geometry)
 * @returns {object} The found resource or null if not found
 */
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

/**
 * Checks the scenes resources to see if all preloaded resources have been loaded
 * @returns {boolean} true if all scene preloaded resources have been loaded, otherwise false
 */
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

/**
 * Returns how many resources that are marked as preloaded in this scene still need to be loaded
 * @returns {number} Number of resources that still need to loaded
 */
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

    res = this.fonts;
    count = res.length;
    for (t = 0; t < count; t++)
    {
        if (res[t].preload)
            total++;
    }

    res = this.raw;
    count = res.length;
    for (t = 0; t < count; t++)
    {
        if (res[t].preload)
            total++;
    }

    return total;
};

