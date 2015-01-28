/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// An Actor is a basic game object that carries our game logic and rendering. The base Actor has the following features:
// - Position, size, scale, rotation
// - Absolute (pixel coordinate) and relative (based on size of Actor) origins
// - 3D depth (allows easy parallax scrolling)
// - Angular, linear and depth velocity
// - Box2D physics support (including multiple fixtures and joints)
// - Bitmap frame animation
// - Sprite atlas support
// - Child actor hierarchy
// - Begin, end and move touch events (when touchable is true), also supports event bubbling
// - Canvas edge docking with dock margins
// - Can move in relation to camera or be locked in place
// - Can be made to wrap with scene extents on x and y axis
// - Clip child actors against the extents of the parent with margins and shapes
// - Self clipping against a shape
// - Opacity
// - Actors can be arcs, rectangles, polygons, bitmaps, labels or UI canvases
// - Caching for faster rendering
//
// Supports the following event handlers:
// - onCreate() - Called just after Actor has been created
// - onDestroy() - Called just before Actor is destroyed
// - onTick(delta_time) - Called each time the Actor is updated (every frame)
// - onTapped(touch_pos) - Called when the Actor is tapped / clicked
// - onBeginTouch(touch_pos) - Called if the user begins to touch this actor
// - onEndTouch(touch_pos) - Called when the user stops touching display and this actor was beneath last touch point
// - onLostTouchFocus(touch_pos) - Called if actor was touched on initial begin touch event when the user stops touching display, even if this actor is not under touch point
// - onMoveTouch(touch_pos) - Called when a touch is moved over the Actor
// - onCollisionStart(contact) - Called when the Actor started colliding with another
// - onCollisionEnd(contact) - Called when the Actor stopped colliding with another
//
//// Example showing how to create a basic actor:
//
// var actor = new Actor();
// actor.x = 100;
// actor.y = 100;
// actor.w = 200;
// actor.h = 200;
// actor.bitmap = my_bitmap;
// scene.addActor(actor);   // Add to scene
//
//// Adding a bitmap image to the actor
// bg.bitmap = new Bitmap("background", "images/background.jpg", true);
//
//// Adding a bitmap image from the scene resources to an actor
// bg.bitmap = scene.findResource("background", "bitmap");
//
//// Adding basic physics to a basic actor
//
// actor.initBody("dynamic", false, false);    // Initialise physics body
// actor.addFixture({type: Shape.TypeBox, width: actor.w, height: actor.h}); // Add a physics fixture
//
//// Adding bitmap animation to an actor
// actor.atlas = new ImageAtlas("sheep", new Bitmap("sheep", "images/sheep.png", true)); // Create an image atlas from a bitmap image
// actor.atlas.addFrame(0,0,86,89);     // Add frame 1 to the atlas
// actor.atlas.addFrame(86,0,86,89);    // Add frame 2 to the atlas
// actor.current_frame = 0;             // Set initial animation frame
// actor.frame_speed = 1;               // Set animation playback speed
//
//// Add a child actor
// var child_actor = new Actor();
// actor.addActor(child_actor);
//
//// Add a child actor
// var child_actor = new Actor();    // Create child actor
// actor.addActor(child_actor);      // Add as child actor </pre>
//
//// Adding an onTick event handler to an actor
// Actor.onTick = function(dt) {
//     this.x++;
// };
//// Adding touch event handlers to an actor
//  actor.touchable = true ; // Allow actor to be tested for touches
//  actor.onTapped = function(touch_pos) {
//      console.log("Actor tapped");
//  };
//  actor.onBeginTouch = function(touch_pos) {
//      console.log("Actor touch begin");
//  };
//  actor.onEndTouch = function(touch_pos) {
//      console.log("Actor touch end");
//  };
//  actor.onMoveTouch = function(touch_pos) {
//      console.log("Actor touch move"); </pre>
//  };
//
//// Docking an actor to the edges of the scene
// actor.dock_x = Actor.Dock_Left;
// actor.dock_y = Actor.Dock_Top;
// actor.ignore_camera = true;
//
function Actor(virtual)
{
    // Internal variables
    this.type = Actor.Type_Image;   // Type of actor
    this.scene = null;				// Parent scene
    this.parent = null;				// Parent actor (If null then this actor does not belong to an actor hierarchy)
    this.actors = [];				// Array of child actors
    this.removals = [];             // Array of actors that should be deleted at end of frame
    this.joints = [];				// Array of physics joints that weer created by this actor
    this.timelines = new TimelineManager(); // Actor local animation timelines
    this.frame_count = 0;			// Number of frames that this actor has been running
    this.accum_scale_x = 1;			// Accumulated X scale
    this.accum_scale_y = 1;			// Accumulated Y scale
    this.accum_opacity = 1.0;		// Accumulative opacity
    this.body = null;				// Box2D body
    this.transform = [];			// Current transform
    this.transform_dirty = true;	// If set to true then transforms will be rebuilt next update
    this.touching = false;			// Set to true when user touching
    this.touchmove = false;			// Set to true when touch is moving on this actor
    this.layer = 0;                 // Visible layer (set via property _layers)
    this.order_changed = true;      // Set to true when child actors change order
    this.cache_canvas = null;       // Used to cache rendering

    // Public variables
    this.name = "";					// Name of actor (used to find actors in the scene)
    this.tag = "";					// Tag (used to find groups of actors in the scene)
    this.id = -1;					// User defined ID
    this.active = true;				// Active state, inactive actors will not be updated
    this.visible = true;			// Visible state, invisible actors will not be drawn
    this.touchable = false;			// Touchable state, true if currently touched
    this.layer = 0;					// Actor sorting layer (not currently used)
    this.x = 0;						// X position in scene
    this.y = 0;						// Y position in scene
    this.w = 0;						// Width of actor
    this.h = 0;						// Height of actor
    this.ox = 0;					// X origin (between -1 and 1), if value falls outside that range then origin will be interpreted as pixels
    this.oy = 0;					// Y origin (between -1 and 1), if value falls outside that range then origin will be interpreted as pixels
    this.absolute_origin = true;	// If true then origin will be taken as absolute coordinates, otherwise it will be taken as a proportion of actors size
    this.rotation = 0;				// Rotation in radians
    this.scale_x = 1;				// X scale
    this.scale_y = 1;				// Y scale
    this.depth = 0;					// Z depth (3D depth), 0 represents no depth
    this.opacity = 1.0;				// Opacity (between 0 and 1)
    this.use_parent_opacity = true;	// Scale opacity by parent opacity fi true
    this.current_frame = 0;			// Current bitmap animation frame
    this.frame_speed = 0;			// Bitmap animation playback speed in seconds
    this.anim_frames = null;        // Array of animation frame indices, if not set then frames will be used in order specified in the atlas
    this.bitmap = null;				// Bitmap (used if no atlas defined)
    this.atlas = null;				// Image atlas
    this.vr = 0;					// Rotational velocity (when no body attached)
    this.vx = 0;					// X velocity (when no body attached)
    this.vy = 0;					// Y velocity (when no body attached)
    this.vd = 0;					// Depth velocity, rate at which depth changes
    this.vr_damping = 1;			// Rotational damping (when no body attached)
    this.vx_damping = 1;			// X velocity damping (when no body attached)
    this.vy_damping = 1;			// Y velocity damping (when no body attached)
    this.vd_damping = 1;			// Depth velocity damping
    this.ignore_camera = false;		// If set to true them then this actor will not use camera translation
    this.wrap_position = false;		// If true then actor will wrap at extents of scene
    this.dock_x = 0;				// X-axis docking (0 = none, 1 = left, 2 = right)
    this.dock_y = 0;				// Y-axis docking (0 = none, 1 = top, 2 = bottom)
    this.margin = [0,0,0,0];		// Margin to leave around docked actors [left, right, top, bottom]
    this.bubbling = false;			// If true then touch events will be allowed to bubble up to parents
    this.clip_children = false;		// If set to true then child actors will be clipped against extents of this actor
    this.clip_margin = [0,0,0,0];	// Margin to leave around clipping [left, top, right, bottom]
    this.clip_shape = null;         // Shape to clip this actor and / or its children against
    this.self_clip = false;		    // If set to true then this actor will be clipped against its own clipping shape
    this.orphaned = false;          // If set to true then this actor will not use its parent actors transform, scene transform will be used instead
    this.virtual = false;           // If true then actor will be classed as a container with a virtual canvas that can scroll and stack its content
    this.shadow = false;            // If set to true then shadow will be added to text
    this.shadow_x = 0;              // Shadow x axis offset
    this.shadow_y = 0;              // Shadow y axis offset
    this.shadow_blur = 0;           // Shadow blur
    this.shadow_colour = "#000000"; // Shadow colour
    this.composite_op = null;       // Composite operation
    this.cache = false;             // If true then resource will be rendered to a cached canvas
    this.merge_cache = false;       // If true then resource will be rendered to parent cached canvas

    if (virtual == true)
        this.makeVirtual();
}

