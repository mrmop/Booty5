"use strict";

function Sprite(options)
{
	var b2BodyDef = Box2D.Dynamics.b2BodyDef;
	var b2Body = Box2D.Dynamics.b2Body;
	var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
	var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
	
	// Private variables
	var context = window.canvas2d.context;	// The rendering context
	var use_transform = true;		// If set to true then transforms will be applied to sprite
	
	// Public variables
	this.name = "";					// Name of sprite
	this.scene = null;				// Parent scene
	this.visible = true;			// Visible state
	this.x = 0;						// X position on screen
	this.y = 0;						// Y position on screen
	this.w = 0;						// Display width
	this.h = 0;						// Display height
	this.ox = 0.5;					// X origin
	this.oy = 0.5;					// Y origin
	this.rotation = 0;				// rotation
	this.scale_x = 1;				// X scale
	this.scale_y = 1;				// Y scale
	this.current_frame = 0;			// Current animation frame
	this.frame_speed = 0;			// Current animation frame
	this.atlas = null;				// Sprite atlas
	this.body = null;				// Box2D body
	
	this.initBody = function(body_type)
	{
		var body_def = new b2BodyDef;
		var ws = this.scene.world_scale;
		if (body_type == "static")
			body_def.type = b2Body.b2_staticBody;
		else
		if (body_type == "kinematic")
			body_def.type = b2Body.b2_kinematicBody;
		else
			body_def.type = b2Body.b2_dynamicBody;
		body_def.position.Set(this.x / ws, this.y / ws);
		body_def.angle = this.rotation;
		this.body = this.scene.world.CreateBody(body_def);
	}
	
	this.addFixture = function(options)
	{
		if (options.type == "box")
		{
			var fix_def = new b2FixtureDef;
			var ws = this.scene.world_scale;
			fix_def.shape = new b2PolygonShape;
			fix_def.shape.SetAsBox(options.width / (2 * ws), options.height / (2 * ws));
			if (options.density != undefined)
				fix_def.density = options.density;
			if (options.friction != undefined)
				fix_def.friction = options.friction;
			if (options.restitution != undefined)
				fix_def.restitution = options.restitution;
			this.body.CreateFixture(fix_def);
		}
		else
		if (options.type == "circle")
		{
			var fix_def = new b2FixtureDef;
			fix_def.shape = new b2CircleShape(options.radius);
			this.body.CreateFixture(fix_def);
		}
	}
	
	this.draw = function()
	{
		if (!this.visible)
			return;
			
		// Get source image coordinates from the atlas
		var src = this.atlas.getFrame(this.current_frame);
		
		// Render the sprite
		if (this.use_transform || this.body != null)
		{
			var cx = this.ox * this.w;
			var cy = this.oy * this.h;
			context.translate(cx + this.x, cy + this.y);
			context.scale(this.scale_x, this.scale_y);
			context.rotate(this.rotation);
			context.translate(-cx, -cy);
			context.drawImage(this.atlas.image, src.x, src.y, src.w, src.h, 0,0, this.w, this.h);
			context.setTransform(1, 0, 0, 1, 0, 0);
		}
		else
		{
			context.drawImage(this.atlas.image, src.x, src.y, src.w, src.h, this.x, this.y, this.w, this.h);
		}
	}
	
	this.baseUpdate = function(dt)
	{
		if (!this.visible)
			return false;
			
		// Update the frame
		this.current_frame += this.frame_speed * dt;
		var max = this.atlas.getMaxFrames();
		if (this.current_frame > max)
			this.current_frame -= max;
		// Update from physics
		if (this.body != null)
		{
			var pos = this.body.GetPosition();
			var ws = this.scene.world_scale;
			this.rotation = this.body.GetAngle();
			this.x = pos.x * ws - this.w/2;
			this.y = pos.y * ws - this.h/2;
		}
/*		this.x += 2 * dt;
		if (this.x > window.canvas2d.canvas_width)
			this.x -= window.canvas2d.canvas_width;*/
/*		this.rotation += 0.01;
		this.scale_x += 0.01;
		this.scale_y += 0.01;
		if (this.scale_x > 2)
		{
			this.scale_x = 0.5;
			this.scale_y = 0.5;
		}*/
	}
	
	this.update = function(dt)
	{
		return this.baseUpdate(dt);
	}
}

