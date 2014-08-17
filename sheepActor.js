"use strict";

SheepActor.prototype = new Actor();
SheepActor.prototype.constructor = SheepActor;
SheepActor.prototype.parent = Actor.prototype;
function SheepActor(options)
{
	// Public variables

	// Call constructor
	Actor.call(this, options);
}

SheepActor.prototype.update = function(dt)
{
	return this.baseUpdate(dt);
}

SheepActor.prototype.onEndTouch = function(touch_pos)
{
	this.release();
	
	var snd = new Audio("audio/select.wav");
	snd.play();
}
SheepActor.prototype.onMoveTouch = function(touch_pos)
{
}