Actor.Dock_None = 0;
Actor.Dock_Top = 1;
Actor.Dock_Bottom = 2;
Actor.Dock_Left = 1;
Actor.Dock_Right = 2;

Actor.Type_Image = 0;
Actor.Type_Label = 1;
Actor.Type_Rect = 2;
Actor.Type_Arc = 3;
Actor.Type_Polygon = 4;
Actor.Type_Particle = 5;

//
// Properties
//
Object.defineProperty(Actor.prototype, "_x", {
    get: function() { return this.x; },
    set: function(value) { if (this.x != value) { this.x = value; this.dirty(); } }
});
Object.defineProperty(Actor.prototype, "_y", {
    get: function() { return this.y; },
    set: function(value) { if (this.y != value) { this.y = value; this.dirty(); } }
});
Object.defineProperty(Actor.prototype, "_ox", {
    get: function() { return this.ox; },
    set: function(value) { if (this.ox != value) { this.ox = value; this.dirty(); } }
});
Object.defineProperty(Actor.prototype, "_oy", {
    get: function() { return this.oy; },
    set: function(value) { if (this.oy != value) { this.oy = value; this.dirty(); } }
});
Object.defineProperty(Actor.prototype, "_rotation", {
    get: function() { return this.rotation; },
    set: function(value) { if (this.rotation != value) { this.rotation = value; this.dirty(); } }
});
Object.defineProperty(Actor.prototype, "_scale_x", {
    get: function() { return this.scale_x; },
    set: function(value) { if (this.scale_x != value) { this.scale_x = value; this.dirty(); } }
});
Object.defineProperty(Actor.prototype, "_scale_y", {
    get: function() { return this.scale_y; },
    set: function(value) { if (this.scale_y != value) { this.scale_y = value; this.dirty(); } }
});
Object.defineProperty(Actor.prototype, "_scale", {
    set: function(value) { this._scale_x = value; this._scale_y = value; }
});
Object.defineProperty(Actor.prototype, "_depth", {
    get: function() { return this.depth; },
    set: function(value) { if (this.depth != value) { this.depth = value; this.dirty(); } }
});
Object.defineProperty(Actor.prototype, "_layer", {
    get: function() { return this.layer; },
    set: function(value) { if (this.layer != value) { this.layer = value; if (this.parent != null) this.parent.order_changed = true; else this.scene.order_changed = true; } }
});

