"use strict";

function Scene()
{
    // Private variables
	var sprites = [];
	
	// Public variables
	this.name = "";					// Name of scene

	
	this.addSprite = function(sprite)
	{
		sprites.push(sprite);
		sprite.parent = this;
	}
	
	this.removeSprite = function(sprite)
	{
		var count = sprites.length;
		for (var t = 0; t < count; t++)
		{
			if (sprites[t] == sprite)
			{
				sprites.splice(t, 1);
				return;
			}
		}
	}
	
	this.findSprite = function(name)
	{
		var count = sprites.length;
		for (var t = 0; t < count; t++)
		{
			if (sprites[t].name == name)
			{
				return sprites[t];
			}
		}
		return null;
	}
	
	this.draw = function()
	{
		var count = sprites.length;
		for (var t = 0; t < count; t++)
		{
			sprites[t].draw();
		}
	}
    
	this.update = function(dt)
	{
		var count = sprites.length;
		for (var t = 0; t < count; t++)
		{
			sprites[t].update(dt);
		}
	}
}
