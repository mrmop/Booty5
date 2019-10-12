/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
//
/**
 * An ArcActor is derived from a {@link b5.Actor} that displays an arc (or circle) shaped game object instead of an
 * image and inherits all properties, methods and so forth from its parent. An ArcActor should be added to a
 * {@link b5.Scene} or another {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create an ArcActor:
 *
 *      var actor = new b5.ArcActor();
 *      actor.x = 100;
 *      actor.y = 0;
 *      actor.fill_style = "#00ffff";
 *      actor.start_angle = 0;
 *      actor.end_angle = 2 * Math.PI;
 *      actor.radius = 50;
 *      actor.filled = true;
 *      scene.addActor(actor);    // Add actor to scene to be processed and drawn
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.ArcActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.ArcActor} The created ArcActor
 *
 * @property {string}                   fill_style                          - Style used to fill the arc (default is #ffffff)
 * @property {string}                   stroke_style                        - Stroke used to draw none filled arc (default is #ffffff)
 * @property {number}                   stroke_thickness                    - Stroke thickness for none filled (default is #ffffff)
 * @property {number}                   radius                              - Radius of arc (default is 1)
 * @property {number}                   start_angle                         - Start angle of arc in radians (default is 0)
 * @property {number}                   end_angle                           - End angle of arc in radians (default is 2*PI)
 * @property {boolean}                  filled                              - if true then arc interior will be filled otherwise empty (default is true)
 * @property {boolean}                  stroke_filled                       - If true then stroke will be drawn (default is true)
 *
 */
b5.ArcActor = function()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "#ffffff";          // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.radius = 1;				        // Radius of arc
    this.start_angle = 0;			        // Start angle of arc in radians
    this.end_angle = 2 * Math.PI;	        // End angle of arc in radians
    this.filled = true;				        // if true then arc interior will filled otherwise empty
    this.stroke_filled = false;				// if true then a stroke will be drawn
    
    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Arc;     // Type of actor
};
b5.ArcActor.prototype = new b5.Actor();
b5.ArcActor.prototype.constructor = b5.ArcActor;
b5.ArcActor.prototype.parent = b5.Actor.prototype;

b5.ArcActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw an arc instead of an image
 */
b5.ArcActor.prototype.draw = function()
{
    if (!this.visible)
        return;

    if (this.cache)
    {
        this.drawToCache();
        this.cache = false;
    }
    if (this.merge_cache)   // If merged into parent ache then parent will have drawn so no need to draw again
    {
		this.drawChildren(false);
		this.drawChildren(true);
        return;
    }
    
    this.updateTransform();
	// Draw child actors
    var drawn_all = this.drawChildren(false);
    
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
        if (this.stroke_filled && this.stroke_style !== "")
            disp.setStrokeStyle(this.stroke_style);
        if (this.stroke_filled)
            disp.setLineWidth(this.stroke_thickness);
    }

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.preDraw();
    
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
        disp.drawArc(0,0, this.radius, this.start_angle, this.end_angle, this.filled);
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
	if (!drawn_all)
		this.drawChildren(true);
    if (clip_children)
        disp.restoreContext();
};

/**
 * Overrides the base {@link b5.Actor}.drawToCache() method to draw an arc to a cache
 */
b5.ArcActor.prototype.drawToCache = function()
{
    var disp = b5.app.display;
    var cache = null;
    var pad = this.padding * 2;
    var w = this.w + pad;
    var h = this.h + pad;
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
        var pr = b5.app.pixel_ratio;
        cache = disp.createCache();
/*        if (this.stroke_filled && this.stroke_style !== "")
        {
            w += this.stroke_thickness;
            h += this.stroke_thickness;
            ox = (this.stroke_thickness / 2 + 0.5) << 0;
            oy = (this.stroke_thickness / 2 + 0.5) << 0;
        }*/
        cache.width = (w * pr) | 0;
        cache.height = (h * pr) | 0;
    }
    
    disp.setCache(cache);
	this.preDrawCached();
    // Render the actor
    if (this.filled && this.fill_style !== "")
        disp.setFillStyle(this.fill_style);
    if (this.stroke_filled && this.stroke_style !== "")
        disp.setStrokeStyle(this.stroke_style);
    if (this.stroke_filled)
        disp.setLineWidth(this.stroke_thickness);

    disp.setTransform(1,0,0,1, ox + w/2, oy + h/2);
    disp.drawArc(0,0, this.radius, this.start_angle, this.end_angle, this.filled);
	this.postDrawCached();
    
    disp.setCache(null);

    this.cache_canvas = cache;
};

/**
 * Overrides the base {@link b5.Actor}.hitTest() method to test against a circle
 */
b5.ArcActor.prototype.hitTest = function(position)
{
    if (!this.touchable)
        return null;

    // Check child actors
    var count = this.actors.length;
    var act;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
        {
            act = acts[t].hitTest(position);
            if (act !== null)
                return act;
        }

    }

    var scene = this.scene;
    var trans = this.transform;
    var cx = trans[4] + scene.x;
    var cy = trans[5] + scene.y;
    if (!this.ignore_camera)
    {
        cx -= scene.camera_x;
        cy -= scene.camera_y;
    }
    var sx = this.accum_scale_x;
    var sy = this.accum_scale_y;
    var px = (position.x - cx) / sx;
    var py = (position.y - cy) / sy;
    var tx = px * trans[0] + py * trans[1];
    var ty = px * trans[2] + py * trans[3];
    var r = this.radius * sx;
    r *= r;
    var d = tx * tx + ty * ty;
    if (d <= r)
        return this;

    return null;
};