Actor.prototype.setPosition = function(x, y)
{
    if (this.x != x || this.y != y)
    {
        this.x = x;
        this.y = y;
        this.dirty();
    }
};
Actor.prototype.setPositionPhysics = function(x, y)
{
    if (this.body != null)
    {
        this.x = x;
        this.y = y;
        this.dirty();
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        var ws = this.scene.world_scale;
        this.body.SetPosition(new b2Vec2(x / ws, y / ws));
    }
};
Actor.prototype.setOrigin = function(x, y)
{
    if (this.ox != x || this.oy != y)
    {
        this.ox = x;
        this.oy = y;
        this.dirty();
    }
};
Actor.prototype.setScale = function(x, y)
{
    if (this.scale_x != x || this.scale_y != y)
    {
        this.scale_x = x;
        this.scale_y = y;
        this.dirty();
    }
};
Actor.prototype.setRotation = function(angle)
{
    if (this.rotation != angle)
    {
        this.rotation = angle;
        this.dirty();
        if (this.body != null)
            this.body.SetAngle(angle);
    }
};
Actor.prototype.setRotationPhysics = function(angle)
{
    if (this.body != null)
    {
        this.rotation = angle;
        this.dirty();
        this.body.SetAngle(angle);
    }
};
Actor.prototype.setDepth = function(depth)
{
    if (this.depth != depth)
    {
        this.depth = depth;
        this.dirty();
    }
};

Actor.prototype.release = function()
{
    if (this.onDestroy !== undefined)
        this.onDestroy();
    this.releaseJoints();
    this.releaseBody();
};

Actor.prototype.destroy = function()
{
    if (this.parent != null)
        this.parent.removeActor(this);
    else
    if (this.scene != null)
        this.scene.removeActor(this);
};

Actor.prototype.changeParent = function(parent)
{
    var acts;
    if (this.parent != null)
        acts = this.parent.actors;
    else
        acts = this.scene.actors;
    var count = acts.length;
    for (var t = 0; t < count; t++)
    {
        if (this == acts[t])
        {
            acts.splice(t, 1);
            parent.addActor(this);
            break;
        }
    }
};


//
// Child actors
//
Actor.prototype.addActor = function(actor)
{
    this.actors.push(actor);
    actor.parent = this;
    actor.scene = this.scene;
    return actor;
};

Actor.prototype.removeActor = function(actor)
{
    this.removals.push(actor);
};

Actor.prototype.removeActorsWithTag = function(tag)
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

Actor.prototype.cleanupDestroyedActors = function()
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

Actor.prototype.findActor = function(name, recursive)
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

Actor.prototype.findFirstParent = function()
{
    var ac = this;
    while (ac !== null)
    {
        if (ac.parent === null)
            return ac;
        ac = ac.parent;
    }
    return null;
};

Actor.prototype.findFirstCachedParent = function()
{
    var ac = this.parent;
    while (ac !== null)
    {
        if (ac.cache_canvas !== null)
            return ac;
        ac = ac.parent;
    }
    return null;
};

Actor.prototype.updateParentTransforms = function()
{
    var parents = [];
    var ac = this;
    while (ac !== null)
    {
        parents.push(ac);
        ac = ac.parent;
    }

    for (var t = parents.length - 1; t >= 0; t--)
        parents[t].updateTransform();
}

Actor.prototype.bringToFront = function()
{
    var acts;
    if (this.parent != null)
        acts = this.parent.actors;
    else
        acts = this.scene.actors;
    var count = acts.length;
    var i = -1;
    for (var t = 0; t < count; t++)
    {
        if (acts[t] == this)
        {
            i = t;
            break;
        }
    }
    if (i >= 0)
    {
        acts.splice(i, 1);
        acts.push(this);
    }
};

Actor.prototype.sendToBack = function()
{
    var acts;
    if (this.parent != null)
        acts = this.parent.actors;
    else
        acts = this.scene.actors;
    var count = acts.length;
    var i = -1;
    for (var t = 0; t < count; t++)
    {
        if (acts[t] == this)
        {
            i = t;
            break;
        }
    }
    if (i >= 0)
    {
        acts.splice(i, 1);
        acts.unshift(this);
    }
};

