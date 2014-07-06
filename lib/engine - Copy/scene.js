"use strict";

function Scene()
{
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2World = Box2D.Dynamics.b2World;
	
    // Private variables
	var sprites = [];
	
	// Public variables
	this.name = "";					// Name of scene
	this.visible = true;			// Visible state
	this.world = null;				// Box2D world
	this.world_scale = 20;			// Scaling from graphical world to Box2D world

	
	this.addSprite = function(sprite)
	{
		sprites.push(sprite);
		sprite.scene = this;
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
	
	this.initWorld = function(gravity_x, gravity_y, allow_sleep)
	{
		this.world = new b2World(new b2Vec2(gravity_x, gravity_y), allow_sleep);
	}
	
	this.draw = function()
	{
		if (!this.visible)
			return;
			
		var count = sprites.length;
		for (var t = 0; t < count; t++)
		{
			sprites[t].draw();
		}
	}
    
	this.baseUpdate = function(dt)
	{
		if (!this.visible)
			return false;
			
		if (this.world != null)
			this.world.Step(1 / window.app.target_frame_rate, 10, 10);		// frame-rate, velocity iterations, position iterations
			
		var count = sprites.length;
		for (var t = 0; t < count; t++)
		{
			sprites[t].update(dt);
		}
		
		if (this.world != null)
			this.world.ClearForces();
			
		return true;
	}
	
	this.update = function(dt)
	{
		return this.baseUpdate(dt);
	}
}
