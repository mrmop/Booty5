"use strict";

SheepScene.prototype = new Scene();
SheepScene.prototype.constructor = SheepScene;
SheepScene.prototype.parent = Scene.prototype;
function SheepScene()
{
	// Public variables

	// Call constructor
	Scene.call(this);
}

SheepScene.prototype.update = function(dt)
{
//	this.camera_x += 1;
	return this.baseUpdate(dt);
}

