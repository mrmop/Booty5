/**
/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * The Xoml class loads XOML format JSON (exported from the Booty5 game editor) and turns it into Booty5 compatible objects
 *
 * Xoml format data looks as follows:
 *
 *      b5.data.globals = [
 *           {
 *               "RT": "Geometry",
 *               "N": "rect3762",
 *               "GT": "Poly",
 *               "A": false,
 *               "V": [-126.336,-106.399, -42.018,-90.992, 153.614,46.411, -66.468,106.4, -153.614,-7.28]
 *           },
 *           {
 *               "RT": "Shape",
 *               "N": "rect3761",
 *               "ST": "Polygon",
 *               "W": 0,
 *               "H": 0,
 *               "A": false,
 *               "V": [-126.336,-106.399, -42.018,-90.992, 153.614,46.411, -66.468,106.4, -153.614,-7.28]
 *           }
 *      ];
 *
 * <b>Examples</b>
 *
 * Example showing code that loads JSON and converts it to Booty5 objects:
 *
 *      // Create XOML loader
 *      var xoml = new b5.Xoml(app);
 *
 *      // Parse and create global resources placing them into the app
 *      xoml.parseResources(app, xoml_globals);
 *
 * Example showing how to dynamically create an actor from XOML template
 *
 *      var app = b5.app;
 *
 *      // This scene will receive a copy of ball object
 *      var game_scene = app.findScene("gamescene");
 *
 *      // Search Xoml gamescene for ball icon actor resource
 *      var ball_template = b5.Xoml.findResource(b5.data.gamescene, "ball", "icon");
 *
 *      // Create ball from the Xoml template and add it to game_scene
 *      var xoml = new b5.Xoml(app);
 *      xoml.current_scene = game_scene;	// Xoml system needs to know current scene so it knows where to look for dependent resources
 *      var ball = xoml.parseResource(game_scene, ball_template);
 *      ball.setPosition(0, -350);
 *      ball.vx = 4;
 *      ball.fill_style = "rgb(" + ((Math.random() * 255) &lt;&lt; 0) + "," + ((Math.random() * 255) &lt;&lt; 0) + "," + ((Math.random() * 255) &lt;&lt; 0) + ")";
 *
 * For a complete overview of XOML see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/xoml-booty5-editor-data/ Booty5 XOML Overview}
 *
 * @class b5.Xoml
 * @param app (b5.App) The main app
 * @constructor
 * @returns {b5.Xoml} The created Xoml parser
 *
 */
b5.Xoml = function(app)
{
    // Internal variables
    this.current_scene = null;      // Current scene
    this.app = app;                 // The parent app
};

