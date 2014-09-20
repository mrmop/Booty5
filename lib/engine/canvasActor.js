/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A CanvasActor is a an actor that allows you to:
// - Scroll child actors around a virtual canvas
// - Dock actors to the edges of the canvas with dock margins
//
CanvasActor.prototype = new Actor();
CanvasActor.prototype.constructor = CanvasActor;
CanvasActor.prototype.parent = Actor.prototype;
function CanvasActor()
{
	// Private variables
	this.prev_scroll_pos_x = 0;				// X canvas scroll position
	this.prev_scroll_pos_y = 0;				// Y canvas scroll position
	
	// Public variables
	this.scroll_pos_x = 0;					// X canvas scroll position
	this.scroll_pos_y = 0;					// Y canvas scroll position
	this.scroll_vx = 0;						// X canvas scroll velocity
	this.scroll_vy = 0;						// Y canvas scroll velocity
	this.scroll_range = [0,0,0,0];			// Scrollable range of canvas (x, y, w, h)
	
	// Call constructor
	Actor.call(this);
	
	this.iscanvas = true;
}

CanvasActor.prototype.onMoveTouchBase = function(touch_pos)
{
	this.touchmove = true;
	// Bubble event to parent if enabled
	if (this.bubbling && this.parent != null)
		this.parent.onMoveTouchBase(touch_pos);

	if (this.touching && (this.scroll_range[2] != 0 || this.scroll_range[3] != 0))
	{
		var app = scene.app;
		this.prev_scroll_pos_x = this.scroll_pos_x;
		this.prev_scroll_pos_y = this.scroll_pos_y;
		this.scroll_vx = app.touch_drag_x;
		this.scroll_pos_x += app.touch_drag_x;
		this.scroll_vy = app.touch_drag_y;
		this.scroll_pos_y += app.touch_drag_y;
		if (this.scroll_vx != 0 || this.scroll_vy != 0)
		{
			this.scrollRangeCheck();
			this.updateLayout();
		}
	}

	if (this.onMoveTouch != undefined)
		this.onMoveTouch(touch_pos);
};


CanvasActor.prototype.update = function(dt)
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
			this.scrollRangeCheck();
			this.updateLayout();
		}
		this.scroll_vx *= 0.9;
		this.scroll_vy *= 0.9;
		if (this.scroll_vx > -0.5 && this.scroll_vx < 0.5)
			this.scroll_vx = 0;
		if (this.scroll_vy > -0.5 && this.scroll_vy < 0.5)
			this.scroll_vy = 0;
	}
	if (this.frame_count == 0)
		this.updateLayout();
	
	return this.baseUpdate(dt);
};

CanvasActor.prototype.scrollRangeCheck = function()
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


CanvasActor.prototype.updateLayout = function(dt)
{
	var dx = this.prev_scroll_pos_x - this.scroll_pos_x;
	var dy = this.prev_scroll_pos_y - this.scroll_pos_y;
	// Update child actors
	var count = this.actors.length;
	var w = this.w / 2;
	var h = this.h / 2;
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
				if (act.dock_x == 1)	// left
					act.x = -w + act.w / 2 + act.margin[0];
				else if (act.dock_x == 2)	// right
					act.x = w - act.w / 2 - act.margin[1];
			}
			else
				act.x += dx;
			if (act.dock_y != 0)
			{
				if (act.dock_y == 1) // top
					act.y = -h + act.h / 2 + act.margin[2];
				else if (act.dock_y == 2)	// bottom
					act.y = h - act.h / 2 - act.margin[3];
			}
			else
				act.y += dy;
			act.transform_dirty = true;
		}
	}
};

