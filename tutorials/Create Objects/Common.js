function createNewBalls()
{
	var app = window.app;
	
	// This scene will receive a copy of ball object
	var game_scene = app.findScene("gamescene");

	// Seatch Xoml gamescene for ball icon actor resource
	var ball_template = Xoml.findResource(window.gamescene, "ball", "icon");
	
	// Create ball from the Xoml template and add it to game_scene
	var xoml = new Xoml(app);
	xoml.current_scene = game_scene;	// Xoml system needs to know current scene so it knows where to look for dependent resources
	var ball = xoml.parseResource(game_scene, ball_template);
	ball.setPositionPhysics(0, -350);
	ball.vx = 4;
	ball.updateToPhysics();
	ball.fill_style = "rgb(" + ((Math.random() * 255) << 0) + "," + ((Math.random() * 255) << 0) + "," + ((Math.random() * 255) << 0) + ")";
	
}

