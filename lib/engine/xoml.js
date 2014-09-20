/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// Xoml class loads a XOML format JSON (exported from the Goji Editor game IDE) and turns it into Booty5 compatible objects
//
function Xoml(app)
{
	this.current_scene = null;      // Current scene
    this.app = app;                 // The parent app
}

Xoml.prototype.loadJSON = function(filename)
{
	$.getJSON(filename, function(json) {
		window.game.parseResources(json);
	});
};

Xoml.prototype.loadJS = function(filename)
{
	var fileref = document.createElement('script');
	fileref.setAttribute("type","text/javascript");
	fileref.setAttribute("src", filename);
	
	if (typeof fileref != "undefined")
		document.getElementsByTagName("head")[0].appendChild(fileref);
};

Xoml.prototype.parseScene = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Scene " + item.Name);

	// Create a scene
	var scene = new Scene();
	this.current_scene = scene;
	scene.name = item.Name;
	if (item.Tag != undefined) scene.tag = item.Tag;
	scene.x = item.Position.x;
	scene.y = item.Position.y;
	if (item.Layer != undefined) scene.layer = item.Layer;
	scene.visible = item.Visible;
	scene.active = item.Active;
	if (item.Physics)
		scene.initWorld(item.Gravity.x, item.Gravity.y, item.DoSleep);
    if (item.ClipChildren != undefined)
        scene.clip_children = item.ClipChildren;

	if (item.TouchPan == "Both")
	{
		scene.touch_pan_x = true;
		scene.touch_pan_y = true;
	}
	else if (item.TouchPan == "X")
		scene.touch_pan_x = true;
	else if (item.TouchPan == "Y")
		scene.touch_pan_y = true;
	scene.extents[0] = item.Extents.x;
	scene.extents[1] = item.Extents.y;
	scene.extents[2] = item.Extents.w;
	scene.extents[3] = item.Extents.h;

	scene.follow_speedx = item.FollowSpeed.x;
	scene.follow_speedy = item.FollowSpeed.y;

	parent.addScene(scene);
	if (item.Current)
		parent.focus_scene = scene;

	// Parse user properties
	var user_props = item.UserProps;
	if (user_props !== undefined)
	{
		for (var t = 0; t < user_props.length; t++)
			actor[user_props[t].Name] = user_props[t].Value;
	}
	if (item.Alpha != undefined) scene.opacity = item.Alpha;

	if (!(item.Children === undefined))
		this.parseResources(scene, item.Children);

    if (item.ClipShape != undefined && item.ClipShape != "")
        scene.clip_shape = scene.findResource(item.ClipShape, "shape");

	if (item.TargetX != "")
		scene.target_x = scene.findActor(item.TargetX);
	if (item.TargetY != "")
		scene.target_y = scene.findActor(item.TargetY);
		
	// Parse actions
	if (item.OnCreate != undefined)
		scene.onCreate = function(scene) { eval(item.OnCreate); };
	if (item.OnDestroy != undefined)
		scene.onDestroy = function(scene) { eval(item.OnDestroy); };
	if (item.OnTick != undefined)
		scene.onTick = function(scene) { eval(item.OnTick); };
	if (item.OnTapped != undefined)
		scene.onTapped = function(touch_pos) { eval(item.OnTapped); };
	if (item.OnBeginTouch != undefined)
		scene.onBeginTouch = function(touch_pos) { eval(item.OnBeginTouch); };
	if (item.OnEndTouch != undefined)
		scene.onEndTouch = function(touch_pos) { eval(item.OnEndTouch); };
	if (item.OnMoveTouch != undefined)
		scene.onMoveTouch = function(touch_pos) { eval(item.OnMoveTouch); };
		
	if (scene.onCreate != undefined)
		scene.onCreate();
};
Xoml.prototype.parseBrush = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Brush " + item.Name);
	var rect = item.Rect;
	var bitmap = parent.findResource(item.Image, "bitmap")
	var brush = new ImageAtlas(item.Name, bitmap, rect.x, rect.y, rect.w, rect.h);
	parent.addResource(brush, "brush");
};
Xoml.prototype.parseImage = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Image " + item.Name);
	var bitmap = new Bitmap(item.Name, item.Location, item.Preload);
	parent.addResource(bitmap, "bitmap");
};
Xoml.prototype.parseSound = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Sound " + item.Name);
	var sound = new Sound(item.Name, item.Location);
	parent.addResource(sound, "sound");
};
Xoml.prototype.parseFont = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Font " + item.Name);
};
Xoml.prototype.parseShape = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Shape " + item.Name);
	var shape = new Shape(item.Name);
	shape.width = item.Width;
	shape.height = item.Height;
	if (item.ShapeType == "Circle")
		shape.type = Shape.TypeCircle;
	else if (item.ShapeType == "Box")
		shape.type = Shape.TypeBox;
	else if (item.ShapeType == "Polygon")
	{
		shape.type = Shape.TypePolygon;
		var vertices = item.Vertices;
		var count = vertices.length;
		for (var t = 0; t < count; t++)
            shape.vertices.push(vertices[t]);
//			shape.points.push({x: vertices[t].x, y: vertices[t].y});
	}
	
	parent.addResource(shape, "shape");
};
Xoml.prototype.parseMaterial = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Material " + item.Name);
	
	var material = new Material();
	material.name = item.Name;
	material.type = item.MaterialType;
	material.density = item.Density;
	material.friction = item.Friction;
	material.restitution = item.Restitution;
	material.gravity_scale = item.GravityScale;
	material.fixed_rotation = item.FixedRotation;
	material.is_bullet = item.IsBullet;
	
	parent.addResource(material, "material");
};
Xoml.prototype.parseGeometry = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Geometry " + item.Name);
	var geom = new Geometry();
	geom.name = item.Name;
	var vertices = item.Vertices;
	var count = vertices.length;
	for (var t = 0; t < count; t++)
		geom.vertices.push(vertices[t]);
	parent.addResource(geom, "geometry");
};
Xoml.prototype.parseActor = function(actor, parent, item)
{
	if (this.app.debug)
		console.log("Parsing Actor " + item.Name);
	
	actor.scene = this.current_scene;
	if (item.Name != undefined) actor.name = item.Name;
	if (item.Tag != undefined) actor.tag = item.Tag;
	if (item.Visible != undefined) actor.visible = item.Visible;
	if (item.Active != undefined) actor.active = item.Active;
	if (item.Layer != undefined) actor.layer = item.Layer;
	if (item.Background != undefined) actor.atlas = this.current_scene.findResource(item.Background, "brush");
	if (item.Position != undefined)
	{
		actor.x = item.Position.x;
		actor.y = item.Position.y;
	}
	if (item.Scale != undefined)
	{
		actor.scale_x = item.Scale.x;
		actor.scale_y = item.Scale.y;
	}
	if (item.FlipX != undefined && item.FlipX) actor.scale_x = -actor.scale_x;
	if (item.FlipY != undefined && item.FlipY) actor.scale_y = -actor.scale_y;
	if (item.Angle != undefined) actor.rotation = item.Angle;
	if (item.Size != undefined)
	{
		actor.w = item.Size.x;
		actor.h = item.Size.y;
	}
	if (item.Origin != undefined)
	{
		actor.ox = item.Origin.x;
		actor.oy = item.Origin.y;
	}
	if (actor.ox <= -1 || actor.ox >= 1 || actor.oy <= -1 || actor.oy >= 1) actor.absolute_origin = true;
	if (item.Alpha != undefined) actor.opacity = item.Alpha;
	if (item.UseParentOpacity != undefined) actor.use_parent_opacity = item.UseParentOpacity;
	if (item.Depth != undefined) actor.depth = item.Depth;
	actor.use_transform = true;
	if (item.Velocity != undefined)
	{
		actor.vx = item.Velocity.x;
		actor.vy = item.Velocity.y;
	}
	if (item.AngularVelocity != undefined) actor.vr = item.AngularVelocity;
	if (item.VelocityDamping != undefined)
	{
		actor.vx_damping = item.VelocityDamping.x;
		actor.vy_damping = item.VelocityDamping.y;
	}
	if (item.AngularVelocityDamping != undefined) actor.vr_damping = item.AngularVelocityDamping;
	if (item.WrapPosition != undefined)	actor.wrap_position = item.WrapPosition;
	if (item.IgnoreCamera != undefined)	actor.ignore_camera = item.IgnoreCamera;
	if (item.ClipChildren != undefined)	actor.clip_children = item.ClipChildren;
	if (item.Touchable != undefined) actor.touchable = item.Touchable;
	if (item.Bubbling != undefined)	actor.bubbling = item.Bubbling;
	if (item.Docking != undefined)
	{
		var docking = item.Docking;
		if (docking == "top" || docking == "topleft" || docking == "topright")
			actor.dock_y = 1;
		else if (docking == "bottom" || docking == "bottomleft" || docking == "bottomright")
			actor.dock_y = 2;
		if (docking == "left" || docking == "topleft" || docking == "bottomleft")
			actor.dock_x = 1;
		else if (docking == "right" || docking == "topright" || docking == "bottomright")
			actor.dock_x = 2;
	}
	if (item.Margin != undefined)
	{
		actor.margin[0] = item.Margin.x;
		actor.margin[1] = item.Margin.y;
		actor.margin[2] = item.Margin.w;
		actor.margin[3] = item.Margin.h;
	}
	if (item.ClipMargin != undefined)
	{
		actor.clip_margin[0] = item.ClipMargin.x;
		actor.clip_margin[1] = item.ClipMargin.y;
		actor.clip_margin[2] = item.ClipMargin.w;
		actor.clip_margin[3] = item.ClipMargin.h;
	}
	parent.addActor(actor);
	
	// Parse actions
	if (item.OnCreate != undefined)
		actor.onCreate = function(touch_pos) { eval(item.OnCreate); };
	if (item.OnDestroy != undefined)
		actor.onDestroy = function(touch_pos) { eval(item.OnDestroy); };
	if (item.OnTick != undefined)
		actor.onTick = function(touch_pos) { eval(item.OnTick); };
	if (item.OnTapped != undefined)
	{
		actor.touchable = true;
		actor.onTapped = function(touch_pos) { eval(item.OnTapped); }
	}
	if (item.OnBeginTouch != undefined)
	{
		actor.touchable = true;
		actor.onBeginTouch = function(touch_pos) { eval(item.OnBeginTouch); }
	}
	if (item.OnEndTouch != undefined)
	{
		actor.touchable = true;
		actor.onEndTouch = function(touch_pos) { eval(item.OnEndTouch); }
	}
	if (item.OnMoveTouch != undefined)
	{
		actor.touchable = true;
		actor.onMoveTouch = function(touch_pos) { eval(item.OnMoveTouch); }
	}
	if (item.OnCollisionStart != undefined)
		actor.onCollisionStart = function(touch_pos) { eval(item.OnCollisionStart); };
	if (item.OnCollisionEnd != undefined)
		actor.onCollisionEnd = function(touch_pos) { eval(item.OnCollisionEnd); };
	
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
			var options = [];
			var material = null;
			var shape = null;
			if (fixtures[t].Material != undefined && fixtures[t].Material != "")
                material = this.current_scene.findResource(fixtures[t].Material, "material");
			if (fixtures[t].Shape != undefined && fixtures[t].Shape != "")
                shape = this.current_scene.findResource(fixtures[t].Shape, "shape");
			if (t == 0)
				actor.initBody(material.type, material.fixed_rotation, material.is_bullet);
            // NOTE: if no physics shape attached bu the actor is under control of physics then a default fixture will
            // be attached. if the actor is circular in shape then a circular fixture will be used otherwise a box
            // shape will be used.
			if (shape == null)
			{
                if (item.RenderAs == 1)
                {
                    options.type = Shape.TypeCircle;
                    options.radius = actor.w / 2;
                }
                else
                {
                    options.type = Shape.TypeBox;
                    options.width = actor.w;
                    options.height = actor.h;
                }
			}
			else
			{
				if (shape.type == Shape.TypePolygon)
					options.points = shape.vertices;
				else
				if (shape.type == Shape.TypeCircle)
					options.radius = shape.width;
				else
				{
					options.width = shape.width;
					options.height = shape.height;
				}
                options.type = shape.type;
			}
			if (material != null)
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
	
	if (actor.body != null)
	{
		var b2Vec2 = Box2D.Common.Math.b2Vec2;
		actor.body.SetLinearVelocity(new b2Vec2(actor.vx, actor.vy));
		actor.body.SetAngularVelocity(actor.vr);
		actor.body.SetLinearDamping(actor.vx_damping);
		actor.body.SetAngularDamping(actor.vr_damping);
	}
	
	if (item.Children !== undefined)
		this.parseResources(actor, item.Children);
};
Xoml.prototype.parseIcon = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Icon " + item.Name);
	
	var actor;
	var render_as = 0;
	if (item.RenderAs != undefined)
		render_as = item.RenderAs;
		
	if (render_as == 1)	// Circle
	{
		actor = new ArcActor();
		if (item.Colour != undefined) actor.fill_style = item.Colour;
	}
	else if (render_as == 2)	// Rectangle
	{
		actor = new RectActor();
		if (item.Colour != undefined) actor.fill_style = item.Colour;
	}
	else if (render_as == 0)	// Normal
	{
		if (item.Geometry !== undefined)
		{
			actor = new PolygonActor();
			var geom = this.current_scene.findResource(item.Geometry, "geometry");
			actor.points = geom.vertices;
			if (item.Colour != undefined) actor.fill_style = item.Colour;
		}
		else
		{
			if (item.UIType != undefined && item.UIType == 1) 	// Canvas
				actor = new CanvasActor();
			else
				actor = new Actor();
		}
	}
	
	this.parseActor(actor, parent, item);
	
	if (render_as == 1)	// Circle
		actor.radius = actor.w / 2;
		
	if (item.UIType != undefined && item.UIType == 1) 	// Canvas
	{
		if (item.ScrollRange != undefined)
		{
			actor.scroll_range[0] = item.ScrollRange.x;
			actor.scroll_range[1] = item.ScrollRange.y;
			actor.scroll_range[2] = item.ScrollRange.w;
			actor.scroll_range[3] = item.ScrollRange.h;
		}
		if (item.ScrollPos != undefined)
		{
			actor.scroll_pos_x = item.ScrollPos.x;
			actor.scroll_pos_y = item.ScrollPos.y;
		}
	}
	if (actor.onCreate != undefined)
		actor.onCreate();
};
Xoml.prototype.parseLabel = function(parent, item)
{
	if (this.app.debug)
		console.log("Parsing Label " + item.Name);
	
	var actor = new LabelActor();
	actor.text = item.Text;
	actor.font = item.Font;
	this.parseActor(actor, parent, item);
	
	if (actor.onCreate != undefined)
		actor.onCreate();
};
Xoml.prototype.parseResources = function(parent, objects)
{
//		console.log(objects);
	var count = objects.length;
	for (var t = 0; t < count; t++)
	{
		var res_type = objects[t].ResourceType;
//			console.log(objects[t]);
		if (res_type == "Scene")
			this.parseScene(parent, objects[t]);
		else if (res_type == "Brush")
			this.parseBrush(parent, objects[t]);
		else if (res_type == "Image")
			this.parseImage(parent, objects[t]);
		else if (res_type == "Sound")
			this.parseSound(parent, objects[t]);
		else if (res_type == "Font")
			this.parseFont(parent, objects[t]);
		else if (res_type == "Shape")
			this.parseShape(parent, objects[t]);
		else if (res_type == "Material")
			this.parseMaterial(parent, objects[t]);
		else if (res_type == "Geometry")
			this.parseGeometry(parent, objects[t]);
		else if (res_type == "Icon")
			this.parseIcon(parent, objects[t]);
		else if (res_type == "Label")
			this.parseLabel(parent, objects[t]);
	}
};
