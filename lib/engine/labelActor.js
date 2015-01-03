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
// var actor = new LabelActor();
// actor.font = "16pt Calibri";     // Set font
// actor.text_align = "center";     // Set horizontal alignment
// actor.text_baseline = "middle";  // Set vertical alignment
// actor.fill_style = "#ffffff";    // Set fill style
// actor.text = "Hello World";      // Set some text
// scene.addActor(actor);           // Add to scene for processing and drawing
//
//

LabelActor.prototype = new Actor();
LabelActor.prototype.constructor = LabelActor;
LabelActor.prototype.parent = Actor.prototype;
function LabelActor()
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
    Actor.call(this);

    this.type = Actor.Type_Label;       // Type of actor
}

LabelActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

LabelActor.prototype.draw = function()
{
    if (!this.visible || this.text == "")
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
        if (this.font != "")
            context.font = this.font;
        if (this.textAlign != "")
            context.textAlign = this.text_align;
        if (this.textBaseline != "")
            context.textBaseline = this.text_baseline;
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

    if (!this.ignore_camera && (this.depth == 0 || this.depth == 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.updateTransform();
    var trans = this.transform;
    context.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4] * dscale + mx, trans[5] * dscale + my);
    if (cache === null)
    {
        if (this.filled)
            context.fillText(this.text, 0,0);
        else
            context.strokeText(this.text, 0,0);
    }
    else
        context.drawImage(cache, -cache.width >> 1, -cache.height >> 1);
    this.postDraw(context);

    if (this.shadow) context.shadowColor = "transparent";

    // Draw child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }
};

LabelActor.prototype.drawToCache = function()
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
        cache.width = w;
        cache.height = h;
    }

    // Render the actor
    var context = cache.getContext("2d");	// The rendering context
    if (this.font != "")
        context.font = this.font;
    if (this.textAlign != "")
        context.textAlign = this.text_align;
    if (this.textBaseline != "")
        context.textBaseline = this.text_baseline;
    if (this.filled && this.fill_style != "")
        context.fillStyle = this.fill_style;
    if (!this.filled && this.stroke_style != "")
        context.strokeStyle = this.stroke_style;
    if (!this.filled)
        context.lineWidth = this.stroke_thickness;
    context.setTransform(1,0,0,1, 0,0);
    if (this.filled)
        context.fillText(this.text, ox + w/2, oy + h/2);
    else
        context.strokeText(this.text, ox + w/2, oy + h/2);

    this.cache_canvas = cache;
};

