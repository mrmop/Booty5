/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A LabelActor is derived from an Actor that displays text game objects instead of an image and inherits all
// properties, functions and so forth from its parent. A LabelActor should be added to a Scene or another Actor
// once created
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

    this.ox = 0;
    this.oy = 0;
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
    var display = app.display;
    var context = display.context;	// The rendering context
    context.font = this.font;
    if (context.textAlign != "")
        context.textAlign = this.text_align;
    if (context.textBaseline != "")
        context.textBaseline = this.text_baseline;
    if (this.fill_style != "")
        context.fillStyle = this.fill_style;

    var mx = display.canvas_width / 2 + scene.x;
    var my = display.canvas_height / 2 + scene.y;

    if (this.parent == null || !this.use_parent_opacity)
        this.accum_opacity = this.opacity * this.scene.opacity;
    else
        this.accum_opacity = this.parent.accum_opacity * this.opacity;
    // Render the actor
    context.globalAlpha = this.accum_opacity;
    if (this.use_transform)
    {
        var cx = this.ox;
        var cy = this.oy;
        if (!this.absolute_origin)
        {
            cx *= this.w;
            cy *= this.h;
        }
        cx = (cx + 0.5) << 0;	// Make int
        cy = (cy + 0.5) << 0;	// Make int

        if (!this.ignore_camera && this.depth == 0)
        {
            mx -= scene.camera_x;
            my -= scene.camera_y;
        }

        this.updateTransform();
        var trans = this.transform;
        context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4] + mx, trans[5] + my);
        context.fillText(this.text, -cx, -cy);
    }
    else
    {
        var x = this.x;
        var y = this.y;
        if (this.parent != null)
        {
            x += this.parent.x;
            y += this.parent.y;
        }
        if (!this.ignore_camera)
        {
            x -= scene.camera_x;
            y -= scene.camera_y;
        }
        x = (x + mx + 0.5) << 0;
        y = (y + my + 0.5) << 0;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillText(this.text, x, y);
    }

    // Draw child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }
};
