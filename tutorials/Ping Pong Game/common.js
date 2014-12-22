var difficulty = 4

var ball;
var player1;
var player2;
var bat_hit;

// CreateGame is called by the scenes OnCreate event handler
function CreateGame(scene)
{
	// Find ball, players and sound effect
	// We cache these resources so we dont have to search for them again
	// You do not have to do this but it can help to give a little extra speed
	// In more complex games
	ball = scene.findActor("ball1", false);
	player1 = scene.findActor("player1", false);
	player2 = scene.findActor("player2", false);
	bat_hit = scene.findResource("bat_hit", "sound");
}

// UpdateGame is called by the scenes OnTick event handler
function UpdateGame(scene)
{
	// Make player1 track players finger
	var touch_pos = scene.app.touch_pos;
	player1._x = touch_pos.x;
	
	// Check for collision between ball and players
	if (ball.vy > 0)
	{
		// Only check ball against player1 if ball travelling down screen
		if (player1.overlaps(ball))
		{
			var dx = player1.x - ball.x;
			ball.vx = -dx * 6;
			ball.vy = -ball.y;
			bat_hit.play();
		}
	}
	else
	{
		// Only check ball against player2 if ball travelling up screen
		if (player2.overlaps(ball))
		{
			var dx = player2.x - ball.x;
			ball.vx = -dx * 6;
			ball.vy = -ball.y;
			bat_hit.play();
		}
	}
	
	// Handle player2 AI
	if (ball.vy < 0)
	{
		var dx = ball.x - player2.x ;
		if (dx < -10)
			player2.x  -=  difficulty;
		else if (dx >  10)
			player2.x  +=  difficulty;
	}
	
	// Keep ball within screen boundaries
	if (ball.x < -512 || ball.x > 512)
		ball.vx = -ball.vx;
	
	// Reset ball if it gets by a player
	if (ball.y < -350 || ball.y > 350)
		ball.y = 0;
}
