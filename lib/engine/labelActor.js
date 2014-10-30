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

    // Render the actor
    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var context = app.display.context;	// The rendering context

    context.font = this.font;
    if (context.textAlign != "")
        context.textAlign = this.text_align;
    if (context.textBaseline != "")
        context.textBaseline = this.text_baseline;
    if (this.fill_style != "")
        context.fillStyle = this.fill_style;

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

    if (this.parent == null || !this.use_parent_opacity)
        this.accum_opacity = this.opacity * this.scene.opacity;
    else
        this.accum_opacity = this.parent.accum_opacity * this.opacity;
    // Render the actor
    context.globalAlpha = this.accum_opacity;

    if (!this.ignore_camera && (this.depth == 0 || this.depth == 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }

    this.updateTransform();
    var trans = this.transform;
    context.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4] * dscale + mx, trans[5] * dscale + my);
    context.fillText(this.text, 0,0);

    // Draw child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }
};