//
// Touch events
//
Actor.prototype.onBeginTouchBase = function(touch_pos)
{
    this.touching = true;
    // Bubble event to parent if enabled
    if (this.bubbling && this.parent != null)
        this.parent.onBeginTouchBase(touch_pos);
    if (this.onBeginTouch !== undefined)
        this.onBeginTouch(touch_pos);
};
Actor.prototype.onEndTouchBase = function(touch_pos)
{
    if (this.touching && this.onTapped !== undefined)
        this.onTapped(touch_pos);
    this.touching = false;
    this.touchmove = false;
    // Bubble event to parent if enabled
    if (this.bubbling && this.parent != null)
        this.parent.onEndTouchBase(touch_pos);
    if (this.onEndTouch !== undefined)
        this.onEndTouch(touch_pos);
};
Actor.prototype.onMoveTouchBase = function(touch_pos)
{
    this.touchmove = true;
    // Bubble event to parent if enabled
    if (this.bubbling && this.parent != null)
        this.parent.onMoveTouchBase(touch_pos);
    if (this.virtual)
        this.Virtual_onMoveTouch(touch_pos);
    if (this.onMoveTouch !== undefined)
        this.onMoveTouch(touch_pos);
};

//
// Physics
//
Actor.prototype.releaseBody = function()
{
    if (this.body != null)
    {
        this.scene.world.DestroyBody(this.body);
        this.body = null;
    }
};

Actor.prototype.releaseJoints = function()
{
    if (this.body != null)
    {
        for (var t = 0; t < this.joints.length; t++)
            this.scene.world.DestroyJoint(this.joints[t]);
        this.joints = null;
    }
};

Actor.prototype.initBody = function(body_type, fixed_rotation, is_bullet)
{
    if (!this.scene.app.box2d)
        return;
    var scene = this.scene;
    var body_def = new Box2D.Dynamics.b2BodyDef;
    var ws = scene.world_scale;
    if (body_type == "static")
        body_def.type = Box2D.Dynamics.b2Body.b2_staticBody;
    else
    if (body_type == "kinematic")
        body_def.type = Box2D.Dynamics.b2Body.b2_kinematicBody;
    else
        body_def.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
    body_def.position.Set(this.x / ws, this.y / ws);
    body_def.angle = this.rotation;
    body_def.fixedRotation = fixed_rotation;
    body_def.bullet = is_bullet;
    this.body = scene.world.CreateBody(body_def);
    this.body.SetUserData(this);
};

Actor.prototype.addFixture = function(options)
{
    if (this.body == null)
        return null;
    var fix_def;
    var ws = this.scene.world_scale;
    if (options.type == Shape.TypeBox)
    {
        fix_def = new Box2D.Dynamics.b2FixtureDef;
        fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape;
        fix_def.shape.SetAsBox(options.width / (2 * ws), options.height / (2 * ws));
    }
    else if (options.type == Shape.TypeCircle)
    {
        fix_def = new Box2D.Dynamics.b2FixtureDef;
        fix_def.shape = new Box2D.Collision.Shapes.b2CircleShape(options.radius / ws);
    }
    else if (options.type == Shape.TypePolygon)
    {
        if (options.convexPoints !== undefined)
        {
            var fixture_defs = [];
            var pc = options.convexPoints.length;
            for (var s = 0; s < pc; s++)
            {
                fix_def = new Box2D.Dynamics.b2FixtureDef;
                fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape();

                var points = options.convexPoints[s];
                var verts = [];
                var count = points.length;
                for (var t = 0; t < count; t += 2)
                    verts.push({x: points[t] / ws, y: points[t + 1] / ws});
                fix_def.shape.SetAsArray(verts, verts.length);

                if (options.density !== undefined)
                    fix_def.density = options.density;
                if (options.friction !== undefined)
                    fix_def.friction = options.friction;
                if (options.restitution !== undefined)
                    fix_def.restitution = options.restitution;
                if (options.is_sensor !== undefined)
                    fix_def.isSensor = options.is_sensor;
                fixture_defs.push(this.body.CreateFixture(fix_def));
            }
            return fixture_defs;
        }
        else
        {
            fix_def = new Box2D.Dynamics.b2FixtureDef;
            fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape();

            var points = options.points;
            var verts = [];
            var count = points.length;
            for (var t = 0; t < count; t += 2)
                verts.push({x: points[t] / ws, y: points[t + 1] / ws});

            fix_def.shape.SetAsArray(verts, verts.length);
        }
    }
    if (options.density !== undefined)
        fix_def.density = options.density;
    if (options.friction !== undefined)
        fix_def.friction = options.friction;
    if (options.restitution !== undefined)
        fix_def.restitution = options.restitution;
    if (options.is_sensor !== undefined)
        fix_def.isSensor = options.is_sensor;
    return this.body.CreateFixture(fix_def);
};

