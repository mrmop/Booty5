"use strict";

SheepActor.prototype = new Actor();
SheepActor.prototype.constructor = SheepActor;
SheepActor.prototype.parent = Actor.prototype;
function SheepActor()
{
	// Public variables

	// Call constructor
	Actor.call(this);
}

SheepActor.prototype.update = function(dt)
{
	return this.baseUpdate(dt);
}

SheepActor.prototype.onEndTouch = function(touch_pos)
{
	this.destroy();
	
	var snd = new Audio("audio/select.wav");
	snd.play();
	
	// Create an explosion particles actor
	var exp_particles = new ParticleActor();
	app.focus_scene.addActor(exp_particles);
	exp_particles.generateExplosion(50, ArcActor, 1, 100, 10, 2, 0.999, {
		fill_style: "#ffff00",
		x : this.x,
		y : this.y,
		vx : this.vx,
		vy : this.vy,
		radius: 30
	});

	
}
SheepActor.prototype.onMoveTouch = function(touch_pos)
{
}
