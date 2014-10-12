/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A CanvasActor is a special kind of Actor that can scroll its content around as well as dock its content to its edges,
// CanvasActor's are designed for creating user interfaces. CanvasActor is derived from Actor thus inherits all of its
// properties, methods and so on. Not that any actors that are docked and are added to a CanvasActor will be docked
// against the edges of the CanvasActor instead of the scene.
//
// Feature include:
// - Scroll child actors around a virtual canvas
// - Dock actors to the edges of the canvas with dock margins
//
//
//// Example showing how to create a canvas actor that scroll its content
// var canvas_actor = new CanvasActor();
// canvas_actor.w = 200;
// canvas_actor.h = 200;
// canvas_actor.x = 100;
// canvas_actor.y = 100;
// canvas_actor.bitmap = scene.findResource("floor", "bitmap");;
// canvas_actor.touchable = true;       // Can receive touch events
// canvas_actor.clip_children = true;   // Clips children against extents
// canvas_actor.scroll_range = [-100,-100,200,200]; // Set scroll range of content
// scene.addActor(canvas_actor);
//
// var child_actor = new Actor();
// child_actor.w = 50;
// child_actor.h = 50;
// child_actor.bitmap = scene.findResource("floor", "bitmap");;
// canvas_actor.addActor(child_actor);  // Add actor as child of canvas actor

CanvasActor.prototype = new Actor();
CanvasActor.prototype.constructor = CanvasActor;
CanvasActor.prototype.parent = Actor.prototype;
function CanvasActor()
{
    // Internal variables
    this.prev_scroll_pos_x = 0;				// Previous canvas scroll X position
    this.prev_scroll_pos_y = 0;				// Previous canvas scroll Y position

    // Public variables
    this.scroll_pos_x = 0;					// Canvas scroll X position
    this.scroll_pos_y = 0;					// Canvas scroll Y position
    this.scroll_vx = 0;						// Canvas scroll X velocity
    this.scroll_vy = 0;						// Canvas scroll Y velocity
    this.scroll_range = [0,0,0,0];			// Scrollable range of canvas (left, top, width, height)

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
        var app = this.scene.app;
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
            if (act.dock_x != 0)
            {
                if (act.dock_x == Actor.Dock_Left)
                    act.x = -w + act.w * act.scale_x / 2 + act.margin[0];
                else if (act.dock_x == Actor.Dock_Right)
                    act.x = w - act.w * act.scale_x / 2 - act.margin[1];
            }
            else
                act.x += dx;
            if (act.dock_y != 0)
            {
                if (act.dock_y == Actor.Dock_Top)
                    act.y = -h + act.h * act.scale_y / 2 + act.margin[2];
                else if (act.dock_y == Actor.Dock_Bottom)
                    act.y = h - act.h * act.scale_y / 2 - act.margin[3];
            }
            else
                act.y += dy;
            act.transform_dirty = true;
        }
    }
};

