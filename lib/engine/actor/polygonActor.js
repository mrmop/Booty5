/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A PolygonActor is derived from a {@link b5.Actor} that displays a polygon shaped game object instead of an image and
 * inherits all properties, methods and so forth from its parent. A PolygonActor should be added to a {@link b5.Scene}
 * or another {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create a polygon based actor
 *
 *      var actor = new b5.PolygonActor();
 *      actor.name = "polygon1";
 *      actor.points = [0, -50, 50, 50, -50, 50];    // Set actors shape
 *      actor.fill_style = "#804fff";                // Set fill style
 *      actor.filled = true;                         // Set filled
 *      scene.addActor(actor);                       // Add actor to scene for processing and drawing
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.PolygonActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.PolygonActor} The created PolygonActor
 *
 * @property {string}                   fill_style                          - Style used to fill the polygon (default is #ffffff)
 * @property {string}                   stroke_style                        - Stroke used to draw none filled polygon (default is #ffffff)
 * @property {number}                   stroke_thickness                    - Stroke thickness for none filled (default is #ffffff)
 * @property {boolean}                  filled                              - if true then polygon interior will be filled otherwise empty (default is true)
 * @property {number[]}                 points                              - An array of points that describe the shape of the actor in the form [x1,y1,x2,y2,....]
 *
 *
 */

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

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw a polygon instead of an image
 */
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
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    var trans = this.transform;
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
    if (this.round_pixels)
    {
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

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

/**
 * Overrides the base {@link b5.Actor}.drawToCache() method to draw a polygon to a cache
 */
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

