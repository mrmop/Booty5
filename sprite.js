"use strict";

function Sprite(options)
{
	// Private variables
	var context = window.canvas2d.context;	// The rendering context
	var trans_dirty = true;			// Transform dirty flag
	
	// Public variables
	this.name = "";					// Name of sprite
	this.parent = null;				// Parent scene
	this.x = 0;						// X position on screen
	this.y = 0;						// Y position on screen
	this.w = 0;						// Display width
	this.h = 0;						// Display height
	this.current_frame = 0;			// Current animation frame
	this.frame_speed = 0;			// Current animation frame
	this.atlas = null;				// Sprite atlas
	
	this.draw = function()
	{
		// Get source image coordinates from the atlas
		var src = this.atlas.getFrame(this.current_frame);
		
		// Render the sprite
		context.drawImage(this.atlas.image, src.x, src.y, src.w, src.h, this.x, this.y, this.w, this.h);
	}
	
	this.update = function(dt)
	{
		// Update the frame
		this.current_frame += this.frame_speed * dt;
		var max = this.atlas.getMaxFrames();
		if (this.current_frame > max)
			this.current_frame -= max;
		this.x += 2 * dt;
		if (this.x > window.canvas2d.width)
			this.x -= window.canvas2d.width;
	}
}

