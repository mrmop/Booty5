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
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.filled = true;				        // if true then polygons interior will filled otherwise empty
    this.points = null;				        // List of points to draw

    // Call constructor
    Actor.call(this);

    this.type = Actor.Type_Polygon; // Type of actor
}

PolygonActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

PolygonActor.prototype.draw = function()
{
    if (!this.visible || this.points == null)
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

    var dscale = app.canvas_scale;
    var mx = app.canvas_cx + this.scene.x * dscale;
    var my = app.canvas_cy + this.scene.y * dscale;

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
        this.setClipping(context, 0,0);

    if (cache === null)
        app.display.drawPolygon(0,0, this.points, this.filled);
    else
        context.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw(context);

    if (clip_children)
    {
        if (!self_clip)
            this.setClipping(context, 0,0);
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

PolygonActor.prototype.drawToCache = function()
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
    context.setTransform(1,0,0,1, ox+this.w / 2, oy+this.h / 2);
    app.display.drawPolygon(0,0, this.points, this.filled, context);

    this.cache_canvas = cache;
};


// TODO: Add polygon specific version of hitTest

