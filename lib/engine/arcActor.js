/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// An ArcActor is derived from an Actor that displays an arc (or circle) shaped game object instead of an image and
// inherits all properties, functions and so forth from its parent. An ArcActor should be added to a Scene or another
// Actor once created.
//
ArcActor.prototype = new Actor();
ArcActor.prototype.constructor = ArcActor;
ArcActor.prototype.parent = Actor.prototype;
function ArcActor()
{
    // Public variables
    this.fill_style = "#ffffff";            // Style used to fill the arc
    this.stroke_style = "#ffffff";          // Stroke used to draw none filled arc
    this.stroke_thickness = 1;              // Stroke thickness for none filled
    this.radius = 1;				        // Radius of arc
    this.start_angle = 0;			        // Start angle of arc in radians
    this.end_angle = 2 * Math.PI;	        // End angle of arc in radians
    this.filled = true;				        // if true then arc interior will filled otherwise empty
    this.grad_rotation = 0;                 // Gradient angle in degrees

    // Call constructor
    Actor.call(this);

    this.type = Actor.Type_Arc;     // Type of actor
}

ArcActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

ArcActor.prototype.draw = function()
{
    if (!this.visible)
        return;

    // Render the actor
    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var context = app.display.context;	// The rendering context
    if (this.filled && this.fill_style != "")
        context.fillStyle = this.fill_style;
    if (!this.filled && this.stroke_style != "")
        context.strokeStyle = this.stroke_style;
    if (!this.filled)
        context.lineWidth = this.stroke_thickness;
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
    var self_clip = this.self_clip;
    var clip_children = this.clip_children;
    context.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4] * dscale + mx, trans[5] * dscale + my);

    if (self_clip)
        this.setClipping(context, 0,0);

    app.display.drawArc(0,0, this.radius, this.start_angle, this.end_angle, this.filled);
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

ArcActor.prototype.hitTest = function(position)
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
            if (act != null)
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

