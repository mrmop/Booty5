function loadScene()
{
	// Load scene1 JSON file
	Xoml.loadJSON("http://booty5.com/html5-examples/load-scene/scene1.js", true, function(json) {
		var app = b5.app;
		// Execute the loaded json
		eval(json);
		// Parse the scene
		var xoml = new b5.Xoml(app);
		xoml.parseResources(app, [window.scene1]);
		// Set the loaded scene asthe focus scene
		app.focus_scene = app.findScene("scene1");
	});
	
}