/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// An ArcActor is a an actor that displays an arc shape instead of an image
//
ArcActor.prototype = new Actor();
ArcActor.prototype.constructor = ArcActor;
ArcActor.prototype.parent = Actor.prototype;
function ArcActor()
{
	// Public variables
	this.fill_style = "";
	this.stroke_style = "";
	this.radius = 1;				// Radius of arc
	this.start_angle = 0;			// Start angle of arc in radians
	this.end_angle = 2 * Math.PI;	// End angle of arc in radians
	this.filled = true;				// if true then arc interior will filled otherwise empty

	// Call constructor
	Actor.call(this);

	this.ox = 0;
	this.oy = 0;
}

ArcActor.prototype.update = function(dt)
{
	return this.baseUpdate(dt);
};

ArcActor.prototype.draw = function()
{
	if (!this.visible)
		return;

	// Render the actor
	var scene = this.scene;
	var display = app.display;
	var context = display.context;	// The rendering context
	if (this.filled && this.fill_style != "")
		context.fillStyle = this.fill_style;
	if (!this.filled && this.stroke_style != "")
		context.strokeStyle = this.stroke_style;

	var mx = display.canvas_width / 2 + scene.x;
	var my = display.canvas_height / 2 + scene.y;
	
	if (this.parent == null || !this.use_parent_opacity)
		this.accum_opacity = this.opacity * this.scene.opacity;
	else
		this.accum_opacity = this.parent.accum_opacity * this.opacity;
	// Render the actor
	context.globalAlpha = this.accum_opacity;
	if (this.use_transform)
	{
		var cx = this.ox;
		var cy = this.oy;
		if (!this.absolute_origin)
		{
			cx *= this.w;
			cy *= this.h;
		}
		
		cx = (cx + 0.5) << 0;	// Make int
		cy = (cy + 0.5) << 0;	// Make int
		
		if (!this.ignore_camera && this.depth == 0)
		{
			mx -= scene.camera_x;
			my -= scene.camera_y;
		}

		this.updateTransform();
		var trans = this.transform;
		context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4] + mx, trans[5] + my);
		display.drawArc(-cx, -cy, this.radius, this.start_angle, this.end_angle, this.filled);

		if (this.clip_children)
		{
			context.save();
			context.beginPath();
			context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4] + mx, trans[5] + my);
			context.arc(-cx, -cy, this.radius, 0, 2 * Math.PI, false);
			context.clip();
		}
	}
	else
	{
		var x = this.x;
		var y = this.y;
		if (this.parent != null)
		{
			x += this.parent.x;
			y += this.parent.y;
		}
		if (!this.ignore_camera)
		{
			x -= scene.camera_x;
			y -= scene.camera_y;
		}
		x = (x + mx + 0.5) << 0;
		y = (y + my + 0.5) << 0;
		context.setTransform(1, 0, 0, 1, 0, 0);
		display.drawArc(x, y, this.radius, this.start_angle, this.end_angle, this.filled);

		if (this.clip_children)
		{
			context.save();
			context.beginPath();
			context.arc(x, y, this.radius, 0, 2 * Math.PI, false);
			context.clip();
		}
	}

	// Draw child actors
	var count = this.actors.length;
	if (count > 0)
	{
		var acts = this.actors;
		for (var t = 0; t < count; t++)
			acts[t].draw();
	}
	
	if (this.clip_children)
		context.restore();
};

ArcActor.prototype.hitTest = function(position)
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
	if (this.use_transform)
	{
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
		var r = this.radius * sx;
		r *= r;
		var d = tx * tx + ty * ty;
		if (d <= r)
			return this;
	}
	else
	{
		var cx = this.x + scene.x;
		var cy = this.y + scene.y;
		if (!this.ignore_camera)
		{
			cx -= scene.camera_x;
			cy -= scene.camera_y;
		}
		cx = position.x - cx;
		cy = position.y - cy;
		var r = this.radius;
		r *= r;
		var d = cx * cx + cy * cy;
		if (d <= r)
			return this;
	}
	return null;
};