Actor.prototype.addJoint = function(options)
{
    if (this.body == null)
        return null;
    var joint_def;
    var scene = this.scene;
    var world = scene.world;
    var ws = scene.world_scale;
    var b2Vec2 = Box2D.Common.Math.b2Vec2;
    var body_a = this.body;
    var body_b = options.actor_b.body;
    var body_a_centre = body_a.GetWorldCenter();
    var body_b_centre = body_b.GetWorldCenter();
    var lpa = new b2Vec2(body_a_centre.x, body_a_centre.y);
    lpa.x += options.anchor_a.x / ws;
    lpa.y += options.anchor_a.y / ws;
    var lpb = new b2Vec2(body_b_centre.x, body_b_centre.y);
    lpb.x += options.anchor_b.x / ws;
    lpb.y += options.anchor_b.y / ws;
    if (options.type == "weld")
    {
        joint_def = new Box2D.Dynamics.Joints.b2WeldJointDef;
        joint_def.Initialize(body_a, body_b, lpa);
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
        joint_def.collideConnected = options.self_collide;
    }
    else if (options.type == "distance")
    {
        joint_def = new Box2D.Dynamics.Joints.b2DistanceJointDef;
        joint_def.Initialize(body_a, body_b, lpa, lpb);
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
        joint_def.collideConnected = options.self_collide;
        joint_def.frequencyHz = options.frequency;
        joint_def.dampingRatio = options.damping;
    }
    else if (options.type == "revolute")
    {
        joint_def = new Box2D.Dynamics.Joints.b2RevoluteJointDef;
        joint_def.Initialize(body_a, body_b, lpa);
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
        joint_def.collideConnected = options.self_collide;

        if (options.limit_joint)
        {
            joint_def.enableLimit = true;
            joint_def.lowerAngle = options.lower_limit * (Math.PI / 180);
            joint_def.upperAngle = options.upper_limit * (Math.PI / 180);
        }
        if (options.motor_enabled)
        {
            joint_def.enableMotor = true;
            joint_def.motorSpeed = options.motor_speed;
            joint_def.maxMotorTorque = options.max_motor_torque;
        }
    }
    else if (options.type == "prismatic")
    {
        joint_def = new Box2D.Dynamics.Joints.b2PrismaticJointDef;
        joint_def.Initialize(body_a, body_b, lpa, new b2Vec2(options.axis.x, options.axis.y));
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
        joint_def.collideConnected = options.self_collide;

        if (options.limit_joint)
        {
            joint_def.enableLimit = true;
            joint_def.lowerTranslation = options.lower_limit / ws;
            joint_def.upperTranslation = options.upper_limit / ws;
        }
        if (options.motor_enabled)
        {
            joint_def.enableMotor = true;
            joint_def.motorSpeed = options.motor_speed;
            joint_def.maxMotorForce = options.max_motor_force;
        }
    }
    else if (options.type == "pulley")
    {
        var ga = new b2Vec2(body_a_centre.x, body_a_centre.y);
        ga.x += options.ground_a.x / ws;
        ga.y += options.ground_a.y / ws;
        var gb = new b2Vec2(body_b_centre.x, body_b_centre.y);
        gb.x += options.ground_b.x / ws;
        gb.y += options.ground_b.y / ws;
        joint_def = new Box2D.Dynamics.Joints.b2PulleyJointDef;
        joint_def.Initialize(body_a, body_b, ga, gb, lpa, lpb, options.ratio);
        joint_def.collideConnected = options.self_collide;
    }
    else if (options.type == "wheel")
    {
        joint_def = new Box2D.Dynamics.Joints.b2LineJointDef;
        joint_def.Initialize(body_a, body_b, lpa, options.axis);
        joint_def.collideConnected = options.self_collide;

        if (options.limit_joint)
        {
            joint_def.enableLimit = true;
            joint_def.lowerTranslation = options.lower_limit / ws;
            joint_def.upperTranslation = options.upper_limit / ws;
        }
        if (options.motor_enabled)
        {
            joint_def.enableMotor = true;
            joint_def.motorSpeed = options.motor_speed;
            joint_def.maxMotorForce  = options.max_motor_force;
        }
    }
    else if (options.type == "mouse")
    {
        joint_def = new Box2D.Dynamics.Joints.b2MouseJointDef;
        joint_def.collideConnected = options.self_collide;
        joint_def.bodyA = body_a;
        joint_def.bodyB = body_b;
        joint_def.collideConnected = options.self_collide;
        joint_def.maxForce = options.max_motor_force;
        joint_def.dampingRatio = options.damping;
    }

    var joint = world.CreateJoint(joint_def);
    this.joints.push(joint);
    return joint;
};

Actor.prototype.removeJoint = function(joint)
{
    var joints = this.joints;
    var count = joints.length;
    for (var t = 0; t < count; t++)
    {
        if (joints[t] == joint)
        {
            world.DestroyJoint(joint);
            joints.splice(t, 1);
            return;
        }
    }
};

//
// Transform update
//
Actor.prototype.updateTransform = function()
{
    var trans = this.transform;
    if (this.transform_dirty)
    {
        var scene = this.scene;
        var r = this.rotation;
        var sx = this.scale_x;
        var sy = this.scale_y;
        var parent = this.parent;
        if (parent == null || this.orphaned)
        {
            this.accum_scale_x = sx;
            this.accum_scale_y = sy;
        }
        else
        {
            this.accum_scale_x = sx * parent.accum_scale_x;
            this.accum_scale_y = sy * parent.accum_scale_y;
        }
        var cos = Math.cos(r);
        var sin = Math.sin(r);
        if (this.depth != 0 && this.depth != 1)
        {
            var ooa = 1 / this.depth;
            sx *= ooa;
            sy *= ooa;
            trans[4] = (this.x - scene.camera_x) * ooa;
            trans[5] = (this.y - scene.camera_y) * ooa;
        }
        else
        {
            this.transform_dirty = false;
            trans[4] = this.x;
            trans[5] = this.y;
        }
        trans[0] = cos * sx;
        trans[1] = sin * sx;
        trans[2] = -sin * sy;
        trans[3] = cos * sy;
        // APply origin
        var ox = this.ox;
        var oy = this.oy;
        if (ox != 0 || oy != 0)
        {
            if (!this.absolute_origin)
            {
                ox *= this.w;
                oy *= this.h;
            }
            var pre_mat = [1, 0, 0, 1, -ox, -oy];
            Maths.preMulMatrix(trans, pre_mat);
        }
    }

//		[0][2][4]		[0][2][4]
//		[1][3][5]		[1][3][5]
//		[x][x][1]		[x][x][1]
    if (parent != null && !this.orphaned)
    {
        Maths.mulMatrix(trans, parent.transform);
    }
};

