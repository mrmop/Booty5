/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A PolygonActor is derived from an Actor that displays a polygon shaped game object instead of an image and
// inherits all properties, functions and so forth from its parent. An ArcActor should be added to a Scene or another
// Actor once created.
//
//// Example showing how to create a polygon based actor
// var actor = new PolygonActor();
// actor.name = "polygon1";
// actor.points = [0, -50, 50, 50, -50, 50];    // Set actors shape
// actor.fill_style = "#804fff";                // Set fill style
// actor.filled = true;                         // Set filled
// scene.addActor(actor);                       // Add actor to scene for processing and drawing

PolygonActor.prototype = new Actor();
PolygonActor.prototype.constructor = PolygonActor;
PolygonActor.prototype.parent = Actor.prototype;
function PolygonActor()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "";                 // Stroke used to draw none filled arc
    this.filled = true;				        // if true then polygons interior will filled otherwise empty
    this.points = null;				        // List of points to draw

    // Call constructor
    Actor.call(this);

    this.type = Actor.Type_Polygon; // Type of actor
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
    var app = scene.app;
    var context = app.display.context;	// The rendering context
    if (this.filled && this.fill_style != "")
        context.fillStyle = this.fill_style;
    if (!this.filled && this.stroke_style != "")
        context.strokeStyle = this.stroke_style;

    var dscale = app.canvas_scale;
    var mx = app.canvas_cx + this.scene.x * dscale;
    var my = app.canvas_cy + this.scene.y * dscale;

    if (this.parent == null || !this.use_parent_opacity)
        this.accum_opacity = this.opacity * this.scene.opacity;
    else
        this.accum_opacity = this.parent.accum_opacity * this.opacity;

    // Render the actor
    context.globalAlpha = this.accum_opacity;
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
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    context.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4] * dscale + mx, trans[5] * dscale + my);

    if (self_clip)
        this.setClipping(context, -cx, -cy);

    app.display.drawPolygon(-cx, -cy, this.points, this.filled);

    if (clip_children)
    {
        if (!self_clip)
            this.setClipping(context, -cx, -cy);
    }
    else
    if (self_clip)
        context.restore();

    // Draw child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }

    if (clip_children)
        context.restore();
};

// TODO: Add polygon specific version of hitTest
