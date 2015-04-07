var num_planets = 80;

var colours = [
	"#ff0000", 
	"#ffff00", 
	"#ff00ff", 
	"#00ff00", 
	"#0000ff", 
];
var height_range = 1000;
var orbit_range = 900;

function createPlanets(scene)
{
	var colour = 0;
	var angle = 0;
	for (var t = 0; t < num_planets; t++)
	{
		var planet = new b5.ArcActor();
		planet.name = "planet" + t;
		planet.radius = 100;
		planet.fill_style = colours[colour];
		planet.angle = angle;
		planet.orbit = Math.random() * orbit_range + 50;
		planet.y = Math.random() * height_range - height_range / 2;
		scene.addActor(planet);
		
		colour++;
		if (colour >= colours.length) colour = 0;
	}
}

function updatePlanets(scene)
{
	var speed = 0.005;
	for (var t = 0; t < num_planets; t++)
	{
		var planet = scene.findActor("planet" + t);
		planet.angle += speed;
		planet.x = Math.cos(planet.angle) * planet.orbit;
		planet.depth =  3 -Math.sin(planet.angle) * planet.orbit / 500;
		planet._layer = -planet.depth;
		speed += 0.001;
	}
}