//
// Rendering
//
Actor.prototype.draw = function()
{
    if (!this.visible)
        return;

    if (this.cache)
    {
        this.drawToCache();
        this.cache = false;
    }
    if (this.merge_cache)   // If merged into parent cache then parent will have drawn so no need to draw again
        return;

    var cache = this.cache_canvas;
    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var disp = app.display;
    var context = disp.context;	// The rendering context
    this.preDraw(context);

    // Get source image coordinates from the atlas
    if (cache === null)
    {
        var src = null;
        var atlas = this.atlas;
        if (atlas != null)
        {
            if (this.anim_frames != null)
                src = atlas.getFrame(this.anim_frames[this.current_frame << 0]);
            else
                src = atlas.getFrame(this.current_frame << 0);
        }
    }
    var mx = app.canvas_cx + this.scene.x * dscale;
    var my = app.canvas_cy + this.scene.y * dscale;
    var cx = this.w / 2;
    var cy = this.h / 2;
    cx = (cx + 0.5) << 0;	// Make int
    cy = (cy + 0.5) << 0;	// Make int

    if (!this.ignore_camera && (this.depth == 0 || this.depth == 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.updateTransform();
    var trans = this.transform;
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    context.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4] * dscale + mx, trans[5] * dscale + my);

    if (self_clip)
        this.setClipping(context, -cx, -cy);

    if (cache === null)
    {
        if (atlas != null)
            context.drawImage(atlas.bitmap.image, src.x, src.y, src.w, src.h, -cx, -cy, this.w + 1, this.h + 1);	// +1 closes small gaps
        else
        if (this.bitmap != null)
            context.drawImage(this.bitmap.image, -cx, -cy, this.w, this.h);
    }
    else
        context.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw(context);

    if (clip_children)
    {
        if (!self_clip)
            this.setClipping(context, -cx, -cy);
    }
    else
    if (self_clip)
        context.restore();

    // Draw child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }
    if (clip_children)
        context.restore();
};
Actor.prototype.drawToCache = function()
{
    var cache = null;

    var ox = 0;
    var oy = 0;
    if (this.merge_cache)
    {
        var parent = this.findFirstCachedParent();
        if (parent !== null)
        {
            cache = parent.cache_canvas;
            ox = this.x + cache.width / 2 - this.w/2;
            oy = this.y + cache.height / 2 - this.h/2;
        }
    }
    if (cache === null)
    {
        cache = document.createElement("canvas");
        cache.width = this.w;
        cache.height = this.h;
    }

    // Render the actor
    var context = cache.getContext("2d");	// The rendering context

    // Get source image coordinates from the atlas
    var src = null;
    var atlas = this.atlas;
    if (atlas != null)
    {
        if (this.anim_frames != null)
            src = atlas.getFrame(this.anim_frames[this.current_frame << 0]);
        else
            src = atlas.getFrame(this.current_frame << 0);
    }

    if (atlas != null)
        context.drawImage(atlas.bitmap.image, src.x, src.y, src.w, src.h, ox, oy, this.w, this.h);
    else
    if (this.bitmap != null)
        context.drawImage(this.bitmap.image, ox, oy, this.w, this.h);

    this.cache_canvas = cache;
};
Actor.prototype.preDraw = function(context)
{
    if (this.parent == null || !this.use_parent_opacity)
        this.accum_opacity = this.opacity * this.scene.opacity;
    else
        this.accum_opacity = this.parent.accum_opacity * this.opacity;
    context.globalAlpha = this.accum_opacity;

    if (this.shadow)
    {
        context.shadowOffsetX = this.shadow_x;
        context.shadowOffsetY = this.shadow_y;
        context.shadowColor = this.shadow_colour;
        context.shadowBlur = this.shadow_blur;
    }
    if (this.composite_op != null)
        context.globalCompositeOperation = this.composite_op;
};
Actor.prototype.postDraw = function(context)
{
    if (this.shadow) context.shadowColor = "transparent";
    if (this.composite_op != null)
        context.globalCompositeOperation = "source-over";
};
//
// Update
//
Actor.prototype.baseUpdate = function(dt)
{
    if (!this.active)
        return false;

    if (this.onTick !== undefined)
        this.onTick(dt);

    this.timelines.update(dt);

    if (this.virtual)
        this.Virtual_update(dt);

    var scene = this.scene;

    // Update the frame
    if (this.atlas != null)
    {
        this.current_frame += this.frame_speed * dt;
        var max;
        if (this.anim_frames != null)
            max = this.anim_frames.length;
        else
            max = this.atlas.getMaxFrames();
        while (this.current_frame >= max)
            this.current_frame -= max;
    }
    // Update from physics
    if (this.body != null)
    {
        var pos = this.body.GetPosition();
        var ws = scene.world_scale;
        this.setRotation(this.body.GetAngle());
        this.setPosition(pos.x * ws, pos.y * ws);
    }
    else
    {
        // Apply velocities
        if (this.vr != 0 || this.vx != 0 || this.vy != 0)
            this.dirty();
        this.rotation += this.vr * dt;
        this.vr *= this.vr_damping;
        this.x += this.vx * dt;
        this.vx *= this.vx_damping;
        this.y += this.vy * dt;
        this.vy *= this.vy_damping;
    }
    if (this.vd != 0)
    {
        this.depth += this.vd * dt;
        this.vd *= this.vd_damping;
    }

    if (this.wrap_position)
    {
        // Wrap position with extents of scene
        var left = scene.extents[0];
        var right = (left + scene.extents[2]);
        var top = scene.extents[1];
        var bottom = (top + scene.extents[3]);
        if (this.x < left)
            this.x = right;
        else if (this.x > right)
            this.x = left;
        if (this.y < top)
            this.y = bottom;
        else if (this.y > bottom)
            this.y = top;
    }

    // Apply docking
    if (this.parent == null || !this.parent.virtual)
    {
        if (this.dock_x != 0)
        {
            if (this.dock_x === Actor.Dock_Left)
                this.x = -scene.w / 2 + (this.w * this.scale_x)/ 2 + this.margin[0];
            else if (this.dock_x === Actor.Dock_Right)
                this.x = scene.w / 2 - (this.w * this.scale_x) / 2 - this.margin[1];
        }
        if (this.dock_y != 0)
        {
            if (this.dock_y === Actor.Dock_Top)
                this.y = -scene.h / 2 + (this.h * this.scale_y) / 2 + this.margin[2];
            else if (this.dock_y === Actor.Dock_Bottom)
                this.y = scene.h / 2 - (this.h * this.scale_y) / 2 - this.margin[3];
        }
    }

    // Update child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].update(dt);
    }

    this.cleanupDestroyedActors();

    // Re-sort actors if layers changed
    if (this.order_changed)
    {
        this.order_changed = false;
        Utils.sortLayers(this.actors);
    }


    this.frame_count++;
};

