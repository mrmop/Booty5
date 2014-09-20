/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A PolygonActor is a an actor that displays a polygon instead of an image
//
PolygonActor.prototype = new Actor();
PolygonActor.prototype.constructor = PolygonActor;
PolygonActor.prototype.parent = Actor.prototype;
function PolygonActor()
{
	// Public variables
	this.fill_style = "";
	this.stroke_style = "";
	this.filled = true;				// if true then rects interior will filled otherwise empty
	this.points = null;				// List of points to draw
	
	// Call constructor
	Actor.call(this);

	this.ox = 0;
	this.oy = 0;
}

PolygonActor.prototype.update = function(dt)
{
	return this.baseUpdate(dt);
};

PolygonActor.prototype.draw = function()
{
	if (!this.visible || this.points == null)
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
		display.drawPolygon(-cx, -cy, this.points, this.filled);

		if (this.clip_children)
		{
			context.save();
			context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4] + mx, trans[5] + my);
            context.beginPath();
			var points = this.points;
			context.moveTo(points[0] + x, points[1] + y);
			for (var i = 2; i < count; i += 2)
				context.lineTo(points[i] + x, points[i + 1] + y);
            context.closePath();
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
		display.drawPolygon(x, y, this.points, this.filled);

		if (this.clip_children)
		{
			context.save();
			context.beginPath();
			var points = this.points;
			context.moveTo(points[0] + x, points[1] + y);
			for (var i = 2; i < count; i += 2)
				context.lineTo(points[i] + x, points[i + 1] + y);
            context.closePath();
			context.clip();
		}
	}

	if (this.clip_children)
		context.restore();
};

// TODO: Add polygon specific version of hitTest