b5.Xoml.prototype.parseScene = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Scene " + item.Name);

    // Create a scene
    var scene = new b5.Scene();

    if (parent !== null)
    {
        parent.addScene(scene);
        if (item.Current)
            parent.focus_scene = scene;
        else
        if (item.Current2)
            parent.focus_scene2 = scene;
    }

    this.current_scene = scene;
    scene.name = item.Name;
    if (item.Tag !== undefined) scene.tag = item.Tag;
    scene.x = item.Position[0];
    scene.y = item.Position[1];
    if (item.CanvasSize !== undefined)
    {
        scene.w = item.CanvasSize[0];
        scene.h = item.CanvasSize[1];
    }
    if (item.Layer !== undefined) scene.layer = item.Layer;
    if (item.Visible !== undefined) scene.visible = item.Visible;
    if (item.Active !== undefined) scene.active = item.Active;
    if (item.Physics !== undefined && item.Physics)
    {
        scene.initWorld(item.Gravity[0], item.Gravity[1], item.DoSleep);
        if (item.PhysicsTimestep !== undefined)
            scene.time_step = item.PhysicsTimestep;
        if (item.WorldScale !== undefined)
            scene.world_scale = item.WorldScale;
    }
    if (item.ClipChildren !== undefined)
        scene.clip_children = item.ClipChildren;

    if (item.TouchPan === "Both")
    {
        scene.touch_pan_x = true;
        scene.touch_pan_y = true;
    }
    else if (item.TouchPan === "X")
        scene.touch_pan_x = true;
    else if (item.TouchPan === "Y")
        scene.touch_pan_y = true;
    scene.extents[0] = item.Extents[0];
    scene.extents[1] = item.Extents[1];
    scene.extents[2] = item.Extents[2];
    scene.extents[3] = item.Extents[3];

    scene.follow_speedx = item.FollowSpeed[0];
    scene.follow_speedy = item.FollowSpeed[1];

    // Parse user properties
    var user_props = item.UserProps;
    if (user_props !== undefined)
    {
        for (var t = 0; t < user_props.length; t++)
            scene[user_props[t].N] = user_props[t].V;
    }

    // Parse pre-defined animation timelines
    var tc = item.TimelineCollection;
    if (tc !== undefined)
    {
        for (var t = 0; t < tc.length; t++)
            this.parseTimeline(scene, tc[t]);
    }

    // Parse actions lists
    var al = item.ActionsList;
    if (al !== undefined)
    {
        for (var t = 0; t < al.length; t++)
            this.parseActionsList(scene, al[t]);
    }

    if (item.Alpha !== undefined) scene.opacity = item.Alpha;

    if (!(item.Cn === undefined))
        this.parseResources(scene, item.Cn);

    if (item.ClipShape !== undefined && item.ClipShape !== "")
        scene.clip_shape = scene.findResource(item.ClipShape, "shape");

    if (item.TargetX !== "")
        scene.target_x = scene.findActor(item.TargetX);
    if (item.TargetY !== "")
        scene.target_y = scene.findActor(item.TargetY);
    if (item.VelocityDamping !== undefined)
    {
        scene.vx_damping = item.VelocityDamping[0];
        scene.vy_damping = item.VelocityDamping[1];
    }

    // Parse actions
    if (item.OnCreate !== undefined)
        scene.onCreate = Function(item.OnCreate);
    if (item.OnDestroy !== undefined)
        scene.onDestroy = Function(item.OnDestroy);
    if (item.OnTick !== undefined)
        scene.onTick = Function("dt", item.OnTick);
    if (item.OnTapped !== undefined)
        scene.onTapped = Function("touch_pos", item.OnTapped);
    if (item.OnBeginTouch !== undefined)
        scene.onBeginTouch = Function("touch_pos", item.OnBeginTouch);
    if (item.OnEndTouch !== undefined)
        scene.onEndTouch = Function("touch_pos", item.OnEndTouch);
    if (item.OnMoveTouch !== undefined)
        scene.onMoveTouch = Function("touch_pos", item.OnMoveTouch);
    if (item.OnWheel !== undefined)
        scene.onWheel = Function("event", item.OnWheel);
    if (item.OnKeyPress !== undefined)
        scene.onKeyPress = Function("event", item.OnKeyPress);
    if (item.OnKeyDown !== undefined)
        scene.onKeyDown = Function("event", item.OnKeyDown);
    if (item.OnKeyUp !== undefined)
        scene.onKeyUp = Function("event", item.OnKeyUp);

    if (scene.onCreate !== undefined)
        scene.onCreate();

    return scene;
};
b5.Xoml.prototype.parseBrush = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Brush " + item.N);
    var brush;
    if (item.BT === 0)
    {
        var rect = item.RC;
        var bitmap = parent.findResource(item.I, "bitmap")
        var frames = item.F;
        if (frames.length === 0)
            brush = new b5.ImageAtlas(item.N, bitmap, rect[0], rect[1], rect[2], rect[3], rect[4], rect[5]);
        else
        {
            // Parse frames
            brush = new b5.ImageAtlas(item.N, bitmap);
            for (var t = 0; t < frames.length; t++)
            {
                var frame = frames[t];
                brush.addFrame(frame[0], frame[1], frame[2], frame[3], frame[5], frame[6]);
            }
        }
        // Parse named anims
        var anims = item.AN;
        if (anims !== undefined && anims.length !== 0)
        {
            for (var t = 0; t < anims.length; t++)
            {
                brush.addAnim(anims[t].N, anims[t].F, anims[t].S);
            }
        }
    }
    else
    {
        // Parse colour stops
        var stops = item.ST;
        brush = new b5.Gradient(item.N);
        for (var t = 0; t < stops.length; t++)
        {
            var stop = stops[t];
            brush.addColourStop(stop.c, stop.o);
        }
        if (item.Angle !== undefined)
            brush.angle = item.Angle;
    }
    parent.addResource(brush, "brush");

    return brush;
};
b5.Xoml.prototype.parseRaw = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Raw " + item.N);
    var raw = new b5.Raw(item.N, item.Loc, item.P);
    parent.addResource(raw, "raw");

    return raw;
};
b5.Xoml.prototype.parseImage = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Image " + item.N);
    var bitmap = new b5.Bitmap(item.N, item.Loc, item.P);
    parent.addResource(bitmap, "bitmap");

    return bitmap;
};
b5.Xoml.prototype.parseSound = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Sound " + item.N);
    var sound = new b5.Sound(item.N, item.Loc, item.R);
    if (item.P !== undefined)
        sound.preload = item.P == 1;
    if (item.A !== undefined)
        sound.auto_play = item.A == 1;
    if (item.Loc2 !== undefined)
        sound.location2 = item.Loc2;
    if (item.L !== undefined)
        sound.loop = item.L == 1;
    if (sound.preload) sound.load();
    parent.addResource(sound, "sound");

    return sound;
};
b5.Xoml.prototype.parseFont = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Font " + item.Name);
    var font = new b5.Font(item.Name, item.Name, item.Preload);
    parent.addResource(font, "font");
};
b5.Xoml.prototype.parseShape = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Shape " + item.N);
    var shape = new b5.Shape(item.N);
    shape.width = item.W;
    shape.height = item.H;
    if (item.ST === "Circle")
        shape.type = b5.Shape.TypeCircle;
    else if (item.ST === "Box")
        shape.type = b5.Shape.TypeBox;
    else if (item.ST === "Polygon")
    {
        shape.type = b5.Shape.TypePolygon;
        // Get vertices (use by clipping and visuals)
        var vertices = item.V;
        var count = vertices.length;
        for (var t = 0; t < count; t++)
            shape.vertices.push(vertices[t]);
        // Get convex vertices (used by physics fixtures)
        if (item.CV !== undefined)
        {
            var pc = item.CV.length;
            for (var t = 0; t < pc; t++)
            {
                var ov = [];
                var vertices = item.CV[t];
                count = vertices.length;
                for (var s = 0; s < count; s++)
                    ov.push(vertices[s]);
                shape.convexVertices.push(ov);
            }
        }
    }

    parent.addResource(shape, "shape");

    return shape;
};
b5.Xoml.prototype.parseMaterial = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Material " + item.N);

    var material = new b5.Material();
    material.name = item.N;
    material.type = item.MT;
    material.density = item.D;
    material.friction = item.F;
    material.restitution = item.R;
    material.gravity_scale = item.GS;
    material.fixed_rotation = item.FR;
    material.is_bullet = item.IB;

    parent.addResource(material, "material");

    return material;
};

