function CreateSprite()
{
	var app = b5.app;
	var scene = app.findScene("gamescene");
	
	var actor = new b5.Actor();
	actor.x = 0;
	actor.y = 0;
	actor.w = 172;
	actor.h = 89;
	actor.atlas = app.findResource("sheep", "brush");
	scene.addActor(actor);
	
	console.log("Created an actor");

}