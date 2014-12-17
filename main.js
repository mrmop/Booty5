'use strict';

window.onload = function()
{
	// Create the app
	var app = new TheApp(document.getElementById('gamecanvas'));
    window.app = app;
    app.debug = false;
    app.setCanvasScalingMethod(TheApp.FitBest);

	// Create and init game
	window.game = new SheepGame(app);
	window.game.initGame();
	
    // Start game when resources have been loaded	
    resource_check_interval = setInterval(function()
    {
        if (app.areResourcesLoaded(true))
        {
            // Start main loop
            app.start();
        }
        clearInterval(resource_check_interval);
    }, 500);
};
