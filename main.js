'use strict';
	
window.onload = function()
{
	// Create the app
	var app = new TheApp(document.getElementById('gamecanvas'));
    app.debug = false;
    window.app = app;

	// Create and init game
	window.game = new SheepGame(app);
	window.game.initGame();
	
	// Start main loop
	app.start();
};
