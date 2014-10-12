/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A RectActor is derived from an Actor that displays a rectangular shaped game object instead of an image and
// inherits all properties, functions and so forth from its parent. A RectActor should be added to a Scene or another
// Actor once created.
//
//// Example showing how to create a rect actor
// var actor = new RectActor();
// actor.fill_style = "#40ff4f";   // Set fill style
// actor.filled = true;            // Set filled
// actor.w = 100;
// actor.h = 100;
// scene.addActor(actor);          // Add actor to scene for processing and drawing

RectActor.prototype = new Actor();
RectActor.prototype.constructor = RectActor;
RectActor.prototype.parent = Actor.prototype;
function RectActor()
{
    // Public variables
    this.fill_style = "";           // Style used to fill the arc
    this.stroke_style = "";         // Stroke used to draw none filled arc
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
    var app = scene.app;
    var dscale = app.canvas_scale;
    var context = app.display.context;	// The rendering context
    if (this.filled && this.fill_style != "")
        context.fillStyle = this.fill_style;
    if (!this.filled && this.stroke_style != "")
        context.strokeStyle = this.stroke_style;

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

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

        if (!this.ignore_camera && (this.depth == 0 || this.depth == 1))
        {
            mx -= scene.camera_x * dscale;
            my -= scene.camera_y * dscale;
        }

        this.updateTransform();
        var trans = this.transform;
        context.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4] * dscale + mx, trans[5] * dscale + my);
        app.display.drawRect(-cx, -cy, this.w, this.h, this.filled);

        if (this.clip_children)
        {
            context.save();
            context.beginPath();
            context.rect(-cx, -cy, this.w, this.h);
            context.clip();
        }
    }
    else
    {
        var x = this.x;
        var y = this.y;
        if (this.parent != null && !this.orphaned)
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
        app.display.drawRect(x, y, this.w, this.h, this.filled);

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
