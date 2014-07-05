"use strict";

function TheApp()
{
    // Private variables
	var scenes = [];
	var timer;

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
		window.canvas2d.clear();
		window.app.update(1);
		window.app.draw();
	}
	
	this.start = function()
	{
		timer = setInterval(mainLoop, 33);
	}
}

$(function()
{
	// Create the app
	window.app = new TheApp();
	
	// Create the 2D canvas
	window.canvas2d = new Canvas2D($("#main>canvas"));
	
	// Create and load the resources
	window.resources = new Resources();
	window.resources.load();
	
	// Create a scene
	var scene = new Scene();
	window.app.addScene(scene);
	
	// Add some sprites
	for (var t = 0; t < 1000; t++)
	{
		var sprite = new Sprite();
		sprite.name = "reel" + t;
//		sprite.x = 100 + t * 120;
//		sprite.y = 100;
		sprite.x = Math.random() * window.canvas2d.width;
		sprite.y = Math.random() * window.canvas2d.height;
		sprite.w = 100;
		sprite.h = 100;
		sprite.frame = 0;
		sprite.frame_speed = 0.1;
		sprite.atlas = window.resources.reelAtlas;
		scene.addSprite(sprite);
	}
	
	// Start main loop
	window.app.start();
	
})