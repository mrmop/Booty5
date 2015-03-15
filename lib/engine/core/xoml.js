/**
/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// The Xoml class loads a XOML format JSON (exported from the Goji Editor game IDE) and turns it into Booty5 compatible objects
//
b5.Xoml = function(app)
{
    // Internal variables
    this.current_scene = null;      // Current scene
    this.app = app;                 // The parent app
};

b5.Xoml.loadJSON = function(filename, blocking, callback)
{
    var req = new XMLHttpRequest();
    req.open("GET", filename, !blocking);
    if (!blocking)
    {
        req.onreadystatechange = function()
        {
            if (req.readyState === 4 && req.status === 200)
                callback(req.responseText);
            else
                callback(null);
        };
    }
    req.send();
    if (blocking)
    {
        if (req.status === 200)
            callback(req.responseText);
        else
            callback(null);
    }
};

b5.Xoml.loadJS = function(filename)
{
    var fileref = document.createElement('script');
    fileref.setAttribute("type","text/javascript");
    fileref.setAttribute("src", filename);

    if (typeof fileref !== "undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref);
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
    scene.x = item.Position.x;
    scene.y = item.Position.y;
    if (item.CanvasSize !== undefined)
    {
        scene.w = item.CanvasSize.x;
        scene.h = item.CanvasSize.y;
    }
    if (item.Layer !== undefined) scene.layer = item.Layer;
    if (item.Visible !== undefined) scene.visible = item.Visible;
    if (item.Active !== undefined) scene.active = item.Active;
    if (item.Physics !== undefined && item.Physics)
    {
        scene.initWorld(item.Gravity.x, item.Gravity.y, item.DoSleep);
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
    scene.extents[0] = item.Extents.x;
    scene.extents[1] = item.Extents.y;
    scene.extents[2] = item.Extents.w;
    scene.extents[3] = item.Extents.h;

    scene.follow_speedx = item.FollowSpeed.x;
    scene.follow_speedy = item.FollowSpeed.y;

    // Parse user properties
    var user_props = item.UserProps;
    if (user_props !== undefined)
    {
        for (var t = 0; t < user_props.length; t++)
            scene[user_props[t].Name] = user_props[t].Value;
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

    if (!(item.Children === undefined))
        this.parseResources(scene, item.Children);

    if (item.ClipShape !== undefined && item.ClipShape !== "")
        scene.clip_shape = scene.findResource(item.ClipShape, "shape");

    if (item.TargetX !== "")
        scene.target_x = scene.findActor(item.TargetX);
    if (item.TargetY !== "")
        scene.target_y = scene.findActor(item.TargetY);
    if (item.VelocityDamping !== undefined)
    {
        scene.vx_damping = item.VelocityDamping.x;
        scene.vy_damping = item.VelocityDamping.y;
    }

    // Parse actions
    if (item.OnCreate !== undefined)
        scene.onCreate = function() { eval(item.OnCreate); };
    if (item.OnDestroy !== undefined)
        scene.onDestroy = function() { eval(item.OnDestroy); };
    if (item.OnTick !== undefined)
        scene.onTick = function(dt) { eval(item.OnTick); };
    if (item.OnTapped !== undefined)
        scene.onTapped = function(touch_pos) { eval(item.OnTapped); };
    if (item.OnBeginTouch !== undefined)
        scene.onBeginTouch = function(touch_pos) { eval(item.OnBeginTouch); };
    if (item.OnEndTouch !== undefined)
        scene.onEndTouch = function(touch_pos) { eval(item.OnEndTouch); };
    if (item.OnMoveTouch !== undefined)
        scene.onMoveTouch = function(touch_pos) { eval(item.OnMoveTouch); };
    if (item.OnKeyPress !== undefined)
        scene.onKeyPress = function(e) { eval(item.OnKeyPress); };
    if (item.OnKeyDown !== undefined)
        scene.onKeyDown = function(e) { eval(item.OnKeyDown); };
    if (item.OnKeyUp !== undefined)
        scene.onKeyUp = function(e) { eval(item.OnKeyUp); };

    if (scene.onCreate !== undefined)
        scene.onCreate();

    return scene;
};
b5.Xoml.prototype.parseBrush = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Brush " + item.Name);
    var brush;
    if (item.BrushType === 0)
    {
        var rect = item.Rect;
        var bitmap = parent.findResource(item.Image, "bitmap")
        var frames = item.Frames;
        if (frames.length === 0)
            brush = new b5.ImageAtlas(item.Name, bitmap, rect.x, rect.y, rect.w, rect.h);
        else
        {
            // Parse frames
            brush = new b5.ImageAtlas(item.Name, bitmap);
            for (var t = 0; t < frames.length; t++)
            {
                var frame = frames[t];
                brush.addFrame(frame.x, frame.y, frame.w, frame.h);
            }
        }
    }
    else
    {
        // Parse colour stops
        var stops = item.Stops;
        brush = new b5.Gradient(item.Name);
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
b5.Xoml.prototype.parseImage = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Image " + item.Name);
    var bitmap = new b5.Bitmap(item.Name, item.Location, item.Preload);
    parent.addResource(bitmap, "bitmap");

    return bitmap;
};
b5.Xoml.prototype.parseSound = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Sound " + item.Name);
    var sound = new b5.Sound(item.Name, item.Location, item.Reuse);
    if (item.Preload !== undefined)
        sound.preload = item.Preload;
    if (item.Location2 !== undefined)
        sound.location2 = item.Location2;
    if (item.Loop !== undefined)
        sound.loop = item.Loop;
    if (sound.preload) sound.load();
    parent.addResource(sound, "sound");

    return sound;
};
b5.Xoml.prototype.parseFont = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Font " + item.Name);
};
b5.Xoml.prototype.parseShape = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Shape " + item.Name);
    var shape = new b5.Shape(item.Name);
    shape.width = item.Width;
    shape.height = item.Height;
    if (item.ShapeType === "Circle")
        shape.type = b5.Shape.TypeCircle;
    else if (item.ShapeType === "Box")
        shape.type = b5.Shape.TypeBox;
    else if (item.ShapeType === "Polygon")
    {
        shape.type = b5.Shape.TypePolygon;
        // Get vertices (use by clipping and visuals)
        var vertices = item.Vertices;
        var count = vertices.length;
        for (var t = 0; t < count; t++)
            shape.vertices.push(vertices[t]);
        // Get convex vertices (used by physics fixtures)
        if (item.ConvexVertices !== undefined)
        {
            var pc = item.ConvexVertices.length;
            for (var t = 0; t < pc; t++)
            {
                var ov = [];
                var vertices = item.ConvexVertices[t];
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
        console.log("Parsing Material " + item.Name);

    var material = new b5.Material();
    material.name = item.Name;
    material.type = item.MaterialType;
    material.density = item.Density;
    material.friction = item.Friction;
    material.restitution = item.Restitution;
    material.gravity_scale = item.GravityScale;
    material.fixed_rotation = item.FixedRotation;
    material.is_bullet = item.IsBullet;

    parent.addResource(material, "material");

    return material;
};

b5.Xoml.prototype.parseTimeline = function(parent, item)
{
    var timeline = new b5.Timeline();
    if (item.Name !== undefined) timeline.name = item.Name;
    var count = item.Animations.length;
    for (var t = 0; t < count; t++)
    {
        var animation = item.Animations[t];
        var anim = new b5.Animation(timeline, parent, animation.Property, animation.Values, animation.Times, 0, animation.Ease);
        if (animation.Tween !== undefined)
            anim.tween = animation.Tween;
        if (animation.Destroy !== undefined)
            anim.destroy = animation.Destroy;
        if (animation.Repeat !== undefined)
            anim.repeat = animation.Repeat;
        anim.repeats_left = anim.repeat;
        if (animation.TimeScale !== undefined)
            anim.time_scale = animation.TimeScale;
        if (animation.Delay !== undefined)
            anim.time = -animation.Delay;
        if (animation.AutoPlay === false)
            anim.pause();
        if (animation.OnEnd !== undefined)
            anim.onEnd = function() { eval(animation.OnEnd); };
        if (animation.OnRepeat !== undefined)
            anim.onRepeat = function() { eval(animation.OnRepeat); };
        if (animation.Actions !== undefined)
        {
            for (var t2 = 0; t2 < animation.Actions.length; t2++)
            {
                if (animation.Actions[t2] !== "")
                {
                    var act = animation.Actions[t2];
                    anim.setAction(t2, function() { eval(act); });
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
    if (item.Name !== undefined) al.name = item.Name;
    if (item.Repeat !== undefined)
    {
        al.repeats_left = item.Repeat;
        al.repeat = item.Repeat;
    }
    al.destroy = false;
    var actions = item.Actions;
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
    if (item.Play !== undefined && item.Play)
        al.play();
    parent.actions.add(al);
};

b5.Xoml.prototype.parseActor = function(actor, parent, item)
{
    if (this.app.debug)
        console.log("Parsing Actor " + item.Name);

    var brush = null;
    actor.scene = this.current_scene;
    if (item.Name !== undefined) actor.name = item.Name;
    if (item.Tag !== undefined) actor.tag = item.Tag;
    if (item.Visible !== undefined) actor.visible = item.Visible;
    if (item.Active !== undefined) actor.active = item.Active;
    if (item.Layer !== undefined) actor.layer = item.Layer;
    if (item.Position !== undefined)
    {
        actor.x = item.Position.x;
        actor.y = item.Position.y;
    }
    if (item.Scale !== undefined)
    {
        actor.scale_x = item.Scale.x;
        actor.scale_y = item.Scale.y;
    }
    if (item.FlipX !== undefined && item.FlipX) actor.scale_x = -actor.scale_x;
    if (item.FlipY !== undefined && item.FlipY) actor.scale_y = -actor.scale_y;
    if (item.Orphan !== undefined) actor.orphaned = item.Orphan;
    if (item.Angle !== undefined) actor.rotation = item.Angle;
    if (item.Colour !== undefined) actor.fill_style = item.Colour;
    if (item.StrokeColour !== undefined) actor.stroke_style = item.StrokeColour;
    if (item.Filled !== undefined) actor.filled = item.Filled;
    if (item.Thickness !== undefined) actor.stroke_thickness = item.Thickness;
    if (item.Size !== undefined)
    {
        actor.w = item.Size.x;
        actor.h = item.Size.y;
    }
    if (item.Origin !== undefined)
    {
        actor.ox = item.Origin.x;
        actor.oy = item.Origin.y;
    }
    if (actor.ox <= -1 || actor.ox >= 1 || actor.oy <= -1 || actor.oy >= 1) actor.absolute_origin = true;
    if (item.Alpha !== undefined) actor.opacity = item.Alpha;
    if (item.UseParentOpacity !== undefined) actor.use_parent_opacity = item.UseParentOpacity;
    if (item.Depth !== undefined) actor.depth = item.Depth;
    actor.use_transform = true;
    if (item.Velocity !== undefined)
    {
        actor.vx = item.Velocity.x;
        actor.vy = item.Velocity.y;
    }
    if (item.AngularVelocity !== undefined) actor.vr = item.AngularVelocity;
    if (item.VelocityDamping !== undefined)
    {
        actor.vx_damping = item.VelocityDamping.x;
        actor.vy_damping = item.VelocityDamping.y;
    }
    if (item.AngularVelocityDamping !== undefined) actor.vr_damping = item.AngularVelocityDamping;
    if (item.WrapPosition !== undefined)	actor.wrap_position = item.WrapPosition;
    if (item.IgnoreCamera !== undefined)	actor.ignore_camera = item.IgnoreCamera;
    if (item.ClipChildren !== undefined)	actor.clip_children = item.ClipChildren;
    if (item.Touchable !== undefined) actor.touchable = item.Touchable;
    if (item.Bubbling !== undefined)	actor.bubbling = item.Bubbling;
    if (item.Docking !== undefined)
    {
        var docking = item.Docking;
        if (docking === "top" || docking === "topleft" || docking === "topright")
            actor.dock_y = b5.Actor.Dock_Top;
        else if (docking === "bottom" || docking === "bottomleft" || docking === "bottomright")
            actor.dock_y = b5.Actor.Dock_Bottom;
        if (docking === "left" || docking === "topleft" || docking === "bottomleft")
            actor.dock_x = b5.Actor.Dock_Left;
        else if (docking === "right" || docking === "topright" || docking === "bottomright")
            actor.dock_x = b5.Actor.Dock_Right;
    }
    if (item.Margin !== undefined)
    {
        actor.margin[0] = item.Margin.x;
        actor.margin[1] = item.Margin.y;
        actor.margin[2] = item.Margin.w;
        actor.margin[3] = item.Margin.h;
    }
    if (item.ClipMargin !== undefined)
    {
        actor.clip_margin[0] = item.ClipMargin.x;
        actor.clip_margin[1] = item.ClipMargin.y;
        actor.clip_margin[2] = item.ClipMargin.w;
        actor.clip_margin[3] = item.ClipMargin.h;
    }
    if (item.Shadow !== undefined)
        actor.shadow = item.Shadow;
    if (item.ShadowOffset !== undefined)
    {
        actor.shadow_x = item.ShadowOffset.x;
        actor.shadow_y = item.ShadowOffset.y;
    }
    if (item.ShadowBlur !== undefined)
        actor.shadow_blur = item.ShadowBlur;
    if (item.ShadowColour !== undefined)
        actor.shadow_colour = item.ShadowColour;
    if (item.CompositeOp !== undefined)
        actor.composite_op = item.CompositeOp;
    if (item.Frames !== undefined && item.Frames.length > 0)
    {
        var frames = item.Frames;
        var count = frames.length;
        actor.anim_frames = [];
        for (var t = 0; t < count; t++)
            actor.anim_frames.push(frames[t]);
    }
    if (item.AnimSpeed !== undefined) actor.frame_speed = item.AnimSpeed;
    if (item.StartFrame !== undefined) actor.current_frame = item.StartFrame;

    if (item.Background !== undefined)
    {
        brush = this.current_scene.findResource(item.Background, "brush");
        if (brush.stops !== undefined)
        {
            var grad = brush.createStyle(actor.w, actor.h, item.GStart, item.GEnd);
            if (actor.filled)
                actor.fill_style = grad;
            else
                actor.stroke_style = grad;
        }
        else
            actor.atlas = brush;
    }

    if (parent !== null)
        parent.addActor(actor);

    // Parse actions
    if (item.OnCreate !== undefined)
        actor.onCreate = function() { eval(item.OnCreate); };
    if (item.OnDestroy !== undefined)
        actor.onDestroy = function() { eval(item.OnDestroy); };
    if (item.OnTick !== undefined)
        actor.onTick = function(dt) { eval(item.OnTick); };
    if (item.OnTapped !== undefined)
    {
        actor.touchable = true;
        actor.onTapped = function(touch_pos) { eval(item.OnTapped); }
    }
    if (item.OnBeginTouch !== undefined)
    {
        actor.touchable = true;
        actor.onBeginTouch = function(touch_pos) { eval(item.OnBeginTouch); }
    }
    if (item.OnEndTouch !== undefined)
    {
        actor.touchable = true;
        actor.onEndTouch = function(touch_pos) { eval(item.OnEndTouch); }
    }
    if (item.OnMoveTouch !== undefined)
    {
        actor.touchable = true;
        actor.onMoveTouch = function(touch_pos) { eval(item.OnMoveTouch); }
    }
    if (item.OnLostTouchFocus !== undefined)
    {
        actor.touchable = true;
        actor.onLostTouchFocus = function(touch_pos) { eval(item.OnLostTouchFocus); }
    }
    if (item.OnCollisionStart !== undefined)
        actor.onCollisionStart = function(contact) { eval(item.OnCollisionStart); };
    if (item.OnCollisionEnd !== undefined)
        actor.onCollisionEnd = function(contact) { eval(item.OnCollisionEnd); };

    // Parse user properties
    var user_props = item.UserProps;
    if (user_props !== undefined)
    {
        for (var t = 0; t < user_props.length; t++)
            actor[user_props[t].Name] = user_props[t].Value;
    }

    // Parse physics fixtures
    var fixtures = item.Fixtures;
    if (fixtures !== undefined)
    {
        for (var t = 0; t < fixtures.length; t++)
        {
            var options = {};
            var material = null;
            var shape = null;
            if (fixtures[t].Material !== undefined && fixtures[t].Material !== "")
                material = this.current_scene.findResource(fixtures[t].Material, "material");
            if (fixtures[t].Shape !== undefined && fixtures[t].Shape !== "")
                shape = this.current_scene.findResource(fixtures[t].Shape, "shape");
            if (t === 0)
                actor.initBody(material.type, material.fixed_rotation, material.is_bullet);
            // NOTE: if no physics shape attached bu the actor is under control of physics then a default fixture will
            // be attached. if the actor is circular in shape then a circular fixture will be used otherwise a box
            // shape will be used.
            if (shape === null)
            {
                if (item.RenderAs === 1)
                {
                    options.type = b5.Shape.TypeCircle;
                    options.radius = actor.w / 2 * actor.scale_x;
                }
                else
                {
                    options.type = b5.Shape.TypeBox;
                    options.width = actor.w * actor.scale_x;
                    options.height = actor.h * actor.scale_y;
                }
            }
            else
            {
                if (shape.type === b5.Shape.TypePolygon)
                {
                    if (shape.convexVertices.length > 0)
                    {
                        options.convexPoints = [];
                        for (var s = 0; s < shape.convexVertices.length; s++)
                        {
                            var points = [];
                            var v = shape.convexVertices[s];
                            for (var i = 0; i < v.length; i += 2)
                            {
                                points.push(v[i] * actor.scale_x);
                                points.push(v[i + 1] * actor.scale_y);
                            }
                            options.convexPoints.push(points);
                        }
                    }
                    else
                    {
                        options.points = [];
                        for (var i = 0; i < shape.vertices.length; i += 2)
                        {
                            options.points.push(shape.vertices[i] * actor.scale_x);
                            options.points.push(shape.vertices[i + 1] * actor.scale_y);
                        }
                    }
                }
                else
                if (shape.type === b5.Shape.TypeCircle)
                    options.radius = shape.width * actor.scale_x;
                else
                {
                    options.width = shape.width * actor.scale_x;
                    options.height = shape.height * actor.scale_y;
                }
                options.type = shape.type;
            }
            if (material !== null)
            {
                options.density = material.density;
                options.friction = material.friction;
                options.restitution = material.restitution;
            }
            options.is_sensor = fixtures[t].Sensor;
            actor.addFixture(options);
        }
    }

    // Parse physics joints
    var joints = item.Joints;
    if (joints !== undefined)
    {
        for (var t = 0; t < joints.length; t++)
        {
            var options = [];
            var actor_b = this.current_scene.findActor(joints[t].ActorB);
            options.type = joints[t].Type;
            options.actor_b = actor_b;
            options.anchor_a = joints[t].OffsetA;
            options.anchor_b = joints[t].OffsetB;
            options.self_collide = joints[t].SelfCollide;
            options.damping = joints[t].Damping;
            options.frequency = joints[t].Frequency;
            options.limit_joint = joints[t].LimitJoint;
            options.lower_limit = joints[t].LowerLimit;
            options.upper_limit = joints[t].UpperLimit;
            options.motor_enabled = joints[t].MotorEnabled;
            options.motor_speed = joints[t].MotorSpeed;
            options.max_motor_torque = joints[t].MaxMotorTorque;
            options.max_motor_force = joints[t].MaxMotorForce;
            options.ground_a = joints[t].GroundA;
            options.ground_b = joints[t].GroundB;
            options.axis = joints[t].Axis;
            options.ratio = joints[t].Ratio;
            actor.addJoint(options);
        }
    }

    // Parse pre-defined animation timelines
    var tc = item.TimelineCollection;
    if (tc !== undefined)
    {
        for (var t = 0; t < tc.length; t++)
            this.parseTimeline(actor, tc[t]);
    }

    // Parse actions lists
    var al = item.ActionsList;
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

    if (item.Children !== undefined)
        this.parseResources(actor, item.Children);

    return actor;
};
b5.Xoml.prototype.parseIcon = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Icon " + item.Name);

    var actor;
    var render_as = 0;
    if (item.RenderAs !== undefined)
        render_as = item.RenderAs;

    if (render_as === 1)	// Circle
        actor = new b5.ArcActor();
    else if (render_as === 2)	// Rectangle
        actor = new b5.RectActor();
    else if (render_as === 0)	// Normal
    {
        if (item.Geometry !== undefined)
        {
            actor = new b5.PolygonActor();
            var shape = this.current_scene.findResource(item.Geometry, "shape");
            if (shape !== null)
                actor.points = shape.vertices;
        }
        else
            actor = new b5.Actor();
    }
    if (item.CornerRadius !== undefined) actor.corner_radius = item.CornerRadius;

    this.parseActor(actor, parent, item);

    if (render_as === 1)	// Circle
        actor.radius = actor.w / 2;

    if (item.Virtual !== undefined && item.Virtual) 	// Has virtual canvas
    {
        actor.makeVirtual();
        if (item.ScrollRange !== undefined)
        {
            actor.scroll_range[0] = item.ScrollRange.x;
            actor.scroll_range[1] = item.ScrollRange.y;
            actor.scroll_range[2] = item.ScrollRange.w;
            actor.scroll_range[3] = item.ScrollRange.h;
        }
        if (item.ScrollPos !== undefined)
        {
            actor.scroll_pos_x = item.ScrollPos.x;
            actor.scroll_pos_y = item.ScrollPos.y;
        }
    }

    if (item.SelfClip !== undefined)
        actor.self_clip = item.SelfClip;
    if (item.ClipShape !== undefined)
        actor.clip_shape = this.current_scene.findResource(item.ClipShape, "shape");

    if (item.Cache === true)
        actor.cache = true;
    if (item.Merge === true)
        actor.merge_cache = true;

    if (actor.onCreate !== undefined)
        actor.onCreate();

    return actor;
};
b5.Xoml.prototype.parseLabel = function(parent, item)
{
    if (this.app.debug)
        console.log("Parsing Label " + item.Name);

    var actor = new b5.LabelActor();
    actor.text = item.Text;
    actor.font = item.Font;
    actor.text_align = item.AlignH;
    actor.text_baseline = item.AlignV;
    this.parseActor(actor, parent, item);

    if (item.Cache === true)
        actor.cache = true;
    if (item.Merge === true)
        actor.merge_cache = true;

    if (actor.onCreate !== undefined)
        actor.onCreate();

    return actor;
};
b5.Xoml.prototype.parseResources = function(parent, objects)
{
    var count = objects.length;
    for (var t = 0; t < count; t++)
        this.parseResource(parent, objects[t]);
};

b5.Xoml.prototype.parseResource = function(parent, resource)
{
    var res_type = resource.ResourceType;
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
    return null;
};

b5.Xoml.findResource = function(objects, name, type)
{
    // If object has children then search child list instead
    if (objects.Children !== undefined)
        objects = objects.Children;

    var count = objects.length;
    for (var t = 0; t < count; t++)
    {
        if (objects[t].ResourceType.toLowerCase() === type && objects[t].Name === name)
            return objects[t];
    }
    return null;
};