b5.Xoml.prototype.parseTimeline = function(parent, item)
{
    var timeline = new b5.Timeline();
    if (item.N !== undefined) timeline.name = item.N;
    var count = item.A.length;
    for (var t = 0; t < count; t++)
    {
        var animation = item.A[t];
        var anim = new b5.Animation(timeline, parent, animation.P, animation.V, animation.TI, 0, animation.E);
        if (animation.T !== undefined)
            anim.tween = animation.T;
        if (animation.D !== undefined)
            anim.destroy = animation.D;
        if (animation.R !== undefined)
            anim.repeat = animation.R;
        anim.repeats_left = anim.repeat;
        if (animation.TS !== undefined)
            anim.time_scale = animation.TS;
        if (animation.DA !== undefined)
            anim.deactivate = animation.DA;
        if (animation.DE !== undefined)
            anim.delay = -animation.DE;
        if (animation.A === false)
            anim.pause();
        if (animation.OnE !== undefined)
            anim.onEnd = Function(animation.OnE);
        if (animation.OnR !== undefined)
            anim.onRepeat = Function(animation.OnR);
            
        if (animation.AC !== undefined)
        {
            for (var t2 = 0; t2 < animation.AC.length; t2++)
            {
                if (animation.Actions[t2] !== "")
                {
                    var act = animation.AC[t2];
                    anim.setAction(t2, Function(act));
                }
            }
        }
        timeline.anims.push(anim);
    }
    parent.timelines.add(timeline);
};

