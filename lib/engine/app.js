"use strict";

function TheApp($canvas)
{
    // Private variables
	var scenes = [];
	var timer;
	var touch_supported = $.isTouchSupported;
	var touched = false;
	var touch_pos = null;
	
	// Public variables
	this.target_frame_rate = 60;			// Frame rate at which to update the game
	this.focus_scene = null;				// Scene that has current input focus
	this.clear_canvas = false;
	this.touch_focus = null;
	
	// Create the 2D canvas
	window.canvas2d = new Canvas2D($canvas);

	// Touch handling
	function onTouchStart(e)
	{
		if (touch_supported)
			e.stopPropagation();
		e.preventDefault();
		touched = true;
		if (touch_supported)
			touch_pos = window.canvas2d.getCanvasPoint(e.touches[0].pageX, e.touches[0].pageY);
		else
			touch_pos = window.canvas2d.getCanvasPoint(e.pageX, e.pageY);
		var actor = window.app.findHitActor(touch_pos);
		if (actor != null)
		{
			if (actor.touchable)
			{
				this.touch_focus = actor;
				if (actor.onBeginTouch != undefined)
				{
					actor.onBeginTouch(touch_pos);
				}
			}
		}
	}
	function onTouchEnd(e)
	{
		touched = false;
		if (touch_supported)
			touch_pos = window.canvas2d.getCanvasPoint(e.touches[0].pageX, e.touches[0].pageY);
		else
			touch_pos = window.canvas2d.getCanvasPoint(e.pageX, e.pageY);
		var actor = window.app.findHitActor(touch_pos);
		if (actor != null)
		{
			if (actor.onEndTouch != undefined)
			{
				actor.onEndTouch(touch_pos);
			}
		}
		if (this.touch_focus != null)
		{
			if (this.touch_focus.onLostTouchFocus != undefined)
			{
				this.touch_focus.onLostTouchFocus(touch_pos);
			}
			this.touch_focus = null;
		}
	}
	function onTouchMove(e)
	{
		if (touch_supported)
		{
			e.stopPropagation();
			e.preventDefault();
		}
		if (touch_supported)
			touch_pos = window.canvas2d.getCanvasPoint(e.touches[0].pageX, e.touches[0].pageY);
		else
			touch_pos = window.canvas2d.getCanvasPoint(e.pageX, e.pageY);
		var actor = window.app.findHitActor(touch_pos);
		if (actor != null)
		{
			if (actor.onMoveTouch != null)
				actor.onMoveTouch(touch_pos);
		}
	}
	
	if (touch_supported)
	{
		$("#main>canvas").touchstart(onTouchStart)
			.touchmove(onTouchMove)
			.touchend(onTouchEnd);
	}
	else
	{
		$("#main>canvas").mousedown(onTouchStart)
			.mousemove(onTouchMove)
			.mouseup(onTouchEnd)
			.mouseout(onTouchEnd);
	}
	
	this.findHitActor = function(position)
	{
		if (this.focus_scene != null)
			return this.focus_scene.findHitActor(position);
		return null;
	}
	

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
		if (window.app.clear_canvas)
		{
			window.canvas2d.clear(true);
		}
		window.app.update(1);
		window.app.draw();
	}
	
	this.start = function()
	{
		timer = setInterval(mainLoop, 1000 / window.app.target_frame_rate);
	}
}
