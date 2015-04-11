/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A LabelActor is derived from an Actor that displays text game objects instead of an image and inherits all
// properties, functions and so forth from its parent. A LabelActor should be added to a Scene or another Actor
// once created
//
//// Creating a basic label actor
// var actor = new b5.LabelActor();
// actor.font = "16pt Calibri";     // Set font
// actor.text_align = "center";     // Set horizontal alignment
// actor.text_baseline = "middle";  // Set vertical alignment
// actor.fill_style = "#ffffff";    // Set fill style
// actor.text = "Hello World";      // Set some text
// scene.addActor(actor);           // Add to scene for processing and drawing
//
//

b5.LabelActor = function()
{
    // Public variables
    this.text = "";                     // The text to display
    this.font = "16pt Calibri";         // The font to display the text in
    this.text_align = "center";         // Text horizontal alignment
    this.text_baseline = "middle";      // Text vertical alignment
    this.fill_style = "#ffffff";        // Fill style
    this.stroke_style = "#ffffff";      // Stroke used to draw none filled
    this.stroke_thickness = 1;          // Stroke thickness for none filled
    this.filled = true;                 // If true then text will be drawn filled, otherwise none filled

    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Label;       // Type of actor
};
b5.LabelActor.prototype = new b5.Actor();
b5.LabelActor.prototype.constructor = b5.LabelActor;
b5.LabelActor.prototype.parent = b5.Actor.prototype;

b5.LabelActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

b5.LabelActor.prototype.draw = function()
{
    if (!this.visible || this.text === "")
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
        if (this.font !== "")
            disp.setFont(this.font);
        if (this.textAlign !== "")
            disp.setTextAlign(this.text_align);
        if (this.textBaseline !== "")
            disp.setTextBaseline(this.text_baseline);
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

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.updateTransform();
    var trans = this.transform;
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
    if (this.round_pixels)
    {
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);
    if (cache === null)
        disp.drawText(this.text, 0,0, this.filled);
    else
        disp.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw();

    // Draw child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }
};

b5.LabelActor.prototype.drawToCache = function()
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
        cache.width = w;
        cache.height = h;
    }

    disp.setCache(cache);
    // Render the actor
    if (this.font !== "")
        disp.setFont(this.font);
    if (this.textAlign !== "")
        disp.setTextAlign(this.text_align);
    if (this.textBaseline !== "")
        disp.setTextBaseline(this.text_baseline);

    if (this.filled && this.fill_style !== "")
        disp.setFillStyle(this.fill_style);
    if (!this.filled && this.stroke_style !== "")
        disp.setStrokeStyle(this.stroke_style);
    if (!this.filled)
        disp.setLineWidth(this.stroke_thickness);
    disp.setTransform(1,0,0,1, 0,0);
    disp.drawText(this.text, ox + w/2, oy + h/2, this.filled);
    disp.setCache(null);

    this.cache_canvas = cache;
};

