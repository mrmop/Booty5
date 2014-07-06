"use strict";

function ImageAtlas(image, width, height)
{
	// Private variables
	var frames = [];
	
	// Public variables
	this.image = image;					// The sprite atlases image
	this.width = width;					// Width of the atlas
	this.height = height;				// Height of the atlas
	
	this.addFrame = function(sx, sy, sw, sh)
	{
		frames.push({x: sx, y: sy, w: sw, h: sh});
	}
	
	this.getFrame = function(index)
	{
		return frames[Math.floor(index)];
	}
	
	this.getMaxFrames = function()
	{
		return frames.length;
	}
	
	this.generate = function(frame_w, frame_h, count_x, count_y)
	{
		var fy = 0;
		for (var y = 0; y < count_y; y++)
		{
			var fx = 0;
			for (var x = 0; x < count_x; x++)
			{
				this.addFrame(fx, fy, frame_w, frame_h);
				fx += frame_w;
			}
			fy += frame_h;
		}
	}

}

