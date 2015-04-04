var key_up = 0;
var key_down = 1;
var key_left = 2;
var key_right = 3;
var key_states = [0,0,0,0];
var on_ground = false;

function keyDown(e)
{
	if (e.keyCode == 38)
		key_states[key_up] = 1;
	if (e.keyCode == 40)
		key_states[key_down] = 1;
	if (e.keyCode == 37)
		key_states[key_left] = 1;
	if (e.keyCode == 39)
		key_states[key_right] = 1;
}

function keyUp(e)
{
	if (e.keyCode == 38)
		key_states[key_up] = 0;
	if (e.keyCode == 40)
		key_states[key_down] = 0;
	if (e.keyCode == 37)
		key_states[key_left] = 0;
	if (e.keyCode == 39)
		key_states[key_right] = 0;
}

function updatePlayer(player, dt)
{
	// Player key movement
	if (key_states[key_left] === 1)
	{
		player.vx -= 50;
		if (player.vx < -400) player.vx = -400;
	}
	else if (key_states[key_right] === 1)
	{
		player.vx += 50;
		if (player.vx > 400) player.vx = 400;
	}
/*	if (key_states[key_up] === 1)
	{
		player.vy -= 5;
		if (player.vy < -1000) player.vy = -1000;
	}
	else if (key_states[key_down] === 1)
	{
		player.vy += 5;
		if (player.vy > 1000) player.vy = 1000;
	}*/
	if (on_ground && key_states[key_up] === 1)
	{
		player.vy = -500;
		on_ground = false;
	}
	
	// Apply friction
	player.vx *= 0.97;
//	player.vy *= 0.99;
		
	// Apply gravity
	player.vy += 10;
	
	// Perform simple collision
	var map = b5.Utils.resolveObject("gamescene.map1");
	var tilew = map.tile_width / 2;
	var tileh = map.tile_height / 2;
	var vx = player.vx * dt;
	var vy = player.vy * dt;
	if (vx > 0)
	{
		var px = player.x + player.w / 2 + vx;
		var py = player.y + player.h / 2 - 1;
		var tile = map.getTileFromPosition(px, py, true);
		if (tile === 0)
		{
			py -= tileh;
			tile = map.getTileFromPosition(px, py, true);
		}
		if (tile === 1)
		{
			var tilexy = map.getTileXY(px, py);
			player._x = map.getTilePosition(px, py, "l").x - player.w / 2;
			player.vx = 0;
		}
	}
	else if (vx < 0)
	{
		var px = player.x - player.w / 2 + vx;
		var py = player.y + player.h / 2 - 1;
		var tile = map.getTileFromPosition(px, py, true);
		if (tile === 0)
		{
			py -= tileh;
			tile = map.getTileFromPosition(px, py, true);
		}
		if (tile === 1)
		{
			var tilexy = map.getTileXY(px, py);
			player._x = map.getTilePosition(px, py, "r").x + player.w / 2;
			player.vx = 0;
		}
	}
	if (vy > 0)
	{
		var px = player.x + tilew / 2;
		var py = player.y + player.h / 2 + vy;
		var tile = map.getTileFromPosition(px, py, true);
		if (tile === 0)
		{
			px -= tilew;
			tile = map.getTileFromPosition(px, py, true);
		}
		if (tile === 1)
		{
			var tilexy = map.getTileXY(px, py);
			player._y = map.getTilePosition(px, py, "t").y - player.h / 2;
			player.vy = 0;
			on_ground = true;
		}
	}
	else if (vy < 0)
	{
		var px = player.x + tilew / 2;
		var py = player.y - player.h / 2 + vy;
		var tile = map.getTileFromPosition(px, py, true);
		if (tile === 0)
		{
			px -= tilew;
			tile = map.getTileFromPosition(px, py, true);
		}
		if (tile === 1)
		{
			var tilexy = map.getTileXY(px, py);
			player._y = map.getTilePosition(px, py, "b").y + player.h / 2;
			player.vy = 0;
		}
	}
}

