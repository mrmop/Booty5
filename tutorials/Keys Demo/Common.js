function processKeys(e)
{
	console.log(e);
	var app = b5.app;
	var scene = app.focus_scene;
	var ac = scene.findActor("player");
	var speed = 5;
	if (e.keyCode == 38)
		ac._y -= speed;
	if (e.keyCode == 40)
		ac._y += speed;
	if (e.keyCode == 37)
		ac._x -= speed;
	if (e.keyCode == 39)
		ac._x += speed;
}