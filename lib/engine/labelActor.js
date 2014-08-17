"use strict";

LabelActor.prototype = new Actor();
LabelActor.prototype.constructor = LabelActor;
LabelActor.prototype.parent = Actor.prototype;
function LabelActor(options)
{
	// Public variables
	this.text = "";
	this.font = "16pt Calibri";
	this.text_align = "center";
	this.text_baseline = "middle";
	this.fill_style = "#ffffff";
	
	// Call constructor
	Actor.call(this, options);
}

LabelActor.prototype.update = function(dt)
{
	return this.baseUpdate(dt);
}

LabelActor.prototype.draw = function()
{
	if (!this.visible || this.text == "")
		return;
		
	// Get source image coordinates from the atlas
	var src = null;
	if (this.atlas != null)
		src = this.atlas.getFrame(this.current_frame);
	
	// Render the actor
	var context = window.canvas2d.context;	// The rendering context
	context.font = this.font;
	context.textAlign = this.text_align;
	context.textBaseline = this.text_baseline;
	context.fillStyle = this.fill_style;
	
	if (this.use_transform)
	{
		var cx = this.ox * this.w;
		var cy = this.oy * this.h;
		var trans = this.transform;
		if (this.transform_dirty)
		{
			var r = this.rotation;
			var sx = this.scale_x;
			var sy = this.scale_y;
			var cos = Math.cos(r);
			var sin = Math.sin(r);
			trans[0] = cos * sx;
			trans[1] = sin * sx;
			trans[2] = -sin * sy;
			trans[3] = cos * sy;
			trans[4] = this.x;
			trans[5] = this.y;
			this.transform_dirty = false;
		}
		cx = (cx + 0.5) << 0;	// Make int
		cy = (cy + 0.5) << 0;	// Make int
		context.setTransform(trans[0], trans[1], trans[2], trans[3], trans[4], trans[5]);
		context.fillText(this.text, -cx, -cy);
	}
	else
	{
		var x = (this.x + 0.5) << 0;
		var y = (this.y + 0.5) << 0;
		context.fillText(this.text, x, y);
	}
	context.setTransform(1, 0, 0, 1, 0, 0);
}
