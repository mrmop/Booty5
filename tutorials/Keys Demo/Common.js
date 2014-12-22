function processKeys(e)
{
	var app = window.app;
	var scene = app.focus_scene;
	var ac = scene.findActor("player");
	var speed = 5;
	if (e.keyCode == 38)
		ac.y -= speed;
	if (e.keyCode == 40)
		ac.y += speed;
	if (e.keyCode == 37)
		ac.x -= speed;
	if (e.keyCode == 39)
		ac.x += speed;
}