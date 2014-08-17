"use strict";

function loadGame()
{
	window.game = new SheepGame();
	window.game.initGame();
}

$(function()
{
	// Create the app
	window.app = new TheApp($("#main>canvas"));

/*	function resizeCanvas()
	{
		var scale;
		if (window.innerHeight > window.innerWidth)
			scale = window.innerWidth / canvas.width();
		else
			scale = window.innerHeight / canvas.height();
		document.getElementById("canvas").style.transform = "scale(" + scale + ")";
		document.getElementById("canvas").style.webkitTransform = "scale(" + scale + ")";
	}
	$(window).resize(resizeCanvas);
	resizeCanvas();*/
	
	loadGame("dropper");
	
	// Start main loop
	window.app.start();
	
})