function sceneTapped(scene, touch_pos)
{
	// Calculate touch position
	var floor = scene.findActor("floor");
	var scene_x = touch_pos.x + scene.camera_x;
	var scene_y = touch_pos.y + scene.camera_y;
	
	// Set mouse joint target position
	var b2Vec2 = Box2D.Common.Math.b2Vec2;
	floor.joints[0].SetTarget(new b2Vec2(scene_x / scene.world_scale, scene_y / scene.world_scale));
	
}