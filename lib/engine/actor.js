"use strict";

function Actor(options)
{
	// Private variables
	
	// Public variables
	this.name = "";					// Name of actor
	this.id = -1;					// ID
	this.scene = null;				// Parent scene
	this.visible = true;			// Visible state
	this.touchable = false;			// Touchable state
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
	this.image = null;				// Image (used if no atlas defined)
	this.atlas = null;				// Image atlas
	this.body = null;				// Box2D body
	this.transform = [];			// Current transform
	this.use_transform = false;		// If set to true then transforms will be applied to actor
	this.transform_dirty = true;	// If set to true then transforms will be rebuilt next update
}
// Properties
Object.defineProperty(Actor.prototype, "_x", {
	get: function() { return this.x; }, 
	set: function(value) { this.x = value; this.transform_dirty = true; }
});
Object.defineProperty(Actor.prototype, "_y", {
	get: function() { return this.y; }, 
	set: function(value) { this.y = value; this.transform_dirty = true; }
});
Object.defineProperty(Actor.prototype, "_ox", {
	get: function() { return this.ox; }, 
	set: function(value) { this.ox = value; this.transform_dirty = true; }
});
Object.defineProperty(Actor.prototype, "_oy", {
	get: function() { return this.oy; }, 
	set: function(value) { this.oy = value; this.transform_dirty = true; }
});
Object.defineProperty(Actor.prototype, "_rotation", {
	get: function() { return this.rotation; }, 
	set: function(value) { this.rotation = value; this.transform_dirty = true; }
});
Object.defineProperty(Actor.prototype, "_scale_x", {
	get: function() { return this.scale_x; }, 
	set: function(value) { this.scale_x = value; this.transform_dirty = true; }
});
Object.defineProperty(Actor.prototype, "_scale_y", {
	get: function() { return this.scale_y; }, 
	set: function(value) { this.scale_y = value; this.transform_dirty = true; }
});


Actor.prototype.setPosition = function(x, y)
{
	this.x = x;
	this.y = y;
	this.transform_dirty = true;
}
Actor.prototype.setOrigin = function(x, y)
{
	this.ox = x;
	this.oy = y;
	this.transform_dirty = true;
}
Actor.prototype.setScale = function(x, y)
{
	this.scale_x = x;
	this.scale_y = y;
	this.transform_dirty = true;
}
Actor.prototype.setRotation = function(angle)
{
	this.rotation = angle;
	this.transform_dirty = true;
}

Actor.prototype.release = function()
{
	this.releaseBody();
	if (this.scene != null)
	{
		this.scene.removeActor(this);
	}
}

Actor.prototype.releaseBody = function()
{
	if (this.body != null)
	{
		this.scene.world.DestroyBody(this.body);
		this.body = null;
	}
}

Actor.prototype.initBody = function(body_type, fixed_rotation)
{
	this.use_transform = true;
	var body_def = new Box2D.Dynamics.b2BodyDef;
	var ws = this.scene.world_scale;
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
	this.body = this.scene.world.CreateBody(body_def);
}

Actor.prototype.addFixture = function(options)
{
	if (options.type == "box")
	{
		var fix_def = new Box2D.Dynamics.b2FixtureDef;
		var ws = this.scene.world_scale;
		fix_def.shape = new Box2D.Collision.Shapes.b2PolygonShape;
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
		var fix_def = new Box2D.Dynamics.b2FixtureDef;
		fix_def.shape = new Box2D.Collision.Shapes.b2CircleShape(options.radius);
		this.body.CreateFixture(fix_def);
	}
}

Actor.prototype.draw = function()
{
	if (!this.visible)
		return;
		
	// Get source image coordinates from the atlas
	var src = null;
	if (this.atlas != null)
		src = this.atlas.getFrame(this.current_frame);
	
	// Render the actor
	var context = window.canvas2d.context;	// The rendering context
	if (this.use_transform)
	{
		var cx = this.ox * this.w;
		var cy = this.oy * this.h;
		var trans = this.transform;
		if (this.transform_dirty)
		{
			var r = this.rotation;
			var sx = this.scale_x;
			var sy = this.scale_y;
			var cos = Math.cos(r);
			var sin = Math.sin(r);
			trans[0] = cos * sx;
			trans[1] = sin * sx;
			trans[2] = -sin * sy;
			trans[3] = cos * sy;
			trans[4] = this.x;
			trans[5] = this.y;
			this.transform_dirty = false;
		}
		cx = (cx + 0.5) << 0;	// Make int
		cy = (cy + 0.5) << 0;	// Make int
		context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4], trans[5]);
		if (this.atlas != null)
			context.drawImage(this.atlas.image, src.x, src.y, src.w, src.h, -cx, -cy, this.w, this.h);
		else
			context.drawImage(this.image, -cx, -cy, this.w, this.h);
/*		context.font = '16pt Calibri';
		context.textAlign = 'center';
		context.fillText("Hello", -cx + this.w / 2, -cy);*/
	}
	else
	{
		var x = (this.x + 0.5) << 0;
		var y = (this.y + 0.5) << 0;
		if (this.atlas != null)
			context.drawImage(this.atlas.image, src.x, src.y, src.w, src.h, x, y, this.w, this.h);
		else
			context.drawImage(this.image, x, y, this.w, this.h);
	}
	context.setTransform(1, 0, 0, 1, 0, 0);
}

Actor.prototype.baseUpdate = function(dt)
{
	if (!this.visible)
		return false;
		
	// Update the frame
	if (this.atlas != null)
	{
		this.current_frame += this.frame_speed * dt;
		var max = this.atlas.getMaxFrames();
		if (this.current_frame > max)
			this.current_frame -= max;
	}
	// Update from physics
	if (this.body != null)
	{
		var pos = this.body.GetPosition();
		var ws = this.scene.world_scale;
		this.setRotation(this.body.GetAngle());
		this.setPosition(pos.x * ws, pos.y * ws);
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

Actor.prototype.update = function(dt)
{
	return this.baseUpdate(dt);
}

// NOTE: This function does not work with actors that have been rotated around any point
// except their centre
Actor.prototype.hitTest = function(position)
{
	if (!this.touchable)
		return false;
	if (this.use_transform)
	{
		var trans = this.transform;
		var cx = this.x;
		var cy = this.y;
		var sx = this.scale_x;
		var sy = this.scale_y;
		var px = (position.x - cx) / sx;
		var py = (position.y - cy) / sy;
		var tx = px * trans[0] + py * trans[1];
		var ty = px * trans[2] + py * trans[3];
//console.log("txy " + tx + ", " + ty);
		var hw = this.w / 2 * sx;
		var hh = this.h / 2 * sy;
		if (tx >= -hw && tx <= hw && ty >= -hh && ty <= hh)
			return true;
	}
	else
	{
		var tx = position.x - this.x;
		var ty = position.y - this.y;
		var hw = this.w;
		var hh = this.h;
		if (tx >= 0 && tx <= hw && ty >= 0 && ty <= hh)
			return true;
	}
	return false;
}