Actor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

Actor.prototype.updateToPhysics = function()
{
    if (this.body == null)
        return;
    var b2Vec2 = Box2D.Common.Math.b2Vec2;
    this.body.SetLinearVelocity(new b2Vec2(this.vx, this.vy));
    this.body.SetAngularVelocity(this.vr);
    this.body.SetAwake(true);
};

Actor.prototype.dirty = function()
{
    this.transform_dirty = true;
    var a = this.actors;
    var count = a.length;
    for (var t = 0; t < count; t++)
        a[t].dirty();
};

//
// Virtual canvas
//
Actor.prototype.makeVirtual = function()
{
    this.prev_scroll_pos_x = 0;				// Previous canvas scroll X position
    this.prev_scroll_pos_y = 0;				// Previous canvas scroll Y position
    this.scroll_pos_x = 0;					// Canvas scroll X position
    this.scroll_pos_y = 0;					// Canvas scroll Y position
    this.scroll_vx = 0;						// Canvas scroll X velocity
    this.scroll_vy = 0;						// Canvas scroll Y velocity
    this.scroll_range = [0,0,0,0];			// Scrollable range of canvas (left, top, width, height)
    this.virtual = true;
};

Actor.prototype.Virtual_onMoveTouch = function(touch_pos)
{
    if (this.touching && (this.scroll_range[2] != 0 || this.scroll_range[3] != 0))
    {
        var app = this.scene.app;
        this.prev_scroll_pos_x = this.scroll_pos_x;
        this.prev_scroll_pos_y = this.scroll_pos_y;
        this.scroll_vx = app.touch_drag_x;
        this.scroll_pos_x += app.touch_drag_x;
        this.scroll_vy = app.touch_drag_y;
        this.scroll_pos_y += app.touch_drag_y;
        if (this.scroll_vx != 0 || this.scroll_vy != 0)
        {
            this.Virtual_scrollRangeCheck();
            this.Virtual_updateLayout();
        }
    }
};

Actor.prototype.Virtual_update = function(dt)
{
    var layout_dirty = false;

    if (!this.touching)
    {
        this.prev_scroll_pos_x = this.scroll_pos_x;
        this.prev_scroll_pos_y = this.scroll_pos_y;
        this.scroll_pos_x += this.scroll_vx;
        this.scroll_pos_y += this.scroll_vy;
        if (this.scroll_vx != 0 || this.scroll_vy != 0)
        {
            this.Virtual_scrollRangeCheck();
            this.Virtual_updateLayout();
        }
        this.scroll_vx *= 0.9;
        this.scroll_vy *= 0.9;
        if (this.scroll_vx > -0.5 && this.scroll_vx < 0.5)
            this.scroll_vx = 0;
        if (this.scroll_vy > -0.5 && this.scroll_vy < 0.5)
            this.scroll_vy = 0;
    }
    if (this.frame_count == 0)
        this.Virtual_updateLayout();
};

