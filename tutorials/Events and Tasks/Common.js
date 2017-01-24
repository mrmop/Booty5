function TestEvents()
{
	var app = b5.app;
	app.events.on("Hello", function(event)
	{
		console.log("Hello event was raised by app");
		console.log(event);
	}, this);
	
	app.events.dispatch("Hello");
	
	var scene = b5.Utils.findObjectFromPath("gamescene");
	scene.events.on("Hello", function(event)
	{
		console.log("Hello event was raised by scene");
		console.log(event);
	}, this);
	
	scene.events.dispatch("Hello");
	
}

function TestTasks()
{
	console.log("Tasks");
	var app = b5.app;
	var task = app.tasks.add("task1", 1, 3, function(task)
	{
		console.log("Task ran from app");
		console.log(task);
	}, this);
	
	var scene = b5.Utils.findObjectFromPath("gamescene");
	var task = scene.tasks.add("task2", 3, 3, function(task)
	{
		console.log("Task ran from scene");
		console.log(task);
	}, this).wait = 1;
}
