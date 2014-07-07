"use strict";

function Scene()
{
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	var b2World = Box2D.Dynamics.b2World;
	
    // Private variables
	var actors = [];				// Array of actors
	
	// Public variables
	this.name = "";					// Name of scene
	this.visible = true;			// Visible state
	this.world = null;				// Box2D world
	this.world_scale = 20;			// Scaling from graphical world to Box2D world

	
	this.addActor = function(actor)
	{
		actors.push(actor);
		actor.scene = this;
	}
	
	this.removeActor = function(actor)
	{
		var count = actors.length;
		for (var t = 0; t < count; t++)
		{
			if (actors[t] == actor)
			{
				actor.scene = null;
				actors.splice(t, 1);
				return;
			}
		}
	}
	
	this.findActor = function(name)
	{
		var count = actors.length;
		for (var t = 0; t < count; t++)
		{
			if (actors[t].name == name)
			{
				return actors[t];
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
			
		var count = actors.length;
		for (var t = 0; t < count; t++)
		{
			actors[t].draw();
		}
	}
    
	this.baseUpdate = function(dt)
	{
		if (!this.visible)
			return false;
			
		if (this.world != null)
			this.world.Step(1 / window.app.target_frame_rate, 10, 10);		// frame-rate, velocity iterations, position iterations
			
		var count = actors.length;
		for (var t = 0; t < count; t++)
		{
			actors[t].update(dt);
		}
		
		if (this.world != null)
			this.world.ClearForces();
			
		return true;
	}
	
	this.update = function(dt)
	{
		return this.baseUpdate(dt);
	}
	
	this.findHitActor = function(position)
	{
		var count = actors.length;
		for (var t = count - 1; t >=0 ; t--)
		{
			if (actors[t].hitTest(position))
				return actors[t];
		}
		return null;
	}
	
}
