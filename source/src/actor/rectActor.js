/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A RectActor is derived from a {@link b5.Actor} that displays a rectangle / rounded rectangle shaped game object
 * instead of an image and inherits all properties, methods and so forth from its parent. A RectActor should be added
 * to a {@link b5.Scene} or another {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create a rectangle based actor
 *
 *       var actor = new b5.RectActor();
 *       actor.fill_style = "#40ff4f";   // Set fill style
 *       actor.filled = true;            // Set filled
 *       actor.w = 100;
 *       actor.h = 100;
 *       actor.corner_radius = 10;       // Set corner radius
 *       scene.addActor(actor);          // Add actor to scene for processing and drawing
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.RectActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.RectActor} The created RectActor
 *
 * @property {string}                   fill_style                          - Style used to fill the rect (default is #ffffff)
 * @property {string}                   stroke_style                        - Stroke used to draw none filled rect (default is #ffffff)
 * @property {number}                   stroke_thickness                    - Stroke thickness for none filled (default is #ffffff)
 * @property {boolean}                  filled                              - If true then rect interior will be filled otherwise empty (default is true)
 * @property {boolean}                  stroke_filled                       - If true then stroke will be drawn (default is true)
 * @property {number[]}                 corner_radius                       - The radius iof the rectangles corners
 *
 *
 */
b5.RectActor = function()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "#ffffff";          // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.corner_radius = 0;                 // Corner radius
    this.filled = true;				        // if true then interior will filled otherwise empty
    this.stroke_filled = false;				// if true then a stroke will be drawn
    
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

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw an rectangle instead of an image
 */
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
	{
		var count = this.actors.length;
		if (count > 0)
		{
			var acts = this.actors;
			if (this.draw_reverse)
			{
				for (var t = count - 1; t >= 0; t--)
					acts[t].draw();
			}
			else
			{
				for (var t = 0; t < count; t++)
					acts[t].draw();
			}
		}
		return;
	}

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

/**
 * Overrides the base {@link b5.Actor}.drawToCache() method to draw a rectangle to a cache
 */
b5.RectActor.prototype.drawToCache = function()
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
            ox = this.stroke_thickness >> 1;
            oy = this.stroke_thickness >> 1;
        }*/
        cache.width = (w * pr) | 0;
        cache.height = (h * pr) | 0;
    }

    disp.setCache(cache);
    // Render the actor
    if (this.filled && this.fill_style !== "")
        disp.setFillStyle(this.fill_style);
    if (this.stroke_filled && this.stroke_style !== "")
        disp.setStrokeStyle(this.stroke_style);
    if (this.stroke_filled)
        disp.setLineWidth(this.stroke_thickness);

    disp.setTransform(1,0,0,1, ox + w / 2, oy + h / 2);
    if (this.corner_radius !== 0)
        disp.drawRoundRect(-w / 2, -h / 2, this.w, this.h, this.corner_radius, this.filled);
    else
        disp.drawRect(-w / 2, -h / 2, this.w, this.h, this.filled);
    disp.setCache(null);

    this.cache_canvas = cache;
};