b5.Xoml.prototype.parseActionsList = function(parent, item)
{
    var al = new b5.ActionsList();
    if (item.N !== undefined) al.name = item.N;
    if (item.R !== undefined)
    {
        al.repeats_left = item.R;
        al.repeat = item.R;
    }
    al.destroy = false;
    var actions = item.A;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        var action;
        var name = actions[t][0];
        if (name === "Custom")
        {
            name = actions[t][1];
            actions[t].splice(0, 1);
        }
        action = b5.ActionsRegister.create(name, actions[t]);
        al.actions.push(action);
    }
    if (item.P !== undefined && item.P)
        al.play();
    parent.actions.add(al);
};

b5.Xoml.prototype.parseActor = function(actor, parent, item)
{
    var brush = null;
    actor.scene = this.current_scene;
    if (item.N !== undefined) actor.name = item.N;
    if (item.T !== undefined) actor.tag = item.T;
    if (item.V !== undefined) actor.visible = item.V;
    if (item.Ac !== undefined) actor.active = item.Ac;
    if (item.L !== undefined) actor.layer = item.L;
    if (item.P !== undefined)
    {
        actor.x = item.P[0];
        actor.y = item.P[1];
    }
    if (item.S !== undefined)
    {
        actor.scale_x = item.S[0];
        actor.scale_y = item.S[1];
    }
    if (item.SM !== undefined) actor.scale_method = item.SM;
    if (item.FX !== undefined && item.FX) actor.scale_x = -actor.scale_x;
    if (item.FY !== undefined && item.FY) actor.scale_y = -actor.scale_y;
    if (item.Or !== undefined) actor.orphaned = item.Or;
    if (item.A !== undefined) actor.rotation = item.A;
    if (item.C !== undefined) actor.fill_style = item.C;
    if (item.SC !== undefined) actor.stroke_style = item.SC;
    if (item.F !== undefined) actor.filled = item.F;
    if (item.FS !== undefined) actor.stroke_filled = item.FS;
    if (item.Th !== undefined) actor.stroke_thickness = item.Th;
    if (item.Sz !== undefined)
    {
        actor.w = item.Sz[0];
        actor.h = item.Sz[1];
        actor.ow = item.Sz[0];
        actor.oh = item.Sz[1];
    }
    if (item.O !== undefined)
    {
        actor.ox = item.O[0];
        actor.oy = item.O[1];
    }
    if (actor.ox <= -1 || actor.ox >= 1 || actor.oy <= -1 || actor.oy >= 1) actor.absolute_origin = true; else actor.absolute_origin = false;
    if (item.Al !== undefined) actor.opacity = item.Al;
    if (item.SAl !== undefined) actor.stroke_opacity = item.SAl;
    if (item.UPO !== undefined) actor.use_parent_opacity = item.UPO;
    if (item.D !== undefined) actor.depth = item.D;
    actor.use_transform = true;
    if (item.Ve !== undefined)
    {
        actor.vx = item.Ve[0];
        actor.vy = item.Ve[1];
    }
    if (item.AV !== undefined) actor.vr = item.AV;
    if (item.VD !== undefined)
    {
        actor.vx_damping = item.VD[0];
        actor.vy_damping = item.VD[1];
    }
    if (item.AVD !== undefined) actor.vr_damping = item.AVD;
    if (item.WP !== undefined)	actor.wrap_position = item.WP;
    if (item.IC !== undefined)	actor.ignore_camera = item.IC;
    if (item.CC !== undefined)	actor.clip_children = item.CC;
    if (item.To !== undefined) actor.touchable = item.To;
    if (item.Ht !== undefined) actor.hit = item.Ht;
    if (item.Bu !== undefined)	actor.bubbling = item.Bu;
    if (item.Do !== undefined)
    {
        var docking = item.Do;
        if (item.Dse !== undefined)
            actor.dock_screen = item.Dse;
        if (docking === "top" || docking === "topleft" || docking === "topright")
            actor.dock_y = b5.Actor.Dock_Top;
        else if (docking === "bottom" || docking === "bottomleft" || docking === "bottomright")
            actor.dock_y = b5.Actor.Dock_Bottom;
        if (docking === "left" || docking === "topleft" || docking === "bottomleft")
            actor.dock_x = b5.Actor.Dock_Left;
        else if (docking === "right" || docking === "topright" || docking === "bottomright")
            actor.dock_x = b5.Actor.Dock_Right;
    }
    if (item.M !== undefined)
    {
        actor.margin[0] = item.M[0];
        actor.margin[1] = item.M[1];
        actor.margin[2] = item.M[2];
        actor.margin[3] = item.M[3];
    }
    if (item.CM !== undefined)
    {
        actor.clip_margin[0] = item.CM[0];
        actor.clip_margin[1] = item.CM[1];
        actor.clip_margin[2] = item.CM[2];
        actor.clip_margin[3] = item.CM[3];
    }
    if (item.Sh !== undefined)
        actor.shadow = item.Sh;
    if (item.ShO !== undefined)
    {
        actor.shadow_x = item.ShO[0];
        actor.shadow_y = item.ShO[1];
    }
    if (item.ShB !== undefined)
        actor.shadow_blur = item.ShB;
    if (item.ShC !== undefined)
        actor.shadow_colour = item.ShC;
    if (item.CO !== undefined)
        actor.composite_op = item.CO;
    if (item.BG !== undefined)
    {
        brush = this.current_scene.findResource(item.BG, "brush");
        if (brush.stops !== undefined)
        {
            var gs = {x:0,y:0};
            var ge = {x:0,y:1};
            if (item.GS !== undefined) { gs.x = item.GS[0]; gs.y = item.GS[1]; }
            if (item.GE !== undefined) { ge.x = item.GE[0]; ge.y = item.GE[1]; }
            var grad = brush.createStyle(actor.w, actor.h, gs, ge);
            if (actor.filled)
                actor.fill_style = grad;
            else
            if (actor.stroke_filled)
                actor.stroke_style = grad;
        }
        else
            actor.atlas = brush;
    }

    if (item.Pd !== undefined)
        actor.padding = item.Pd;

    if (item.DA !== undefined && brush !== null)
    {
        actor.playAnim(item.DA);
    }

    // Load tile map info
    if (item.RA === 3)
    {
        var tiles_x = item.TX;
        var tiles_y = item.TY;
        actor.map_width = item.MW;
        actor.map_height = item.MH;
        actor.tile_width = item.TW;
        actor.tile_height = item.TH;
        actor.display_width = item.DW;
        actor.display_height = item.DH;
        actor.map = item.Map;
        actor.collision_map = item.CMap;
        actor.generateTiles(tiles_x * tiles_y, actor.tile_width, actor.tile_height, actor.tile_width * tiles_x);
    }

    if (parent !== null)
        parent.addActor(actor);

    // Parse actions
    if (item.OnC !== undefined)
        actor.onCreate = Function(item.OnC);
    if (item.OnD !== undefined)
        actor.onDestroy = Function(item.OnD);
    if (item.OnTi !== undefined)
        actor.onTick = Function("dt", item.OnTi);
    if (item.OnT !== undefined)
    {
        actor.touchable = true;
        actor.onTapped = Function("touch_pos", item.OnT);
    }
    if (item.OnB !== undefined)
    {
        actor.touchable = true;
        actor.onBeginTouch = Function("touch_pos", item.OnB);
    }
    if (item.OnE !== undefined)
    {
        actor.touchable = true;
        actor.onEndTouch = Function("touch_pos", item.OnE);
    }
    if (item.OnM !== undefined)
    {
        actor.touchable = true;
        actor.onMoveTouch = Function("touch_pos", item.OnM);
    }
    if (item.OnL !== undefined)
    {
        actor.touchable = true;
        actor.onLostTouchFocus = Function("touch_pos", item.OnL);
    }
    if (item.OnH !== undefined)
        actor.onHover = Function("touch_pos", item.OnH);
    if (item.OnHE !== undefined)
        actor.onHoverEnd = Function("touch_pos", item.OnHE);
    if (item.OnCS !== undefined)
        actor.onCollisionStart = Function("contact", item.OnCS);
    if (item.OnCE !== undefined)
        actor.onCollisionEnd = Function("contact", item.OnCE);

    // Parse user properties
    var user_props = item.UP;
    if (user_props !== undefined)
    {
        for (var t = 0; t < user_props.length; t++)
            actor[user_props[t].N] = user_props[t].V;
    }

    // Parse physics fixtures
    var fixtures = item.Fxs;
    if (fixtures !== undefined)
    {
        for (var t = 0; t < fixtures.length; t++)
        {
            var options = {};
            var material = null;
            var shape = null;
            if (fixtures[t].M !== undefined && fixtures[t].M !== "")
                material = this.current_scene.findResource(fixtures[t].M, "material");
            if (fixtures[t].S !== undefined && fixtures[t].S !== "")
                shape = this.current_scene.findResource(fixtures[t].S, "shape");
            if (t === 0)
                actor.initBody(material.type, material.fixed_rotation, material.is_bullet);
            // NOTE: if no physics shape attached bu the actor is under control of physics then a default fixture will
            // be attached. if the actor is circular in shape then a circular fixture will be used otherwise a box
            // shape will be used.
            if (shape === null)
            {
                if (item.RA === 1)
                {
                    options.type = b5.Shape.TypeCircle;
                    options.width = actor.w / 2;
                }
                else
                {
                    options.type = b5.Shape.TypeBox;
                    options.width = actor.w;
                    options.height = actor.h;
                }
            }
            else
                options.shape = shape;
            if (material !== null)
                options.material = material;
            options.is_sensor = fixtures[t].R;
            if (fixtures[t].C !== undefined)
            {
                options.collision_category = fixtures[t].C[0];
                options.collision_mask = fixtures[t].C[1];
                options.collision_group = fixtures[t].C[2];
            }
            actor.addFixture(options);
        }
    }

    // Parse physics joints
    var joints = item.Jts;
    if (joints !== undefined)
    {
        for (var t = 0; t < joints.length; t++)
        {
            var options = [];
            var actor_b = this.current_scene.findActor(joints[t].AB);
            options.type = joints[t].T;
            options.actor_b = actor_b;
            options.anchor_a = {x:joints[t].OA[0], y:joints[t].OA[1]};
            options.anchor_b = {x:joints[t].OB[0], y:joints[t].OB[1]};
            options.self_collide = joints[t].SC;
            options.damping = joints[t].D;
            options.frequency = joints[t].F;
            options.limit_joint = joints[t].LJ;
            options.lower_limit = joints[t].LL;
            options.upper_limit = joints[t].UL;
            options.motor_enabled = joints[t].ME;
            options.motor_speed = joints[t].MS;
            options.max_motor_torque = joints[t].MT;
            options.max_motor_force = joints[t].MF;
            options.ground_a = {x:joints[t].GA[0], y:joints[t].GA[1]};
            options.ground_b = {x:joints[t].GB[0], y:joints[t].GB[1]};
            options.axis = {x:joints[t].A[0], y:joints[t].A[1]};
            options.ratio = joints[t].R;
            actor.addJoint(options);
        }
    }

    // Parse pre-defined animation timelines
    var tc = item.TC;
    if (tc !== undefined)
    {
        for (var t = 0; t < tc.length; t++)
            this.parseTimeline(actor, tc[t]);
    }

    // Parse actions lists
    var al = item.AL;
    if (al !== undefined)
    {
        for (var t = 0; t < al.length; t++)
            this.parseActionsList(actor, al[t]);
    }

    if (actor.body !== null)
    {
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        actor.body.SetLinearVelocity(new b2Vec2(actor.vx, actor.vy));
        actor.body.SetAngularVelocity(actor.vr);
        actor.body.SetLinearDamping(actor.vx_damping);
        actor.body.SetAngularDamping(actor.vr_damping);
    }

    if (item.Cn !== undefined)
        this.parseResources(actor, item.Cn);

    return actor;
};
b5.Xoml.prototype.parseIcon = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Icon " + item.N);

    var actor;
    var render_as = 0;
    if (item.RA !== undefined)
        render_as = item.RA;

    if (render_as === 1)	// Circle
        actor = new b5.ArcActor();
    else if (render_as === 2)	// Rectangle
        actor = new b5.RectActor();
    else if (render_as === 3)	// Tile Map
        actor = new b5.MapActor();
    else if (render_as === 0)	// Normal
    {
        if (item.Geo !== undefined)
        {
            actor = new b5.PolygonActor();
            var shape = this.current_scene.findResource(item.Geo, "shape");
            if (shape !== null)
                actor.points = shape.vertices;
        }
        else
            actor = new b5.Actor();
    }
    if (item.CR !== undefined) actor.corner_radius = item.CR;

    this.parseActor(actor, parent, item);

    if (render_as === 1)	// Circle
        actor.radius = actor.w / 2;

    if (item.Vi !== undefined && item.Vi) 	// Has virtual canvas
    {
        actor.makeVirtual();
        if (item.SR !== undefined)
        {
            actor.scroll_range[0] = item.SR[0];
            actor.scroll_range[1] = item.SR[1];
            actor.scroll_range[2] = item.SR[2];
            actor.scroll_range[3] = item.SR[3];
        }
        if (item.SPos !== undefined)
        {
            actor.scroll_pos_x = item.SPos[0];
            actor.scroll_pos_y = item.SPos[1];
        }
    }

    if (item.IAS !== undefined)
        actor.ignore_atlas_size = item.IAS;
    if (item.SCl !== undefined)
        actor.self_clip = item.SCl;
    if (item.CS !== undefined)
        actor.clip_shape = this.current_scene.findResource(item.CS, "shape");

    if (item.Ca === true)
        actor.cache = true;
    if (item.Me === true)
        actor.merge_cache = true;
    if (item.Rd === true)
        actor.round_pixels = true;

    if (actor.onCreate !== undefined)
        actor.onCreate();

    return actor;
};
b5.Xoml.prototype.parseLabel = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Label " + item.N);

    var actor = new b5.LabelActor();
    actor.text = item.Text;
    actor.font = item.Font;
    actor.text_align = item.AlignH;
    actor.text_baseline = item.AlignV;
    this.parseActor(actor, parent, item);

    if (item.Lh !== undefined)
        actor.line_height = item.Lh;
    if (item.Ca === true)
        actor.cache = true;
    if (item.Me === true)
        actor.merge_cache = true;
    if (item.Rd === true)
        actor.round_pixels = true;

    if (actor.onCreate !== undefined)
        actor.onCreate();

    return actor;
};