Actor.prototype.Virtual_scrollRangeCheck = function()
{
    // Prevent from moving outside extents
    // Note that scroll position is inverted
    var x = this.scroll_pos_x;
    var y = this.scroll_pos_y;
    var left = -this.scroll_range[0];
    var right = left - this.scroll_range[2];
    var top = -this.scroll_range[1];
    var bottom = top - this.scroll_range[3];
    if (x < right)
    {
        x = right;
        this.scroll_vx = 0;
    }
    else if (x > left)
    {
        x = left;
        this.scroll_vx = 0;
    }
    if (y < bottom)
    {
        y = bottom;
        this.scroll_vy = 0;
    }
    else if (y > top)
    {
        y = top;
        this.scroll_vy = 0;
    }
    this.scroll_pos_x = x;
    this.scroll_pos_y = y;
};


Actor.prototype.Virtual_updateLayout = function(dt)
{
    var dx = this.prev_scroll_pos_x - this.scroll_pos_x;
    var dy = this.prev_scroll_pos_y - this.scroll_pos_y;
    // Update child actors
    var count = this.actors.length;
    var w = this.w * this.scale_x / 2;
    var h = this.h * this.scale_y / 2;
    if (count > 0)
    {
        var act;
        var acts = this.actors;
        for (var t = 0; t < count; t++)
        {
            act = acts[t];
            // Apply docking
            if (act.dock_x != 0)
            {
                if (act.dock_x == Actor.Dock_Left)
                    act.x = -w + act.w * act.scale_x / 2 + act.margin[0];
                else if (act.dock_x == Actor.Dock_Right)
                    act.x = w - act.w * act.scale_x / 2 - act.margin[1];
            }
            else
                act.x += dx;
            if (act.dock_y != 0)
            {
                if (act.dock_y == Actor.Dock_Top)
                    act.y = -h + act.h * act.scale_y / 2 + act.margin[2];
                else if (act.dock_y == Actor.Dock_Bottom)
                    act.y = h - act.h * act.scale_y / 2 - act.margin[3];
            }
            else
                act.y += dy;
            act.dirty();
        }
    }
};

//
// Hit test
//
// NOTE: This function does not work with actors that have been rotated around any point
// except their centre, also does not work with actors that have depth
Actor.prototype.hitTest = function(position)
{
    if (!this.touchable)
        return null;

    // Check child actors
    var count = this.actors.length;
    var act;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
        {
            act = acts[t].hitTest(position);
            if (act != null)
                return act;
        }
    }

    var scene = this.scene;
    var trans = this.transform;
    var cx = trans[4] + scene.x;
    var cy = trans[5] + scene.y;
    if (!this.ignore_camera)
    {
        cx -= scene.camera_x;
        cy -= scene.camera_y;
    }
    var sx = this.accum_scale_x;
    var sy = this.accum_scale_y;
    var px = (position.x - cx) / sx;
    var py = (position.y - cy) / sy;
    var tx = px * trans[0] + py * trans[1];
    var ty = px * trans[2] + py * trans[3];
    var hw = (this.w * sx) / 2;
    var hh = (this.h * sy) / 2;
    if (tx >= -hw && tx <= hw && ty >= -hh && ty <= hh)
        return this;

    return null;
};

Actor.prototype.transformPoint = function(x, y)
{
    return Maths.vecMulMatrix(x, y, this.transform);
};

Actor.prototype.setClipping = function(context, x, y)
{
    context.save();
    context.beginPath();

    var clip_margin = this.clip_margin;
    var shape = this.clip_shape;
    if (shape == null)
    {
        var type = this.type;
        if (type == Actor.Type_Arc)
            context.arc(0,0, this.radius, 0, 2 * Math.PI);
        else
        if (type == Actor.Type_Polygon)
        {
            context.beginPath();
            var points = this.points;
            var count = points.length;
            context.moveTo(points[0], points[1]);
            for (var i = 2; i < count; i += 2)
                context.lineTo(points[i], points[i + 1]);
            context.closePath();
        }
        else
            context.rect(x + clip_margin[0], y + clip_margin[1], this.w - clip_margin[2] - clip_margin[0], this.h - clip_margin[3] - clip_margin[1]);
    }
    else
    {
        var type = shape.type;
        if (type == Shape.TypeBox)
            context.rect(x + clip_margin[0], y + clip_margin[1], shape.width - clip_margin[2] - clip_margin[0], shape.height - clip_margin[3] - clip_margin[1]);
        else
        if (type == Shape.TypeCircle)
            context.arc(0,0, shape.width, 0, 2 * Math.PI, false);
        else
        if (type == Shape.TypePolygon)
        {
            var points = shape.vertices;
            var count = points.length;
            context.moveTo(points[0], points[1]);
            for (var i = 2; i < count; i += 2)
                context.lineTo(points[i], points[i + 1]);
            context.closePath();
        }
    }
    context.clip();
};

//
// Basic test to see if actors overlap (no scaling, rotation, origin or shape currently taken into account)
//
Actor.prototype.overlaps = function(other)
{
    var w1 = this.w;
    var h1 = this.h;
    var w2 = other.w;
    var h2 = other.h;
    var x1 = this.x - w1 / 2;
    var y1 = this.y - h1 / 2;
    var x2 = other.x - w2 / 2;
    var y2 = other.y - h2 / 2;

    return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 > x2 + w2) || (x1 + w1 < x2));
}