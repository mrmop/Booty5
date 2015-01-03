/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
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
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "#ffffff";          // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.corner_radius = 0;                 // Corner radius
    this.filled = true;				        // if true then interior will filled otherwise empty

    // Call constructor
    Actor.call(this);

    this.type = Actor.Type_Rect;    // Type of actor
}

RectActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

RectActor.prototype.draw = function()
{
    if (!this.visible)
        return;

    if (this.cache)
    {
        this.drawToCache();
        this.cache = false;
    }
    if (this.merge_cache)   // If merged into parent ache then parent will have drawn so no need to draw again
        return;

    // Render the actor
    var cache = this.cache_canvas;
    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var context = app.display.context;	// The rendering context
    if (cache === null)
    {
        if (this.filled && this.fill_style != "")
            context.fillStyle = this.fill_style;
        if (!this.filled && this.stroke_style != "")
            context.strokeStyle = this.stroke_style;
        if (!this.filled)
            context.lineWidth = this.stroke_thickness;
    }
    this.preDraw(context);

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

    var cx = this.w / 2;
    var cy = this.h / 2;
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

    if (cache === null)
    {
        if (this.corner_radius != 0)
            app.display.drawRoundRect(-cx, -cy, this.w, this.h, this.corner_radius, this.filled);
        else
            app.display.drawRect(-cx, -cy, this.w, this.h, this.filled);
    }
    else
        context.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw(context);

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

RectActor.prototype.drawToCache = function()
{
    var cache = null;
    var w = this.w;
    var h = this.h;
    var ox = 0;
    var oy = 0;
    if (this.merge_cache)
    {
        var parent = this.findFirstCachedParent();
        if (parent !== null)
        {
            cache = parent.cache_canvas;
            ox = this.x + cache.width / 2 - w/2;
            oy = this.y + cache.height / 2 - h/2;
        }
    }
    if (cache === null)
    {
        cache = document.createElement("canvas");
        if (!this.filled && this.stroke_style != "")
        {
            w += this.stroke_thickness;
            h += this.stroke_thickness;
            ox = this.stroke_thickness >> 1;
            oy = this.stroke_thickness >> 1;
        }
        cache.width = w;
        cache.height = h;
    }

    // Render the actor
    var scene = this.scene;
    var app = scene.app;
    var context = cache.getContext("2d");	// The rendering context
    if (this.filled && this.fill_style != "")
        context.fillStyle = this.fill_style;
    if (!this.filled && this.stroke_style != "")
        context.strokeStyle = this.stroke_style;
    if (!this.filled)
        context.lineWidth = this.stroke_thickness;

    context.setTransform(1,0,0,1, w / 2 + ox, h / 2 + oy);
    if (this.corner_radius != 0)
        app.display.drawRoundRect(-w / 2, -h / 2, this.w, this.h, this.corner_radius, this.filled, context);
    else
        app.display.drawRect(-w / 2, -h / 2, this.w, this.h, this.filled, context);

    this.cache_canvas = cache;
};