/**
 * Recursively parses all XOML JSON resource instantiating all Booty5 objects that it contains
 * @param parent {object} Object that will receive the created objects, for example the app or a scene
 * @param resource {object} XOML JSON object to parse
 */
b5.Xoml.prototype.parseResources = function(parent, objects)
{
    var count = objects.length;
    for (var t = 0; t < count; t++)
        this.parseResource(parent, objects[t]);
};

/**
 * Parses a specific XOML JSON resource and instantiates all Booty5 objects that it contains
 * @param parent {object} Object that will receive the created objects, for example the app or a scene
 * @param resource {object} XOML JSON object to parse
 * @returns {object} Created object (may also contain sub objects / resources)
 */
b5.Xoml.prototype.parseResource = function(parent, resource)
{
    var res_type = resource.RT;
    if (res_type === "Scene")
        return this.parseScene(parent, resource);
    else if (res_type === "Brush")
        return this.parseBrush(parent, resource);
    else if (res_type === "Image")
        return this.parseImage(parent, resource);
    else if (res_type === "Sound")
        return this.parseSound(parent, resource);
    else if (res_type === "Font")
        return this.parseFont(parent, resource);
    else if (res_type === "Shape")
        return this.parseShape(parent, resource);
    else if (res_type === "Material")
        return this.parseMaterial(parent, resource);
    else if (res_type === "Icon")
        return this.parseIcon(parent, resource);
    else if (res_type === "Label")
        return this.parseLabel(parent, resource);
    else if (res_type === "GFile")
        return this.parseRaw(parent, resource);
    return null;
};

/**
 * Searches the XOML resource collection to find a specific resource
 * @param objects {object}  The XOML JSON object
 * @param name {string}     The namke of the resource / object to find
 * @param type {string}     Type of resource / object (Scene, Brush, Image, Sound, Shape, Material, Icon, label)
 * @returns {object}        The found object or null if not found
 */
b5.Xoml.findResource = function(objects, name, type)
{
    // If object has children then search child list instead
    if (objects.Cn !== undefined)
        objects = objects.Cn;

    var count = objects.length;
    for (var t = 0; t < count; t++)
    {
        if (objects[t].RT.toLowerCase() === type && objects[t].N === name)
            return objects[t];
    }
    return null;
};

