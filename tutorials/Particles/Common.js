function CreateParticles(scene)
{
	var touch_pos = scene.app.touch_pos;
	var red = (Math.random() * 20 + 235) << 0;
	var green = (Math.random() * 20 + 235) << 0;
	var blue = (Math.random() * 20) << 0;
	var particles = new b5.ParticleActor();
	scene.addActor(particles);     // Add particle system actor to scene for processing
	particles.generateExplosion(50, b5.ArcActor, 2, 50, 10, 1, 0.999, {
		x: touch_pos.x, 
		y: touch_pos.y, 
		fill_style: "rgb(" + red + "," + green + "," + blue + ")",
		radius: 30
	});	
}