"use strict";

function TheApp()
{
    // Private variables
	var scenes = [];
	var timer;
	
	// Public variables
	this.target_frame_rate = 30;

	this.addScene = function(scene)
	{
		scenes.push(scene);
	}
	
	this.removeScene = function(scene)
	{
		var count = scenes.length;
		for (var t = 0; t < count; t++)
		{
			if (scenes[t] == scene)
			{
				scenes.splice(t, 1);
				return;
			}
		}
	}
	
	this.findScene = function(name)
	{
		var count = scenes.length;
		for (var t = 0; t < count; t++)
		{
			if (scenes[t].name == name)
			{
				return scenes[t];
			}
		}
		return null;
	}
	
	this.draw = function()
	{
		var count = scenes.length;
		for (var t = 0; t < count; t++)
		{
			scenes[t].draw();
		}
	}
    
	this.update = function(dt)
	{
		var count = scenes.length;
		for (var t = 0; t < count; t++)
		{
			scenes[t].update(dt);
		}
	}
	
	function mainLoop()
	{
//		window.canvas2d.clear();
		window.app.update(1);
		window.app.draw();
	}
	
	this.start = function()
	{
		timer = setInterval(mainLoop, 1000 / window.app.target_frame_rate);
	}
}
