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
// var actor = new b5.RectActor();
// actor.fill_style = "#40ff4f";   // Set fill style
// actor.filled = true;            // Set filled
// actor.w = 100;
// actor.h = 100;
// scene.addActor(actor);          // Add actor to scene for processing and drawing

b5.RectActor = function()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "#ffffff";          // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.corner_radius = 0;                 // Corner radius
    this.filled = true;				        // if true then interior will filled otherwise empty

    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Rect;    // Type of actor
};
b5.RectActor.prototype = new b5.Actor();
b5.RectActor.prototype.constructor = b5.RectActor;
b5.RectActor.prototype.parent = b5.Actor.prototype;

b5.RectActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

b5.RectActor.prototype.draw = function()
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
    var disp = app.display;
    if (cache === null)
    {
        if (this.filled && this.fill_style !== "")
            disp.setFillStyle(this.fill_style);
        if (!this.filled && this.stroke_style !== "")
            disp.setStrokeStyle(this.stroke_style);
        if (!this.filled)
            disp.setLineWidth(this.stroke_thickness);
    }
    this.preDraw();

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

    var cx = this.w / 2;
    var cy = this.h / 2;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.updateTransform();
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    var trans = this.transform;
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
    if (this.round_pixels)
    {
        cx = (cx + 0.5) | 0;
        cy = (cy + 0.5) | 0;
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

    if (self_clip)
        this.setClipping(-cx, -cy);

    if (cache === null)
    {
        if (this.corner_radius !== 0)
            disp.drawRoundRect(-cx, -cy, this.w, this.h, this.corner_radius, this.filled);
        else
            disp.drawRect(-cx, -cy, this.w, this.h, this.filled);
    }
    else
        disp.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw();

    if (clip_children)
    {
        if (!self_clip)
            this.setClipping(-cx, -cy);
    }
    else
    if (self_clip)
        disp.restoreContext();

    // Draw child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }

    if (clip_children)
        disp.restoreContext();
};

b5.RectActor.prototype.drawToCache = function()
{
    var disp = b5.app.display;
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
        cache = disp.createCache();
        if (!this.filled && this.stroke_style !== "")
        {
            w += this.stroke_thickness;
            h += this.stroke_thickness;
            ox = this.stroke_thickness >> 1;
            oy = this.stroke_thickness >> 1;
        }
        cache.width = w;
        cache.height = h;
    }

    disp.setCache(cache);
    // Render the actor
    if (this.filled && this.fill_style !== "")
        disp.setFillStyle(this.fill_style);
    if (!this.filled && this.stroke_style !== "")
        disp.setStrokeStyle(this.stroke_style);
    if (!this.filled)
        disp.setLineWidth(this.stroke_thickness);

    disp.setTransform(1,0,0,1, w / 2 + ox, h / 2 + oy);
    if (this.corner_radius !== 0)
        disp.drawRoundRect(-w / 2, -h / 2, this.w, this.h, this.corner_radius, this.filled);
    else
        disp.drawRect(-w / 2, -h / 2, this.w, this.h, this.filled);
    disp.setCache(null);

    this.cache_canvas = cache;
};

