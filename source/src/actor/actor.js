/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * An Actor is a basic game object that carries our game logic and rendering. The base Actor has the following features:
 *
 * - Position, size, scale, rotation
 * - Absolute (pixel coordinate) and relative (based on visible size) origins
 * - Layering
 * - Support for cached rendering
 * - 3D depth (allows easy parallax scrolling)
 * - Angular, linear and depth velocity
 * - Box2D physics support (including multiple fixtures and joints)
 * - Bitmap frame animation
 * - Timeline animation manager
 * - Actions list manager
 * - Tasks manager
 * - Sprite atlas support
 * - Child hierarchy
 * - Angular gradient fills
 * - Shadows
 * - Composite operations
 * - Begin, end and move touch events (when touchable is true), also supports event bubbling
 * - Canvas edge docking with dock margins
 * - Can move in relation to camera or be locked in place
 * - Can be made to wrap with scene extents on x and y axis
 * - Clip children against the extents of the parent with margins and shapes
 * - Supports opacity
 * - Can be represented visually by arcs, rectangles, polygons, bitmaps and labels
 * - Support for a virtual canvas that can scroll content around
 *
 * Supports the following event handlers:
 *
 * - onCreate() - Called just after Actor has been created (only called from Xoml)
 * - onDestroy() - Called just before Actor is destroyed
 * - onTick(delta_time) - Called each time the Actor is updated (every frame)
 * - onTapped(touch_pos) - Called when the Actor is tapped / clicked
 * - onBeginTouch(touch_pos) - Called if the user begins to touch this actor
 * - onEndTouch(touch_pos) - Called when the user stops touching display and this actor was beneath last touch point
 * - onLostTouchFocus(touch_pos) - Called if actor was touched on initial begin touch event when the user stops touching display, even if this actor is not under touch point
 * - onMoveTouch(touch_pos) - Called when a touch is moved over the Actor
 * - onHover(touch_pos) - Called if the user hovers over this actor
 * - onHoverEnd(touch_pos) - Called if the user stops hovering over this actor
 * - onCollisionStart(contact) - Called when the Actor started colliding with another
 * - onCollisionEnd(contact) - Called when the Actor stopped colliding with another
 * - onAVChanged(visible) - Called when the active-visible state of an actor changes via the _av property
 *
 * For an actor to be processed and rendered you must add it to a added to a {@link b5.Scene} or another {@link b5.Actor}
 * that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 *
 * Example showing how to create a basic actor:
 *
 *      var actor = new b5.Actor();
 *      actor.x = 100;
 *      actor.y = 100;
 *      actor.w = 200;
 *      actor.h = 200;
 *      actor.bitmap = my_bitmap;
 *      scene.addActor(actor);   // Add to scene
 *
 * Adding a bitmap image to the actor example
 *
 *      bg.bitmap = new b5.Bitmap("background", "images/background.jpg", true);
 *
 * Adding a bitmap image from the scene resources to an actor example
 *
 *      bg.bitmap = scene.findResource("background", "bitmap");
 *
 * Adding basic physics to a basic actor example
 *
 *      actor.initBody("dynamic", false, false);    // Initialise physics body
 *      actor.addFixture({type: Shape.TypeBox, width: actor.w, height: actor.h}); // Add a physics fixture
 *
 * Adding bitmap animation to an actor example
 *
 *      actor.atlas = new b5.ImageAtlas("sheep", new b5.Bitmap("sheep", "images/sheep.png", true)); // Create an image atlas from a bitmap image
 *      actor.atlas.addFrame(0,0,86,89);     // Add frame 1 to the atlas
 *      actor.atlas.addFrame(86,0,86,89);    // Add frame 2 to the atlas
 *      actor.current_frame = 0;             // Set initial animation frame
 *      actor.frame_speed = 1;               // Set animation playback speed
 *
 * Adding collection of bitmap animation to an actor example
 *
 *      actor.atlas = new ImageAtlas("sheep", new Bitmap("sheep", "images/sheep.png", true));
 *      actor.atlas.addFrame(0,0,32,32,0,0);    // Add frame 1 to the atlas
 *      actor.atlas.addFrame(32,0,32,32,0,0);   // Add frame 2 to the atlas
 *      actor.atlas.addFrame(64,0,32,32,0,0);   // Add frame 3 to the atlas
 *      actor.atlas.addFrame(96,0,32,32,0,0);   // Add frame 4 to the atlas
 *      actor.atlas.addFrame(128,0,32,32,0,0);   // Add frame 5 to the atlas
 *      actor.atlas.addFrame(160,0,32,32,0,0);   // Add frame 6 to the atlas
 *      actor.atlas.addAnim("walk", [0, 1, 2, 3], 10);
 *      actor.atlas.addAnim("idle", [4, 5], 10);
 *      actor.playAnim("walk");
 * 
 * Add a child actor example
 *
 *      var child_actor = new b5.Actor();
 *      actor.addActor(child_actor);
 *
 * Adding an onTick event handler to an actor example
 *
 *      Actor.onTick = function(dt) {
 *          this.x++;
 *      };
 *
 * Adding touch event handlers to an actor example
 *
 *      actor.touchable = true ; // Allow actor to be tested for touches
 *      actor.onTapped = function(touch_pos) {
 *          console.log("Actor tapped");
 *      };
 *      actor.onBeginTouch = function(touch_pos) {
 *          console.log("Actor touch begin");
 *      };
 *      actor.onEndTouch = function(touch_pos) {
 *          console.log("Actor touch end");
 *      };
 *      actor.onMoveTouch = function(touch_pos) {
 *          console.log("Actor touch move");
 *      };
 *
 * Docking an actor to the edges of the scene example
 *
 *      actor.dock_x = Actor.Dock_Left;
 *      actor.dock_y = Actor.Dock_Top;
 *      actor.ignore_camera = true;
 *
 * Self clipped actor example
 *
 *      // Create a clip shape
 *      var shape = new b5.Shape();
 *      shape.type = b5.Shape.TypePolygon;
 *      shape.vertices = [0, -20, 20, 20, -20, 20];
 *
 *      // Set clip shape and enable self clipping
 *      actor.self_clip = true;
 *      actor.clip_shape = shape;
 *
 * Adding a physics joint example
 *
 *      actor1.addJoint({ type: "weld", actor_b: actor2, anchor_a: { x: 0, y: 0 }, anchor_b: { x: 0, y: 0 }, self_collide: true });
 *
 * Handling collision example
 *
 *      actor1.onCollisionStart = function (contact) {
 *           var actor1 = contact.GetFixtureA().GetBody().GetUserData();
 *           var actor2 = contact.GetFixtureB().GetBody().GetUserData();
 *           console.log(actor1.name + " hit " + actor2.name);
 *      };
 *
 * Apply force and torque example
 *
 *      var b2Vec2 = Box2D.Common.Math.b2Vec2;
 *      var pos = actor.body.GetWorldPoint(new b2Vec2(0,0));
 *      actor.body.ApplyForce(new b2Vec2(fx, fy), pos);
 *
 * Changing velocity and applying impulses example
 *
 *      var b2Vec2 = Box2D.Common.Math.b2Vec2;
 *      actor.body.SetLinearVelocity(new b2Vec2(vx, vy));
 *      actor.body.SetAngularVelocity(vr);
 *      actor.body.ApplyImpulse(new b2Vec2(ix, iy), pos);
 *
 * Creating and adding a timeline animation example
 *
 *      // Create a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and using
 *      // QuarticIn easing to ease between each frame
 *      var timeline = new b5.Timeline(my_object, "_x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [b5.Ease.quartin, b5.Ease.quartin, b5.Ease.quartin]);
 *      my_object.timelines.add(timeline); // Add to timeline manager to be processed
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.Actor
 * @param virtual {boolean} If true then this Actor will support a virtual scrollable canvas
 * @constructor
 * @returns {b5.Actor} The created Actor
 *
 * @property {number}                   type                - Type of actor (internal)
 * @property {b5.Scene}                 scene               - Parent scene (internal)
 * @property {b5.Actor}                 parent              - Parent actor (If null then this actor does not belong to an actor hierarchy) (internal)
 * @property {b5.Actor[]}               actors              - Array of child actors (internal)
 * @property {b5.Actor[]}               removals            - Array of actors that should be deleted at end of frame (internal)
 * @property {object[]}                 joints              - Array of Box2D physics joints that weer created by this actor (internal)
 * @property {b5.TimelineManager}       timelines           - Actor local animation timelines (internal)
 * @property {b5.ActionsListManager}    actions             - Actions list manager (internal)
 * @property {b5.TasksManager}          tasks               - Tasks manager (internal)
 * @property {number}                   frame_count         - Number of frames that this actor has been running (internal)
 * @property {number}                   accum_scale_x       - Accumulated X scale (internal)
 * @property {number}                   accum_scale_y       - Accumulated Y scale (internal)
 * @property {number}                   accum_opacity       - Accumulative opacity (internal)
 * @property {Box2DBody}                body                - Box2D body (null if none attached) (internal)
 * @property {number[]}                 transform           - Current visual transform (internal)
 * @property {boolean}                  transform_dirty     - If set to true then transforms will be rebuilt next update (internal)
 * @property {boolean}                  touching            - Set to true when user touching (internal)
 * @property {boolean}                  touchmove           - Set to true when touch is moving on this actor (internal)
 * @property {number}                   layer               - Visible layer (set via property _layers) (internal)
 * @property {boolean}                  order_changed       - Set to true when child actors change order (internal)
 * @property {Canvas}                   cache_canvas        - The HTML5 Canvas object that is used to cache rendering (internal)

 * @property {string}                   name                - Name of actor (used to find actors in the scene)
 * @property {string}                   tag                 - Tag (used to find groups of actors in the scene)
 * @property {number}                   id                  - User defined ID (default is -1)
 * @property {boolean}                  active              - Active state, inactive actors will not be updated (default is true)
 * @property {boolean}                  visible             - Visible state, invisible actors will not be drawn (default is true)
 * @property {boolean}                  touchable           - If true then can be touched (default false)
 * @property {boolean}                  hit           		- If true then will be included io hit testing (default true)
 * @property {number}                   layer               - Actor sorting layer, set via _layer (default is 0)
 * @property {number}                   x                   - X position in scene, set via _x (default is 0)
 * @property {number}                   y                   - Y position in scene, set via _y (default is 0)
 * @property {number}                   w                   - Width of actor (default is 0)
 * @property {number}                   h                   - Height of actor (default is 0)
 * @property {number}                   ox                  - X origin (between -1 and 1), set via _ox, if value falls outside that range then origin will be interpreted as pixels (default is 0)
 * @property {number}                   oy                  - Y origin (between -1 and 1), set via _oy, if value falls outside that range then origin will be interpreted as pixels (default is 0)
 * @property {boolean}                  ignore_atlas_size   - If true then the actor will not change size top match the size of the sub image from the atlas
 * @property {boolean}                  absolute_origin     - If true then origin will be taken as absolute coordinates, otherwise it will be taken as a proportion of actors size (default is true)
 * @property {number}                   rotation            - Rotation in radians, set via _rotation (default is 0)
 * @property {number}                   scale_x             - X scale, set via _scale_x or _scale (default is 1)
 * @property {number}                   scale_y             - Y scale, set via _scale_y or _scale (default is 1)
 * @property {number}                   depth               - Z depth (3D depth), set via _depth, 0 represents no depth  (default is 0)
 * @property {number}                   opacity             - Opacity (between 0 and 1) (default is 1)
 * @property {boolean}                  use_parent_opacity  - Scale opacity by parent opacity if true  (default is true)
 * @property {number}                   current_frame       - Current bitmap animation frame  (default is 0)
 * @property {number}                   frame_speed         - Bitmap animation playback speed in seconds  (default is 0)
 * @property {number[]}                 anim_frames         - Array of animation frame indices, if not set then frames will be used in order specified in the atlas  (default is null)
 * @property {boolean}                  frames_repeat       - True if the bitmap animation should repeat
 * @property {b5.Bitmap}                bitmap              - Bitmap (used if no atlas defined), if set via _bitmap then instance of bitmap or string based path to bitmap can be used (default is null)
 * @property {b5.ImageAtlas}            atlas               - Image atlas, if set via _bitmap then instance of atlas or string based path to atlas can be used (default is null)
 * @property {number}                   vr                  - Rotational velocity (when no body attached) (default is 0)
 * @property {number}                   vx                  - X velocity (when no body attached) (default is 0)
 * @property {number}                   vy                  - Y velocity (when no body attached) (default is 0)
 * @property {number}                   vd                  - Depth velocity, rate at which depth changes (default is 0)
 * @property {number}                   vr_damping          - Rotational damping (when no body attached) (default is 1)
 * @property {number}                   vx_damping          - X velocity damping (when no body attached) (default is 1)
 * @property {number}                   vy_damping          - Y velocity damping (when no body attached) (default is 1)
 * @property {number}                   vd_damping          - Depth velocity damping (default is 1)
 * @property {boolean}                  ignore_camera       - If set to true them then this actor will not use camera translation (default is false)
 * @property {boolean}                  wrap_position       - If true then actor will wrap at extents of scene (default is false)
 * @property {number}                   dock_x              - X-axis docking (0 = none, 1 = left, 2 = right) (default is 0)
 * @property {number}                   dock_y              - Y-axis docking (0 = none, 1 = top, 2 = bottom) (default is 0)
 * @property {number}                   dock_screen         - If true then docking will be to screen edge instead of scene edge
 * @property {number[]}                 margin              - Margin to leave around docked actors [left, right, top, bottom] (default is [0,0,0,0])
 * @property {boolean}                  bubbling            - If true then touch events will be allowed to bubble up to parents (default is false)
 * @property {boolean}                  clip_children       - If set to true then child actors will be clipped against extents of this actor (default is false)
 * @property {number[]}                 clip_margin         - Margin to leave around clipping [left, top, right, bottom] (default is [0,0,0,0])
 * @property {b5.Shape}                 clip_shape          - Shape to clip this actor and / or its children against, if set via _clip_shape then instance of shape or string based path to shape can be used (default is null)
 * @property {boolean}                  self_clip           - If set to true then this actor will be clipped against its own clipping shape (default is false)
 * @property {boolean}                  orphaned            - If set to true then this actor will not use its parent actors transform, scene transform will be used instead (default is false)
 * @property {boolean}                  virtual             - If true then actor will be classed as a container with a virtual canvas that can scroll and stack its content (default is false)
 * @property {boolean}                  clip_virtual        - f true then children with virtual actors will be clipped by rect
 * @property {boolean}                  shadow              - If set to true then shadow will be added to text (default is false)
 * @property {number}                   shadow_x            - Shadow x axis offset (default is 0)
 * @property {number}                   shadow_y            - Shadow y axis offset (default is 0)
 * @property {number}                   shadow_blur         - Shadow blur (default is 0)
 * @property {string}                   shadow_colour       - Shadow colour (default is "#000000")
 * @property {string}                   composite_op        - Composite operation (default is null)
 * @property {boolean}                  cache               - If true then resource will be rendered to a cached canvas (default is false)
 * @property {boolean}                  merge_cache         - If true then resource will be rendered to parent cached canvas (default is false)
 * @property {boolean}                  round_pixels        - If set to true then vertices will be rounded before rendered which can boost performance, but there will be a loss in precision (default is false)
 * @property {number}                   padding             - Text padding (used when caching)
 * @property {number}                   scale_method        - Scale method used to fit actor to screen
 * @property {bool}                   	draw_reverse        - If set to true children are drawn in reverse order
 *
 *
 */
b5.Actor = function(virtual)
{
	// Internal variables
	this.type = b5.Actor.Type_Image; // Type of actor
	this.scene = null;				// Parent scene
	this.parent = null;				// Parent actor (If null then this actor does not belong to an actor hierarchy)
	this.actors = [];				// Array of child actors
	this.removals = [];             // Array of actors that should be deleted at end of frame
	this.joints = [];				// Array of physics joints that weer created by this actor
	this.timelines = new b5.TimelineManager();  // Actor local animation timelines
	if (b5.ActionsListManager !== undefined)
		this.actions = new b5.ActionsListManager(); // Actions list manager
	this.tasks = new b5.TasksManager(); 		// Tasks manager
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
	this.touchable = false;			// True to make touchable
	this.hit = true;				// True to include this actor in hit test
	this.x = 0;						// X position in scene, set via _x
	this.y = 0;						// Y position in scene, set via _y
	this.w = 0;						// Width of actor
	this.h = 0;						// Height of actor
	this.ox = 0;					// X origin (between -1 and 1), set via _ox, if value falls outside that range then origin will be interpreted as pixels
	this.oy = 0;					// Y origin (between -1 and 1), set via _oy, if value falls outside that range then origin will be interpreted as pixels
	this.ignore_atlas_size = false;	// If true then the actor will not change size top match the size of the sub image from the atlas
	this.absolute_origin = true;	// If true then origin will be taken as absolute coordinates, otherwise it will be taken as a proportion of actors size
	this.rotation = 0;				// Rotation in radians, set via _rotation
	this.scale_x = 1;				// X scale, set via _scale_x or _scale
	this.scale_y = 1;				// Y scale, set via _scale_y or _scale
	this.depth = 0;					// Z depth (3D depth), set via _depth, 0 represents no depth
	this.opacity = 1.0;				// Opacity (between 0 and 1)
	this.use_parent_opacity = true;	// Scale opacity by parent opacity fi true
	this.current_frame = 0;			// Current bitmap animation frame
	this.prev_frame = 0;			// Previous  bitmap animation frame
	this.frame_speed = 0;			// Bitmap animation playback speed in seconds
	this.anim_frames = null;        // Array of animation frame indices, if not set then frames will be used in order specified in the atlas
	this.frames_repeat = false;		// Tre if bitmap animation should repeat
	this.bitmap = null;				// Bitmap (used if no atlas defined), if set via _bitmap then instance of bitmap or string based path to bitmap can be used
	this.atlas = null;				// Image atlas, if set via _atlas then instance of atlas or string based path to atlas can be used
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
	this.dock_screen = false;		// If true then docking will be to screen edge instead of scene edge
	this.margin = [0,0,0,0];		// Margin to leave around docked actors [left, right, top, bottom]
	this.bubbling = false;			// If true then touch events will be allowed to bubble up to parents
	this.clip_children = false;		// If set to true then child actors will be clipped against extents of this actor
	this.clip_margin = [0,0,0,0];	// Margin to leave around clipping [left, top, right, bottom]
	this.clip_shape = null;         // Shape to clip this actor and / or its children against, if set via _clip_shape then instance of shape or string based path to shape can be used
	this.self_clip = false;		    // If set to true then this actor will be clipped against its own clipping shape
	this.orphaned = false;          // If set to true then this actor will not use its parent actors transform, scene transform will be used instead
	this.virtual = false;           // If true then actor will be classed as a container with a virtual canvas that can scroll and stack its content
	this.clip_virtual = true;		// If true then children with virtual actors will be clipped by rect
	this.shadow = false;            // If set to true then shadow will be added to text
	this.shadow_x = 0;              // Shadow x axis offset
	this.shadow_y = 0;              // Shadow y axis offset
	this.shadow_blur = 0;           // Shadow blur
	this.shadow_colour = "#000000"; // Shadow colour
	this.composite_op = null;       // Composite operation
	this.cache = false;             // If true then resource will be rendered to a cached canvas
	this.merge_cache = false;       // If true then resource will be rendered to parent cached canvas
	this.round_pixels = false;      // If set to true then vertices will be rounded before rendered which can boost performance, but there will be a loss in precision
    this.padding = 0;	            // Amount of pixel padding to add around the actor when caching
	this.scale_method = 0;	        // Method of scaling used to scale this actor to the screen
	this.draw_reverse = false; 		// If set to truechildren are drawn in reverse order
	
	if (virtual === true)
		this.makeVirtual();
};

/**
 * Actor is not docked
 * @constant
 */
b5.Actor.Dock_None = 0;
/**
 * Actor is docked against top of scene / actor on y-axis
 * @constant
 */
b5.Actor.Dock_Top = 1;
/**
 * Actor is docked against bottom of scene / actor on y-axis
 * @constant
 */
b5.Actor.Dock_Bottom = 2;
/**
 * Actor is docked against left of scene / actor on x-axis
 * @constant
 */
b5.Actor.Dock_Left = 1;
/**
 * Actor is docked against right of scene / actor on x-axis
 * @constant
 */
b5.Actor.Dock_Right = 2;

/**
 * Actor is an image based actor
 * @constant
 */
b5.Actor.Type_Image = 0;
/**
 * Actor is a label based actor
 * @constant
 */
b5.Actor.Type_Label = 1;
/**
 * Actor is a rectangular based actor
 * @constant
 */
b5.Actor.Type_Rect = 2;
/**
 * Actor is an arc based actor
 * @constant
 */
b5.Actor.Type_Arc = 3;
/**
 * Actor is a polygon based actor
 * @constant
 */
b5.Actor.Type_Polygon = 4;
/**
 * Actor is a particle based actor
 * @constant
 */
b5.Actor.Type_Particle = 5;
/**
 * Actor is a tiled map based actor
 * @constant
 */
b5.Actor.Type_Map = 6;

//
// Properties
//
Object.defineProperty(b5.Actor.prototype, "_x", {
	get: function() { return this.x; },
	set: function(value) { if (this.x !== value) { this.x = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_y", {
	get: function() { return this.y; },
	set: function(value) { if (this.y !== value) { this.y = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_ox", {
	get: function() { return this.ox; },
	set: function(value) { if (this.ox !== value) { this.ox = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_oy", {
	get: function() { return this.oy; },
	set: function(value) { if (this.oy !== value) { this.oy = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_rotation", {
	get: function() { return this.rotation; },
	set: function(value) { if (this.rotation !== value) { this.rotation = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_scale_x", {
	get: function() { return this.scale_x; },
	set: function(value) { if (this.scale_x !== value) { this.scale_x = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_scale_y", {
	get: function() { return this.scale_y; },
	set: function(value) { if (this.scale_y !== value) { this.scale_y = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_scale", {
	set: function(value) { this._scale_x = value; this._scale_y = value; this.dirty(); }
});
Object.defineProperty(b5.Actor.prototype, "_depth", {
	get: function() { return this.depth; },
	set: function(value) { if (this.depth !== value) { this.depth = value; this.dirty(); } }
});
Object.defineProperty(b5.Actor.prototype, "_layer", {
	get: function() { return this.layer; },
	set: function(value) { if (this.layer !== value) { this.layer = value; if (this.parent !== null) this.parent.order_changed = true; else this.scene.order_changed = true; } }
});
Object.defineProperty(b5.Actor.prototype, "_atlas", {
	get: function() { return this.atlas; },
	set: function(value) { if (this.atlas !== value)
		{
			if (value === null)
			{
				this.atlas = null;
				return;
			}
			this.atlas = b5.Utils.resolveResource(value, "brush");
			if (!this.ignore_atlas_size)
			{
				this.ow = this.atlas.frames[0].w;
				this.oh = this.atlas.frames[0].h;
			}
		}
	}
});
Object.defineProperty(b5.Actor.prototype, "_bitmap", {
	get: function() { return this.bitmap; },
	set: function(value) { if (this.bitmap !== value) { this.atlas = null; this.bitmap = b5.Utils.resolveResource(value, "bitmap"); } }
});
Object.defineProperty(b5.Actor.prototype, "_clip_shape", {
	get: function() { return this.clip_shape; },
	set: function(value) { if (this.clip_shape !== value) { this.clip_shape = b5.Utils.resolveResource(value, "shape"); } }
});
Object.defineProperty(b5.Actor.prototype, "_av", {
	set: function(value)
	{
		if (value !== this.visible && this.onAVChanged !== undefined)
			this.onAVChanged(value);
		this.visible = value; this.active = value;
	}
});

/**
 * Sets the actors scene position
 * @param x {number} X coordinate
 * @param y {number} Y coordinate
 */
b5.Actor.prototype.setPosition = function(x, y)
{
	if (this.x !== x || this.y !== y)
	{
		this.x = x;
		this.y = y;
		this.dirty();
		if (this.body !== null)
		{
			var b2Vec2 = Box2D.Common.Math.b2Vec2;
			var ws = this.scene.world_scale;
			this.body.SetPosition(new b2Vec2(x / ws, y / ws));
		}
	}
};
b5.Actor.prototype.setPositionPhysics = function(x, y) // Deprecated and will be removed, use setPosition instead
{
	this.setPosition(x, y);
};
/**
 * Sets the actors render origin
 * @param x {number} X coordinate
 * @param y {number} Y coordinate
 */
b5.Actor.prototype.setOrigin = function(x, y)
{
	if (this.ox !== x || this.oy !== y)
	{
		this.ox = x;
		this.oy = y;
		this.dirty();
	}
};
/**
 * Sets the actors scale
 * @param x {number} X scale
 * @param y {number} Y scale
 */
b5.Actor.prototype.setScale = function(x, y)
{
	if (this.scale_x !== x || this.scale_y !== y)
	{
		this.scale_x = x;
		this.scale_y = y;
		this.dirty();
	}
};
/**
 * Sets the actors rotation
 * @param angle {number} Angle in radians
 */
b5.Actor.prototype.setRotation = function(angle)
{
	if (this.rotation !== angle)
	{
		this.rotation = angle;
		this.dirty();
		if (this.body !== null)
			this.body.SetAngle(angle);
	}
};
b5.Actor.prototype.setRotationPhysics = function(angle) // Deprecated and will be removed, use setRotation instead
{
	this.setRotation(angle);
};
/**
 * Sets the actors 3D depth
 * @param depth {number} 3D depth, use 0 to disable depth projection
 */
b5.Actor.prototype.setDepth = function(depth)
{
	if (this.depth !== depth)
	{
		this.depth = depth;
		this.dirty();
	}
};

/**
 * Plays the named animation of the attached b5.ImageAtlas brush on this actor
 * @param name {string} Name of animation to play
 * @param repeat {boolean} True if animation should repeat
 */
b5.Actor.prototype.playAnim = function(name, repeat)
{
	if (!this.active)
	{
		this.active = true;
		this.visible = true;
	}
	if (this.atlas !== null)
	{
		var anim = this.atlas.getAnim(name);
		if (anim !== null)
		{
			this.current_frame = 0;
			this.anim_frames = anim.indices;
			this.frame_speed = anim.speed;
			this.frames_repeat = repeat;
			this.dirty();
		}
		else
		{
            if (this.app.debug)
                console.log("Warning: Could not find brush anim '" + name + "' for actor '" + this.name + "'");
		}
	}
};

/**
 * Finds and plays the named timeline animation
 * @param name {string}		 	Name of animation to play
 * @param recurse {boolean} 	If true then will play all timelines in the hierarchy
 * @return {object}				The timeline
 */
b5.Actor.prototype.playTimeline = function(name, recurse)
{
    var timeline = this.timelines.find(name);
    if (timeline !== null)
    {
		if (!this.active)
		{
			this.active = true;
			this.visible = true;
		}
        timeline.restart();
		timeline.update(0);
    }
    if (recurse)
	{
		var children = this.actors;
		var count = children.length;
		for (var t = 0; t < count; t++)
		{
			children[t].playTimeline(name, recurse);
		}
	}
    return timeline;
};

/**
 * Creates and adds a temporary timeline that tweens from the current property value to the target value
 * @param property {string} Property name to animate
 * @param to_value {any} The target value
 * @param duration {number} The time to tween over
 * @param easing {b5.ease} The easing method to use during TweenTo
 * @param wipe {boolean} Set true to wipe out any existing timelines running on the actor
 * @param delay {number} Number of seconds to delay playback
 * @return {object}	The timeline
 */
b5.Actor.prototype.TweenTo = function(property, to_value, duration, easing, wipe, delay)
{
    if (wipe === true)
        this.timelines.remove();
    var timeline = new b5.Timeline(this, property, [this[property], to_value], [0, duration], 1, [easing])
    if (delay !== undefined)
        timeline.setDelay(delay);
	this.timelines.add(timeline);
	return timeline;
};

/**
 * Creates and adds a temporary timeline that tweens from the current property value to the target value
 * @param property {string} Property name to animate
 * @param to_value {any} The target value
 * @param duration {number} The time to tween over
 * @param easing {b5.ease} The easing method to use during TweenTo
 * @param wipe {boolean} Set true to wipe out any existing timelines running on the actor
 * @param delay {number} Number of seconds to delay playback
 * @param on_end {function} Callback that is called when the tween ends
 * @return {object}	The timeline
 */
b5.Actor.prototype.TweenToWithEnd = function(property, to, duration, easing, wipe, delay, on_end)
{
    var timeline = this.TweenTo(property, to, duration, easing, wipe, delay);
    if (on_end != undefined)
		timeline.anims[0].onEnd = on_end;
	return timeline;
};

/**
 * Creates and adds a number of temporary tweens
 * @param tweens {array} Array of tweens
 */
b5.Actor.prototype.TweenToMany = function(tweens)
{
    for (var t = 0; t < tweens.length; t++)
    {
        var tween = tweens[t];
        var wipe = (t === 0) ? tween.wipe : false;
        this.TweenToWithEnd(tween.property, tween.to, tween.duration, tween.easing, wipe, tween.delay, tween.onend);
    }
};

/**
 * Creates and adds a temporary timeline that tweens from the target value to the current property value
 * @param property {string} Property name to animate
 * @param from_value {any} The target value
 * @param duration {number} The time to tween over in seconds
 * @param easing {b5.ease} The easing method to use during TweenTo
 * @param wipe {boolean} Set true to wipe out any existing timelines running on the actor
 */
b5.Actor.prototype.TweenFrom = function(property, from_value, duration, easing, wipe)
{
    if (wipe === true)
        this.timelines.remove();
	this.timelines.add(new b5.Timeline(this, property, [from_value, this[property]], [0, duration], 1, [easing]));
};

/**
 * Creates and adds a task to the actors task list
 * @param task_name {string} Task name
 * @param delay_start {number} The amount o time to wait in seconds before running the task
 * @param repeats {number} The number of times to run the task before destroying itself
 * @param task_function {function} The function call each time the task is executed
 * @param task_data {any} User data to pass to the task function
 */
b5.Actor.prototype.addTask = function(task_name, delay_start, repeats, task_function, task_data)
{
    this.tasks.add(task_name, delay_start, repeats, task_function, task_data);
};

/**
 * Removes the specified task from the task manager
 * @param task_name {string} Task name
 */
b5.Actor.prototype.removeTask = function(task_name)
{
    this.tasks.remove(task_name);
};

/**
 * Releases the actor, calling the actors onDestroy() handler and releases physics, does not remove actor from the scene
 */
b5.Actor.prototype.release = function()
{
	if (this.onDestroy !== undefined)
		this.onDestroy();
	this.releaseJoints();
	this.releaseBody();
};

/**
 * Destroys the actor, removing it from the scene
 */
b5.Actor.prototype.destroy = function()
{
	if (this.parent !== null)
		this.parent.removeActor(this);
	else
	if (this.scene !== null)
		this.scene.removeActor(this);
};

/**
 * Removes the actor from its current parent and places it into a new parent
 * @param parent {b5.Actor|b5.Scene} New parent
 */
b5.Actor.prototype.changeParent = function(parent)
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		if (this === acts[t])
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
/**
 * Adds the specified actor to this actors child list, placing the specified actor under control of this actor
 * @param actor {b5.Actor} An actor
 * @return {b5.Actor} The supplied actor
 */
b5.Actor.prototype.addActor = function(actor)
{
	if (this.scene === null)
		this.scene = b5.app.focus_scene;

	this.actors.push(actor);
	actor.parent = this;
	actor.scene = this.scene;
	return actor;
};

/**
 * Removes the specified actor from this actors child list
 * @param actor {b5.Actor} An actor
 */
b5.Actor.prototype.removeActor = function(actor)
{
	this.removals.push(actor);
};

/**
 * Removes all actors from this actors child list that match the specified tag
 * @param tag {string} Actor tag
 */
b5.Actor.prototype.removeActorsWithTag = function(tag)
{
	var acts = this.actors;
	var count = acts.length;
	var total = 0;
	var removals = this.removals;
	for (var t = 0; t < count; t++)
	{
		if (acts[t].tag === tag)
		{
			removals.push(acts[t]);
			total++;
		}
	}
	return total;
};

/**
 * Removes all actors from this actors child list
 */
b5.Actor.prototype.removeAllActors = function()
{
	var acts = this.actors;
	var count = acts.length;
	var removals = this.removals;
	for (var t = 0; t < count; t++)
	{
		removals.push(acts[t]);
	}
};
/**
 * Cleans up all child actors that were destroyed this frame
 * @private
 */
b5.Actor.prototype.cleanupDestroyedActors = function()
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
 * Searches the actors children to find the named actor
 * @param name {string} Name of actor to find
 * @param recursive {boolean} If true then this actors entire child actor hierarchy will be searched
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Actor.prototype.findActor = function(name, recursive)
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
 * Searches the actors children to find the actor by its id
 * @param id {number} Id of actor to find
 * @param recursive {boolean} If true then this actors entire child actor hierarchy will be searched
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Actor.prototype.findActorById = function(id, recursive)
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
 * Search up the actors parent hierarchy for the first actor parent of this actor
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Actor.prototype.findFirstParent = function()
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

/**
 * Search up the actors parent hierarchy for the first actor that is cached
 * @returns {b5.Actor} The found actor or null if not found
 */
b5.Actor.prototype.findFirstCachedParent = function()
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

/**
 * Updates the transforms of all parents of this actor
 */
b5.Actor.prototype.updateParentTransforms = function()
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
};

/**
 * Get the actors slot index in the parents child list
 */
b5.Actor.prototype.getSlot = function()
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		if (acts[t] === this)
		{
			return t;
		}
	}
};

/**
 * Moves the actor to a specific slot in the parents child list from its old slot, pushing others down
 */
b5.Actor.prototype.moveToSlot = function(new_slot)
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var old_slot = this.getSlot();
	if (old_slot === new_slot)
		return;
	acts.splice(new_slot, 0, this);
	if (new_slot < old_slot)
		old_slot++;
	acts.splice(old_slot, 1);
};

/**
 * Moves the actor to the end of its parents child list, effectively rendering it on top of all other actors that have the same depth
 */
b5.Actor.prototype.bringToFront = function()
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var count = acts.length;
	var i = -1;
	for (var t = 0; t < count; t++)
	{
		if (acts[t] === this)
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

/**
 * Moves the actor to the start of its parents child list, effectively rendering behind all other actors that have the same depth
 */
b5.Actor.prototype.sendToBack = function()
{
	var acts;
	if (this.parent !== null)
		acts = this.parent.actors;
	else
		acts = this.scene.actors;
	var count = acts.length;
	var i = -1;
	for (var t = 0; t < count; t++)
	{
		if (acts[t] === this)
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
/**
 * Called by the main app object when the user begins to touch this actor, provided that this actor is marked as touchable
 * Calls a user supplied onBeginTouch() method if one is supplied
 * @param touch_pos {object} x,y position of touch
 */
b5.Actor.prototype.onBeginTouchBase = function(touch_pos)
{
	this.touching = true;
	// Bubble event to parent if enabled
	if (this.bubbling && this.parent !== null)
		this.parent.onBeginTouchBase(touch_pos);
	if (this.onBeginTouch !== undefined)
		this.onBeginTouch(touch_pos);
};

/**
 * Called by the main app object when the user stops touching this actor, provided that this actor is marked as touchable
 * Calls a user supplied onEndTouch() method if one is supplied
 * @param touch_pos {object} x,y position of touch
 */
b5.Actor.prototype.onEndTouchBase = function(touch_pos)
{
	if (this.touching && this.onTapped !== undefined)
		this.onTapped(touch_pos);
	this.touching = false;
	this.touchmove = false;
	// Bubble event to parent if enabled
	if (this.bubbling && this.parent !== null)
		this.parent.onEndTouchBase(touch_pos);
	if (this.onEndTouch !== undefined)
		this.onEndTouch(touch_pos);
};

/**
 * Called by the main app object when the user moves their finger or mouse whilst touching this actor, provided that this actor is marked as touchable
 * Calls a user supplied onEndTouch() method if one is supplied
 * @param touch_pos {object} x,y position of touch
 */
b5.Actor.prototype.onMoveTouchBase = function(touch_pos)
{
	if (this.touching)
		this.touchmove = true;
	// Bubble event to parent if enabled
	if (this.bubbling && this.parent !== null)
		this.parent.onMoveTouchBase(touch_pos);
	if (this.virtual)
		this.Virtual_onMoveTouch(touch_pos);
	if (this.onMoveTouch !== undefined)
		this.onMoveTouch(touch_pos);
};

//
// Physics
//
/**
 * Releases this actors physics body destroying the body, taking control of the actor from the Box2D physics system
 */
b5.Actor.prototype.releaseBody = function()
{
	if (this.body !== null)
	{
		this.scene.world.DestroyBody(this.body);
		this.body = null;
	}
};

/**
 * Releases all joints that this actor created, destroying the joints
 */
b5.Actor.prototype.releaseJoints = function()
{
	if (this.body !== null)
	{
		for (var t = 0; t < this.joints.length; t++)
			this.scene.world.DestroyJoint(this.joints[t]);
		this.joints = null;
	}
};

/**
 * Creates and attached a physics body 5to this actor, placing this actor under control of the Box2D physics system
 * @param body_type {string} Type of body, can be static, dynamic or kinematic.
 * @param fixed_rotation {boolean} If set to true then the physics body will be prevented from rotating
 * @param is_bullet {boolean} If set to true then the physics body will be marked as a bullet which can be useful for very fast moving objects
 * @returns {object} The created body
 */
b5.Actor.prototype.initBody = function(body_type, fixed_rotation, is_bullet)
{
	if (!this.scene.app.box2d)
		return null;
	var scene = this.scene;
	var body_def = new Box2D.Dynamics.b2BodyDef;
	var ws = scene.world_scale;
	if (body_type === "static")
		body_def.type = Box2D.Dynamics.b2Body.b2_staticBody;
	else
	if (body_type === "kinematic")
		body_def.type = Box2D.Dynamics.b2Body.b2_kinematicBody;
	else
		body_def.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
	body_def.position.Set(this.x / ws, this.y / ws);
	body_def.angle = this.rotation;
	body_def.fixedRotation = fixed_rotation;
	body_def.bullet = is_bullet;
	this.body = scene.world.CreateBody(body_def);
	this.body.SetUserData(this);
    return this.body;
};

/**
 * Adds a new fixture to this actors physics body
 * @param options {object} An object describing the fixtures properties:
 * - type {number} – Type of fixture (Shape.TypeBox, Shape.TypeCircle or Shape.TypePolygon)
 * - density {number} – Fixture density
 * - friction {number} – Fixture friction
 * - restitution {number} – Fixture restitution
 * - is_sensor {boolean} – true if this fixture is a sensor
 * - width {number} – Width and height of box (if type is box)
 * - height {number} – Width and height of box (if type is box)
 * - radius {number} – Radius of shape (if type is circle)
 * - material {b5.Material} – A Material resource, if passed then density, friction, restitution will be taken from the material resource
 * - shape {b5.Shape} – A Shape resource, if passed then width, height, type and vertices will be taken from the shape resource
 * @returns {object} The created fixture or in the case of a multi-fixture shape an array of fixtures
 */
b5.Actor.prototype.addFixture = function(options)
{
	if (this.body === null)
		return null;
	var fix_def;
	var shape = options;
	var material = options;
	if (options.shape !== undefined)
		shape = options.shape;
	if (options.material !== undefined)
		material = options.material;
	var ws = this.scene.world_scale;
	var sx = this.scale_x;
	var sy = this.scale_y;

	if (shape.type === b5.Shape.TypeBox)
	{
		fix_def = new Box2D.Dynamics.b2FixtureDef;
		fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape;
		fix_def.shape.SetAsBox(shape.width / (2 * ws) * sx, shape.height / (2 * ws) * sy);
	}
	else if (shape.type === b5.Shape.TypeCircle)
	{
		fix_def = new Box2D.Dynamics.b2FixtureDef;
		fix_def.shape = new Box2D.Collision.Shapes.b2CircleShape(shape.width / ws * sx);
	}
	else if (shape.type === b5.Shape.TypePolygon)
	{
		if (shape.convexVertices !== undefined && shape.convexVertices.length > 0)
		{
			var fixture_defs = [];
			var pc = shape.convexVertices.length;
			for (var s = 0; s < pc; s++)
			{
				fix_def = new Box2D.Dynamics.b2FixtureDef;
				fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape();

				var points = shape.convexVertices[s];
				var verts = [];
				var count = points.length;
				for (var t = 0; t < count; t += 2)
					verts.push({x: points[t] / ws * sx, y: points[t + 1] / ws * sy});
				fix_def.shape.SetAsArray(verts, verts.length);

				if (material.density !== undefined)
					fix_def.density = material.density;
				if (material.friction !== undefined)
					fix_def.friction = material.friction;
				if (material.restitution !== undefined)
					fix_def.restitution = material.restitution;
				if (options.is_sensor !== undefined)
					fix_def.isSensor = options.is_sensor;
				if (options.collision_category !== undefined)
					fix_def.filter.categoryBits = options.collision_category;
				if (options.collision_mask !== undefined)
					fix_def.filter.maskBits = options.collision_mask;
				if (options.collision_group !== undefined)
					fix_def.filter.groupIndex = options.collision_group;
				fixture_defs.push(this.body.CreateFixture(fix_def));
			}
			return fixture_defs;
		}
		else
		{
			fix_def = new Box2D.Dynamics.b2FixtureDef;
			fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape();

			var points = shape.vertices;
			var verts = [];
			var count = points.length;
			for (var t = 0; t < count; t += 2)
				verts.push({x: points[t] / ws * sx, y: points[t + 1] / ws * sy});

			fix_def.shape.SetAsArray(verts, verts.length);
		}
	}
	if (material.density !== undefined)
		fix_def.density = material.density;
	if (material.friction !== undefined)
		fix_def.friction = material.friction;
	if (material.restitution !== undefined)
		fix_def.restitution = material.restitution;
	if (material.is_sensor !== undefined)
		fix_def.isSensor = material.is_sensor;
	if (options.collision_category !== undefined)
		fix_def.filter.categoryBits = options.collision_category;
	if (options.collision_mask !== undefined)
		fix_def.filter.maskBits = options.collision_mask;
	if (options.collision_group !== undefined)
		fix_def.filter.groupIndex = options.collision_group;
	return this.body.CreateFixture(fix_def);
};

/**
 * Adds a new joint to this actor
 * @param options {object} An object describing the joints properties:
 * - type {string} – Type of joint to create (weld, distance, revolute, prismatic, pulley, wheel, mouse)
 * - actor_b ({@link b5.Actor}) – The other actor that this joint attaches to
 * - anchor_a {object} - The joints x, y anchor point on this body
 * - anchor_b {object} - The joints x, y anchor point on actor_b’s body
 * - self_collide {boolean} – If set to true then actors that are connected via the joint will collide with each other
 * - frequency {number} – Oscillation frequency in Hertz (distance joint)
 * - damping {number} – Oscillation damping ratio (distance and wheel joints)
 * - limit_joint {boolean} – If true then joint limits will be applied (revolute, prismatic, wheel joints)
 * - lower_limit {number} – Lower limit of joint (revolute, prismatic, wheel joints)
 * - upper_limit {number} – Upper limit of joint (revolute, prismatic, wheel joints)
 * - motor_enabled {boolean} – If true then the joints motor will be enabled (revolute, prismatic, wheel joints)
 * - motor_speed {number} – Motor speed (revolute, prismatic, wheel joints)
 * - max_motor_torque {number} – Motors maximum torque (revolute joints)
 * - max_motor_force {number} – Motors maximum force (prismatic, wheel, mouse joints)
 * - axis {object} – Movement x, y axis (prismatic, wheel joints)
 * - ground_a {object} – Ground x, y offset for this actor (pulley joints)
 * - ground_b {object} – Ground x, y offset for actor_b (pulley joints)
 * @returns {object} The created joint
 */
b5.Actor.prototype.addJoint = function(options)
{
	if (this.body === null)
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
	if (options.type === "weld")
	{
		joint_def = new Box2D.Dynamics.Joints.b2WeldJointDef;
		joint_def.Initialize(body_a, body_b, lpa);
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
		joint_def.collideConnected = options.self_collide;
	}
	else if (options.type === "distance")
	{
		joint_def = new Box2D.Dynamics.Joints.b2DistanceJointDef;
		joint_def.Initialize(body_a, body_b, lpa, lpb);
//		joint_def.referenceAngle = options.actor_b.body.GetAngle() - this.body.GetAngle();
		joint_def.collideConnected = options.self_collide;
		joint_def.frequencyHz = options.frequency;
		joint_def.dampingRatio = options.damping;
	}
	else if (options.type === "revolute")
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
	else if (options.type === "prismatic")
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
	else if (options.type === "pulley")
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
	else if (options.type === "wheel")
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
	else if (options.type === "mouse")
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

/**
 * Removes and destroys the specified joint
 * @param joint {object} The joint to remove
 */
b5.Actor.prototype.removeJoint = function(joint)
{
	var joints = this.joints;
	var count = joints.length;
	for (var t = 0; t < count; t++)
	{
		if (joints[t] === joint)
		{
			world.DestroyJoint(joint);
			joints.splice(t, 1);
			return;
		}
	}
};

/**
 * Calculate how much to scale the x and y scaling factors to make the object fit to the required scaling method
 * @returns joint {object} x and y scaling factor
 */
b5.Actor.prototype.getScaleFromMethod = function(method)
{
	var sx = 1;
	var sy = 1;
	var sm = method;
	if (sm !== 0)
	{
		var app = b5.app;
		var cs = 1 / app.canvas_scale;
		var dsx = (app.inner_width / app.design_width) * cs;
		var dsy = (app.inner_height / app.design_height) * cs;
		if (sm === 4)
		{
			if (dsx < dsy) { sx *= dsx; sy *= dsx; }
			else { sx *= dsy; sy *= dsy; }
		}
		else if (sm === 2)
		{
			sx *= dsx;
			sy *= dsx;
		}
		else if (sm === 3)
		{
			sx *= dsy;
			sy *= dsy;
		}
		else if (sm === 5)
		{
			var ds = (dsx + dsy) * 0.5;
			sx *= ds;
			sy *= ds;
		}
		else if (sm === 6)
		{
			var ds;
			if (app.inner_width > app.inner_height)
				ds = dsx;
			else
				ds = dsy;
			sx *= ds;
			sy *= ds;
		}
		else if (sm === 7)
		{
			var ds;
			if (app.inner_width < app.inner_height)
				ds = dsx;
			else
				ds = dsy;
			sx *= ds;
			sy *= ds;
		}
		else if (sm === 8)
		{
			sx *= dsx;
			sy *= dsy;
		}
		else
		if (sm === 1)
		{
			sx *= cs;
			sy *= cs;
		}
	}
	return { x: sx, y: sy };
};

//
// Transform update
//
/**
 * Checks if this actors visual transform is dirty and if so rebuilds the transform and mark the transform as clean
 */
b5.Actor.prototype.updateTransform = function()
{
	if (this.transform_dirty)
	{
		var trans = this.transform;
		var scene = this.scene;
		var r = this.rotation;
		var sx = this.scale_x;
		var sy = this.scale_y;
		if (this.parent === null)
		{
			sx *= scene.scale;
			sy *= scene.scale;
		}
		var sm = this.scale_method;
		if (sm !== 0)
		{
			var s = this.getScaleFromMethod(sm);
			sx *= s.x;
			sy *= s.y;
		}
		
		var parent = this.parent;
		if (parent === null || this.orphaned)
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
		if (this.depth !== 0 && this.depth !== 1)
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
		var src = null;
		var atlas = this.atlas;
		if (atlas !== null)
		{
			if (this.anim_frames !== null)
				src = atlas.getFrame(this.anim_frames[this.current_frame | 0]);
			else
				src = atlas.getFrame(this.current_frame | 0);
		}
		// Apply origin
		var ox = this.ox;
		var oy = this.oy;
		if (ox !== 0 || oy !== 0 || src !== null)
		{
			if (!this.absolute_origin)
			{
				ox *= this.w;
				oy *= this.h;
			}
			trans[4] -= ox;
			trans[5] -= oy;
			// Apply frame offset
			if (src !== null)
			{
				ox -= src.ox;
				oy -= src.oy;
			}
			var pre_mat = [1, 0, 0, 1, ox, oy];
			b5.Maths.preMulMatrix(trans, pre_mat);
		}
//		[0][2][4]		[0][2][4]
//		[1][3][5]		[1][3][5]
//		[x][x][1]		[x][x][1]
		if (parent !== null && !this.orphaned)
		{
			b5.Maths.mulMatrix(trans, parent.transform);
		}
	}

};

//
// Rendering
//
/**
 * Renders this actor and all of its children, called by the base app render loop. You can derive your own actor types from Actor and implement draw() to provide your own custom rendering
 */
b5.Actor.prototype.draw = function()
{
	if (!this.visible)
		return;

	if (this.cache)
	{
		this.drawToCache();
		this.cache = false;
	}
	if (this.merge_cache)   // If merged into parent cache then parent will have drawn so no need to draw again
	{
		var count = this.actors.length;
		if (count > 0)
		{
			var acts = this.actors;
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
		}
		return;
	}

	var cache = this.cache_canvas;
	var scene = this.scene;
	var app = scene.app;
	var dscale = app.canvas_scale;
	var disp = app.display;
	this.preDraw();

	// Get source image coordinates from the atlas
	var src = null;
	if (cache === null)
	{
		var atlas = this.atlas;
		if (atlas !== null)
		{
			if (this.anim_frames !== null)
				src = atlas.getFrame(this.anim_frames[this.current_frame | 0]);
			else
				src = atlas.getFrame(this.current_frame | 0);
			if (!this.ignore_atlas_size)
			{
				this.w = src.w;
				this.h = src.h;
			}
			if ((this.prev_frame | 0) !== (this.current_frame | 0))
				this.dirty();
			this.prev_frame = this.current_frame;
		}
	}
	var mx = app.canvas_cx + scene.x * dscale;
	var my = app.canvas_cy + scene.y * dscale;
	if (this.ow === undefined)
	{
		this.ow = this.w;
		this.oh = this.h;
	}
	var cx = this.ow / 2;
	var cy = this.oh / 2;

	if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
	{
		mx -= scene.camera_x * dscale;
		my -= scene.camera_y * dscale;
	}

	this.updateTransform();
	var self_clip = this.self_clip;
	var clip_children = this.clip_children;
	var trans = this.transform;
	var tx = trans[4] * dscale + mx;
	var ty = trans[5] * dscale + my;

	if (this.round_pixels)
	{
		cx = (cx + 0.5) | 0;
		cy = (cy + 0.5) | 0;
		tx = (tx + 0.5) | 0;
		ty = (ty + 0.5) | 0;
	}
	disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

	if (self_clip)
		this.setClipping(-cx, -cy);

	if (cache === null)
	{
		if (atlas !== null)
			disp.drawAtlasImage(atlas.bitmap.image, src.x, src.y, src.w, src.h, -cx, -cy, this.w + 1, this.h + 1);	// +1 closes small gaps
		else
		if (this.bitmap !== null)
			disp.drawImage(this.bitmap.image, -cx, -cy, this.w, this.h);
	}
	else
		disp.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
	this.postDraw();

	if (clip_children)
	{
		if (!self_clip)
			this.setClipping(-cx, -cy);
	}
	else
	if (self_clip)
		disp.restoreContext();

	// Draw child actors
	var count = this.actors.length;
	if (count > 0)
	{
		var acts = this.actors;
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
	}
	if (clip_children)
		disp.restoreContext();
};

/**
 * Reset cache state of actor and all children
 */
b5.Actor.prototype.resetCache = function()
{
	this.cache = true;
	var count = this.actors.length;
	if (count > 0)
	{
		var acts = this.actors;
		for (var t = 0; t < count; t++)
			acts[t].resetCache();
	}
};

/**
 * Renders this actor to a cache which can speed up rendering it the next frame
 */
b5.Actor.prototype.drawToCache = function()
{
	var disp = b5.app.display;
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

	// Get source image coordinates from the atlas
	var src = null;
	var atlas = this.atlas;
	if (atlas !== null)
	{
		if (this.anim_frames !== null)
			src = atlas.getFrame(this.anim_frames[this.current_frame << 0]);
		else
			src = atlas.getFrame(this.current_frame << 0);
	}

	if (cache === null)
	{
		cache = disp.createCache();
		cache.width = this.w;
		cache.height = this.h;
	}
	disp.setCache(cache);

	if (this.self_clip)
	{
		this.setClipping(ox + this.ow / 2, oy + this.oh / 2);
	}

	this.preDrawCached();
	
	if (atlas !== null)
		disp.drawAtlasImage(atlas.bitmap.image, src.x, src.y, src.w, src.h, ox, oy, this.w, this.h);
	else
	if (this.bitmap !== null)
		disp.drawImage(this.bitmap.image, ox, oy, this.w, this.h);

	this.postDrawCached();
	if (this.self_clip)
		disp.restoreContext();

	disp.setCache(null);

	this.cache_canvas = cache;
};

/**
 * Called before rendering the actor to perform various pre-draw activities such as setting opacity, shadows and composite operations
 */
b5.Actor.prototype.preDraw = function()
{
	var disp = b5.app.display;
	if (this.parent === null || !this.use_parent_opacity)
		this.accum_opacity = this.opacity * this.scene.opacity;
	else
		this.accum_opacity = this.parent.accum_opacity * this.opacity;
	disp.setGlobalAlpha(this.accum_opacity);

	if (this.shadow)
		disp.setShadow(this.shadow_x, this.shadow_y, this.shadow_colour, this.shadow_blur);
	if (this.composite_op !== null)
		disp.setGlobalCompositeOp(this.composite_op);
};

/**
 * Called after rendering the actor to perform various post-draw activities such as disabling shadows and resetting composite operations
 */
b5.Actor.prototype.postDraw = function()
{
	var disp = b5.app.display;
	if (this.shadow) disp.setShadowOff();
	if (this.composite_op !== null)
		disp.setGlobalCompositeOp("source-over");
};

/**
 * Called before rendering the cached actor to perform various pre-draw activities such as setting opacity, shadows and composite operations
 */
b5.Actor.prototype.preDrawCached = function()
{
	var disp = b5.app.display;
	if (this.shadow)
		disp.setShadow(this.shadow_x, this.shadow_y, this.shadow_colour, this.shadow_blur);
	if (this.composite_op !== null)
		disp.setGlobalCompositeOp(this.composite_op);
};

/**
 * Called after rendering the cached actor to perform various post-draw activities such as disabling shadows and resetting composite operations
 */
b5.Actor.prototype.postDrawCached = function()
{
	var disp = b5.app.display;
	if (this.shadow) disp.setShadowOff();
	if (this.composite_op !== null)
		disp.setGlobalCompositeOp("source-over");
};

//
// Update
//
/**
 * Main base actor update method that is called by the main app object each logic loop. Performs many actions including:
 * - Calling onTick() callback
 * - Updating local timelines manager
 * - Updating local actions manager
 * - Updating local tasks manager
 * - Providing virtual canvas functionality
 * - Updating bitmap animation
 * - Updating position / rotation from physics or updating arcade physics
 * - Scene edge wrapping
 * - Applying docking
 * - Updating child hierarchy
 * - Cleaning up destroyed child actors
 * - Sorting child actor layers
 * @param dt {number} Time that has passed since this actor was last updated in seconds
 */
b5.Actor.prototype.baseUpdate = function(dt)
{
	if (!this.active)
		return;
	
	if (this.onTick !== undefined)
		this.onTick(dt);

	this.timelines.update(dt);
	if (this.actions !== undefined)
		this.actions.execute();
	this.tasks.execute();

	if (this.virtual)
		this.Virtual_update(dt);

	var scene = this.scene;

	// Update the frame
	if (this.atlas !== null)
	{
		this.current_frame += this.frame_speed * dt;
		var max;
		if (this.anim_frames !== null)
			max = this.anim_frames.length;
		else
			max = this.atlas.getMaxFrames();
		if (this.frames_repeat)
		{
			if (this.current_frame < 0)
			{
				while (this.current_frame < 0)
					this.current_frame += max;
			}
			else
			{
				while (this.current_frame >= max)
					this.current_frame -= max;
			}
		}
		else
		{
			if (this.current_frame >= max)
				this.current_frame = max - 1;
			else
			if (this.current_frame < 0)
				this.current_frame = 0;
		}
	}
	var x = this.x;
	var y = this.y;
	// Update from physics
	var body = this.body;
	if (body !== null)
	{
		var pos = body.GetPosition();
		var ws = scene.world_scale;
		this.setRotation(body.GetAngle());
		this.setPosition(pos.x * ws, pos.y * ws);
	}
	else
	{
		// Apply velocities
		this.rotation += this.vr * dt;
		this.vr *= this.vr_damping;
		this.x += this.vx * dt;
		this.vx *= this.vx_damping;
		this.y += this.vy * dt;
		this.vy *= this.vy_damping;
	}
	if (this.vd !== 0)
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
	if (this.parent === null || !this.parent.virtual)
	{
		if (this.dock_screen)
		{
			if (this.dock_x !== 0)
			{
				var s = this.getScaleFromMethod(2);
				var sx = (this.scale_method === 0) ? 1 : s.x;
				if (this.dock_x === b5.Actor.Dock_Left)
					this.x = -scene.w * s.x / 2 + ((this.w * this.scale_x * sx) / 2 + this.margin[0] * s.x);
				else if (this.dock_x === b5.Actor.Dock_Right)
					this.x = scene.w * s.x / 2 - ((this.w * this.scale_x * sx) / 2 + this.margin[1] * s.x);
			}
			if (this.dock_y !== 0)
			{
				var s = this.getScaleFromMethod(3);
				var sy = (this.scale_method === 0) ? 1 : s.y;
				if (this.dock_y === b5.Actor.Dock_Top)
					this.y = -scene.h * s.y / 2 + ((this.h * this.scale_y * sy) / 2 + this.margin[2] * s.y);
				else if (this.dock_y === b5.Actor.Dock_Bottom)
					this.y = scene.h * s.y / 2 - ((this.h * this.scale_y * sy) / 2 + this.margin[3] * s.y);
			}
		}
		else
		{
			if (this.dock_x !== 0)
			{
				if (this.dock_x === b5.Actor.Dock_Left)
					this.x = -scene.w / 2 + (this.w * this.scale_x)/ 2 + this.margin[0];
				else if (this.dock_x === b5.Actor.Dock_Right)
					this.x = scene.w / 2 - (this.w * this.scale_x) / 2 + this.margin[1];
			}
			if (this.dock_y !== 0)
			{
				if (this.dock_y === b5.Actor.Dock_Top)
					this.y = -scene.h / 2 + (this.h * this.scale_y) / 2 + this.margin[2];
				else if (this.dock_y === b5.Actor.Dock_Bottom)
					this.y = scene.h / 2 - (this.h * this.scale_y) / 2 + this.margin[3];
			}
		}
	}

	if (this.x !== x || this.y !== y || (body === null && this.vr !== 0))
		this.dirty();

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
		b5.Utils.sortLayers(this.actors);
	}

	this.frame_count++;
};

/**
 * Main actor update method that is called by the main app object each logic loop. If you derive your own Actor class
 * then you should override this method to provide your own functionality, but remember to call baseUpdate() if you
 * would like to keep the existing base Actor functionality
 * @param dt {number} Time that has passed since this actor was last updated in seconds
 */
b5.Actor.prototype.update = function(dt)
{
	this.baseUpdate(dt);
};

/**
 *  Copies actor velocities to the physics body
 */
b5.Actor.prototype.updateToPhysics = function()
{
	if (this.body === null)
		return;
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	this.body.SetLinearVelocity(new b2Vec2(this.vx, this.vy));
	this.body.SetAngularVelocity(this.vr);
	this.body.SetAwake(true);
};

/**
 * Dirties this actor and all child actor transforms forcing them to be rebuilt
 */
b5.Actor.prototype.dirty = function()
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
/**
 * Attaches a virtual canvas providing new actor properties:
 *
 * - prev_scroll_pos_x {number} - Previous canvas scroll X position
 * - prev_scroll_pos_y {number} - Previous canvas scroll Y position
 * - scroll_pos_x {number} - Canvas scroll X position
 * - scroll_pos_y {number} - Canvas scroll Y position
 * - scroll_vx {number} - Canvas scroll X velocity
 * - scroll_vy {number} - Canvas scroll Y velocity
 * - scroll_range {array} - Scrollable range of canvas (left, top, width, height)
 *
 * Child actors that apply docking will be docked to this container instead of the scene
 */
b5.Actor.prototype.makeVirtual = function()
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

/**
 * Handles virtual canvas onMouseTouch handling
 * @private
 * @param touch_pos {object} The touched position
*/
b5.Actor.prototype.Virtual_onMoveTouch = function(touch_pos)
{
	if (this.touching && (this.scroll_range[2] !== 0 || this.scroll_range[3] !== 0))
	{
		var app = this.scene.app;
		this.prev_scroll_pos_x = this.scroll_pos_x;
		this.prev_scroll_pos_y = this.scroll_pos_y;
		this.scroll_vx = app.touch_drag_x;
		this.scroll_pos_x += app.touch_drag_x;
		this.scroll_vy = app.touch_drag_y;
		this.scroll_pos_y += app.touch_drag_y;
		if (this.scroll_vx !== 0 || this.scroll_vy !== 0)
		{
			this.Virtual_scrollRangeCheck();
			this.Virtual_updateLayout();
		}
	}
};

/**
 * Handles virtual canvas per logic loop update
 * @private
 * @param dt {number} Amount of time that has passed since last called by the logic loop in seconds
 */
b5.Actor.prototype.Virtual_update = function(dt)
{
	var layout_dirty = false;

	if (!this.touching)
	{
		this.prev_scroll_pos_x = this.scroll_pos_x;
		this.prev_scroll_pos_y = this.scroll_pos_y;
		this.scroll_pos_x += this.scroll_vx;
		this.scroll_pos_y += this.scroll_vy;
		if (this.scroll_vx !== 0 || this.scroll_vy !== 0)
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
	if (this.frame_count === 0)
		this.Virtual_updateLayout();
};

/**
 * Handles virtual canvas scroll range check
 * @private
 */
b5.Actor.prototype.Virtual_scrollRangeCheck = function()
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


/**
 * Updates the virtual canvas layout
 * @private
 * @param dt {number} Amount of time that has passed since last called by the logic loop in seconds
 */
b5.Actor.prototype.Virtual_updateLayout = function(dt)
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
			if (act.dock_x !== 0)
			{
				if (act.dock_x === b5.Actor.Dock_Left)
					act.x = -w + act.w * act.scale_x / 2 + act.margin[0];
				else if (act.dock_x === b5.Actor.Dock_Right)
					act.x = w - act.w * act.scale_x / 2 + act.margin[1];
			}
			else
				act.x += dx;
			if (act.dock_y !== 0)
			{
				if (act.dock_y === b5.Actor.Dock_Top)
					act.y = -h + act.h * act.scale_y / 2 + act.margin[2];
				else if (act.dock_y === b5.Actor.Dock_Bottom)
					act.y = h - act.h * act.scale_y / 2 + act.margin[3];
			}
			else
				act.y += dy;
			// Disable actors out of range
			if (this.clip_virtual)
			{
				var aw = act.w / 2;
				var ah = act.h / 2;
				if (act.y < -h - ah || act.y > h + ah || act.x < -w - aw || act.x > w + aw)
				{
					act._av = false;
				}
				else
				{
					act._av = true;
				}
			}
			act.touching = false;
			act.dirty();
		}
	}
};

/**
 * Check if actor inside virtual actor is clipped out of visible range
 * @public
 */
b5.Actor.prototype.Virtual_isClipped = function(actor)
{
	if (!this.clip_virtual)
		return false;

	var w = this.w * this.scale_x / 2;
	var h = this.h * this.scale_y / 2;
	var aw = actor.w / 2;
	var ah = actor.h / 2;
	if (actor.y < -h - ah || actor.y > h + ah || actor.x < -w - aw || actor.x > w + aw)
	{
		return true;
	}
	return false;
};

/**
 * Tests to see if the supplied position has hit the actor or any of its children. This function does not work with
 * actors that have been rotated around any point except their centre, also does not work with actors that have depth.
 * @param position {object} The x,y position to be tested
 * @returns {b5.Actor} The actor that was hit or null if no actor was hit
 */
b5.Actor.prototype.hitTest = function(position)
{
	if (!this.touchable || !this.active)
		return null;

	// Check child actors
	var count = this.actors.length;
	var act;
	if (count > 0)
	{
		var acts = this.actors;
	    for (var t = count - 1; t >=0 ; t--)
		{
			act = acts[t].hitTest(position);
			if (act !== null)
				return act;
		}
	}

	if (this.hit)
	{
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
	}
	
	return null;
};

/**
 * Transforms supplied point by actors visual transform
 * @param x {number} X coordinate local to actor
 * @param y {number} Y coordinate local to actor
 * @returns {object} Transformed point
 */
b5.Actor.prototype.transformPoint = function(x, y)
{
	return b5.Maths.vecMulMatrix(x, y, this.transform);
};

/**
 * Sets the clipping
 * @private
 * @param x {number} X coordinate
 * @param y {number} Y coordinate
 */
b5.Actor.prototype.setClipping = function(x, y)
{
	var disp = b5.app.display;
	disp.saveContext();

	var clip_margin = this.clip_margin;
	var shape = this.clip_shape;
	if (shape === null)
	{
		var type = this.type;
		if (type === b5.Actor.Type_Arc)
			disp.clipArc(x + clip_margin[0], y + clip_margin[1], this.radius, 0, 2 * Math.PI);
		else
		if (type === b5.Actor.Type_Polygon)
			disp.clipPolygon(this.points);
		else
			disp.clipRect(x + clip_margin[0], y + clip_margin[1], this.w - clip_margin[2] - clip_margin[0], this.h - clip_margin[3] - clip_margin[1]);
	}
	else
	{
		var type = shape.type;
		if (type === b5.Shape.TypeBox)
			disp.clipRect(x + clip_margin[0], y + clip_margin[1], shape.width - clip_margin[2] - clip_margin[0], shape.height - clip_margin[3] - clip_margin[1]);
		else
		if (type === b5.Shape.TypeCircle)
			disp.clipArc(x + clip_margin[0], y + clip_margin[1], shape.width, 0, 2 * Math.PI);
		else
		if (type === b5.Shape.TypePolygon)
			disp.clipPolygon(shape.vertices);
	}
};

/**
 * Basic test to see if actors overlap (no scaling, rotation, origin or shape currently taken into account)
 * @param other {b5.Actor} Other actor to test overlap with
 * @returns {boolean} true if overlapping, false if not
 */
b5.Actor.prototype.overlaps = function(other)
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
};
b5.Actor.prototype.overlapsRect = function(rect)
{
	var w1 = this.w;
	var h1 = this.h;
	var w2 = rect.x2 - rect.x1;
	var h2 = rect.y2 - rect.y1;
	var x1 = this.x - w1 / 2;
	var y1 = this.y - h1 / 2;
	var x2 = rect.x1;
	var y2 = rect.y1;

	return !((y1 + h1 < y2) || (y1 > y2 + h2) || (x1 > x2 + w2) || (x1 + w1 < x2));
};

/**
 * Basic test to see if actors overlap (no scaling, rotation, origin or shape currently taken into account).
 * Assumes this actor is circular
 * @param other {b5.Actor} Other actor to test overlap with
 * @returns {boolean} true if overlapping, false if not
 */
b5.Actor.prototype.circleOverlaps = function(other)
{
	var rx1 = other.x - other.w / 2;
	var ry1 = other.y - other.h / 2;
	var rx2 = other.x + other.w / 2;
	var ry2 = other.y + other.h / 2;
	var x = this.x;
	var y = this.y;
	var closex = (x < rx1) ? rx1 : ((x > rx2) ? rx2 : x);
	var closey = (y < ry1) ? ry1 : ((y > ry2) ? ry2 : y);
	var dx = x - closex;
	var dy = y - closey;
	var d = (dx * dx) + (dy * dy);
	return d < (this.w / 2 * this.w / 2);
}
b5.Actor.prototype.circleOverlapsRect = function(rect)
{
	var rx1 = rect.x1;
	var ry1 = rect.y1;
	var rx2 = rect.x2;
	var ry2 = rect.y2;
	var x = this.x;
	var y = this.y;
	var closex = (x < rx1) ? rx1 : ((x > rx2) ? rx2 : x);
	var closey = (y < ry1) ? ry1 : ((y > ry2) ? ry2 : y);
	var dx = x - closex;
	var dy = y - closey;
	var d = (dx * dx) + (dy * dy);
	return d < (this.w / 2 * this.w / 2);
}

b5.Actor.fullCircleOverlapTest = function(act1, act2)
{
	var p1 = act1.transformPoint(0, 0);
	var p2 = act2.transformPoint(0, 0);
	
	var dx = p2.x - p1.x;
	var dy = p2.y - p1.y;
	var d1 = dx * dx + dy * dy;
	var d2 = (act1.w * act1.w / 2) + (act2.w * act2.w / 2)

	if (d1 <= d2)
		return true;
	
	return false;
};
