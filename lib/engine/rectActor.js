/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A RectActor is a an actor that displays a rectangle instead of an image
//
RectActor.prototype = new Actor();
RectActor.prototype.constructor = RectActor;
RectActor.prototype.parent = Actor.prototype;
function RectActor()
{
	// Public variables
	this.fill_style = "";
	this.stroke_style = "";
	this.filled = true;				// if true then rects interior will filled otherwise empty
	
	// Call constructor
	Actor.call(this);
}

RectActor.prototype.update = function(dt)
{
	return this.baseUpdate(dt);
};

RectActor.prototype.draw = function()
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
		display.drawRect(-cx, -cy, this.w, this.h, this.filled);

		if (this.clip_children)
		{
			context.save();
			context.beginPath();
			context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4] + mx, trans[5] + my);
			context.rect(-cx, -cy, this.w, this.h);
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
		display.drawRect(x, y, this.w, this.h, this.filled);

		if (this.clip_children)
		{
			context.save();
			context.beginPath();
			context.rect(x, y, this.w, this.h);
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
