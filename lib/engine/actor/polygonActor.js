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
// var actor = new b5.PolygonActor();
// actor.name = "polygon1";
// actor.points = [0, -50, 50, 50, -50, 50];    // Set actors shape
// actor.fill_style = "#804fff";                // Set fill style
// actor.filled = true;                         // Set filled
// scene.addActor(actor);                       // Add actor to scene for processing and drawing

b5.PolygonActor = function()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "";                 // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.filled = true;				        // if true then polygons interior will filled otherwise empty
    this.points = null;				        // List of points to draw

    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Polygon; // Type of actor
};
b5.PolygonActor.prototype = new b5.Actor();
b5.PolygonActor.prototype.constructor = b5.PolygonActor;
b5.PolygonActor.prototype.parent = b5.Actor.prototype;

b5.PolygonActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

b5.PolygonActor.prototype.draw = function()
{
    if (!this.visible || this.points === null)
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

    var dscale = app.canvas_scale;
    var mx = app.canvas_cx + this.scene.x * dscale;
    var my = app.canvas_cy + this.scene.y * dscale;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.updateTransform();
    var trans = this.transform;
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4] * dscale + mx, trans[5] * dscale + my);

    if (self_clip)
        this.setClipping(0,0);

    if (cache === null)
        disp.drawPolygon(0,0, this.points, this.filled);
    else
        disp.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw();

    if (clip_children)
    {
        if (!self_clip)
            this.setClipping(0,0);
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

b5.PolygonActor.prototype.drawToCache = function()
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
    disp.setTransform(1,0,0,1, ox+this.w / 2, oy+this.h / 2);
    disp.drawPolygon(0,0, this.points, this.filled);
    disp.setCache(null);

    this.cache_canvas = cache;
};


// TODO: Add polygon specific version of hitTest

