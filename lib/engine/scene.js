"use strict";

function Scene()
{
    // Private variables
	this.actors = [];				// Array of actors
	
	// Public variables
	this.name = "";					// Name of scene
	this.visible = true;			// Visible state
	this.world = null;				// Box2D world
	this.world_scale = 20;			// Scaling from graphical world to Box2D world
}

Scene.prototype.addActor = function(actor)
{
	this.actors.push(actor);
	actor.scene = this;
}

Scene.prototype.removeActor = function(actor)
{
	var acts = this.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		if (acts[t] == actor)
		{
			actor.scene = null;
			acts.splice(t, 1);
			return;
		}
	}
}

Scene.prototype.removeActorsWithID = function(id)
{
	var acts = this.actors;
	var count = acts.length;
	var removals = [];
	for (var t = 0; t < count; t++)
	{
		if (acts[t].id == id)
			removals.push(acts[t]);
	}
	var count_removals = removals.length;
	for (var t = 0; t < count_removals; t++)
	{
		removals[t].release();
	}
}

Scene.prototype.findActor = function(name)
{
	var acts = this.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		if (acts[t].name == name)
		{
			return acts[t];
		}
	}
	return null;
}

Scene.prototype.bringToFront = function(actor)
{
	this.removeActor(actor);
	this.addActor(actor);
}

Scene.prototype.initWorld = function(gravity_x, gravity_y, allow_sleep)
{
	this.world = new Box2D.Dynamics.b2World(new Box2D.Common.Math.b2Vec2(gravity_x, gravity_y), allow_sleep);
}

Scene.prototype.draw = function()
{
	if (!this.visible)
		return;
		
	var acts = this.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		acts[t].draw();
	}
}

Scene.prototype.baseUpdate = function(dt)
{
	if (!this.visible)
		return false;
		
	if (this.world != null)
		this.world.Step(1 / window.app.target_frame_rate, 10, 10);		// frame-rate, velocity iterations, position iterations
		
	var acts = this.actors;
	var count = acts.length;
	for (var t = 0; t < count; t++)
	{
		acts[t].update(dt);
	}
	
	if (this.world != null)
		this.world.ClearForces();
		
	return true;
}

Scene.prototype.update = function(dt)
{
	return this.baseUpdate(dt);
}

Scene.prototype.findHitActor = function(position)
{
	var acts = this.actors;
	var count = acts.length;
	for (var t = count - 1; t >=0 ; t--)
	{
		if (acts[t].hitTest(position))
			return acts[t];
	}
	return null;
}
