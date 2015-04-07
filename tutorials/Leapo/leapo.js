var difficulty = 0;
var game_time_left = 60;
var game_in_progress = false;
var max_round_time = 70;
var max_rounds = 30;
var current_round = 1;
var lives_left = 9;
var jump_timer = 0;
var rounds_complete = [
[
	false, false, false, false, false, 
	false, false, false, false, false, 
	false, false, false, false, false, 
	false, false, false, false, false,
	false, false, false, false, false,
	false, false, false, false, false
],
[
	false, false, false, false, false, 
	false, false, false, false, false, 
	false, false, false, false, false, 
	false, false, false, false, false,
	false, false, false, false, false,
	false, false, false, false, false
]
];

function gameLoaded()
{
	b5.app.findResource('music', 'sound').play();
	b5.app.cocoonjs = typeof Cocoon != "undefined";
	initAds();
	loadAds();
	showAds();
}

function startGame()
{
	loadGame();
	updateLocks();
	console.log(rounds_complete[0]);
	console.log(rounds_complete[0][0]);
	console.log(rounds_complete[1]);
	console.log(rounds_complete[1][0]);
	var app = b5.app;
	app.focus_scene = app.findScene("levelselect");
	app.focus_scene.active = true;
	app.focus_scene.visible = true;
	var menu_scene = app.findScene("mainmenu");
	menu_scene.active = false;
	menu_scene.visible = false;
	var hud_scene = app.findScene("gamehud");
	hud_scene.active = false;
	hud_scene.visible = false;
	lives_left = 9;
	hud_scene.findActor("round_failed_dlg").x = -2100;
	hud_scene.findActor("round_completed_dlg").x = -2100;
	hud_scene.findActor("game_over_dlg").x = -2100;
}

function startLevel(level)
{
	loadAds();
	
	var app = b5.app;
	
	// Show hud
	showHud(true);
	
	// Remove old game scene if one present
	var game_scene = app.findScene("gamescene");
	if (game_scene !== null)
	{
		game_scene.destroy();
		app.cleanupDestroyedScenes();
	}

	// Load new scene
	new b5.Xoml(app).parseResources(app, [window["level" + level]]);
	app.order_changed = true;
	// Disable main menu
	var select_scene = app.findScene("levelselect");
	select_scene.active = false;
	select_scene.visible = false;
	game_time_left = max_round_time;
	game_in_progress = true;
	current_round = level;
	updateHud();
	app.findScene("gamescene").min_panning = 2*2 * 2; // Prevents small touch pan movements from stopping jump
}

function restartRound()
{
	startLevel(current_round);
}

function nextRound()
{
	if (isGameComplete())
	{
		var hud_scene = b5.app.findScene("gamehud");
		hud_scene.active = false;
		hud_scene.visible = false;
		var scene = b5.app.findScene("gamecomplete");
		scene.active = true;
		scene.visible = true;
		b5.app.focus_scene = scene;
		resetGame();
		return;
	}
	current_round++;
	if (current_round > max_rounds)
	{
		current_round = 1;
		if (difficulty < 1)
			difficulty++;
	}
	else
	{
		if (!isRoundUnlocked(current_round))
			current_round = getFirstIncompleteRound();
	}
	startLevel(current_round);
}

function updateTime(clock, dt)
{
	if (!game_in_progress)
		return;
	game_time_left -= dt;
	if (game_time_left <= 0)
	{
		lives_left--;
		roundOver(true, lives_left <= 0);
	}

	clock.text = (game_time_left << 0).toString();
//	clock.text = b5.app.avg_fps;
}

function updateSky(sky, dt)
{
	sky.y = -sky.scene.camera_y / 2 - 580;
}

function updatePlayer(player)
{
	if (player.hurt === true)
	{
		// Create explosion at player point
		var particles = new b5.ParticleActor();
		player.scene.addActor(particles);
		particles.generateExplosion(10, b5.Actor, 1, 200, 1, 10, 1, {
			atlas: player.scene.findResource("explosion", "brush"),
			w: 60,
			h: 60,
			x: player.x,
			y: player.y,
			vsx: 1.5,
			vsy: 1.5,
		});

		player.setPositionPhysics(-1715, 69);
		player.vx = 0;
		player.vy = 0;
		player.vr = 0;
		player.updateToPhysics();
		b5.app.findResource('explosion', 'sound').play();
		player.hurt = false;
		lives_left--;
		if (lives_left <= 0)
			roundOver(true, true);
		updateHud();
		animateLives();
	}
	
	if (player.extra_life === true)
	{
		// Create explosion at player point
		var particles = new b5.ParticleActor();
		player.scene.addActor(particles);
		particles.generateExplosion(10, b5.Actor, 1, 200, 1, 10, 1, {
			atlas: player.scene.findResource("explosion", "frog_eye"),
			w: 60,
			h: 60,
			x: player.x,
			y: player.y,
			vsx: 1.5,
			vsy: 1.5,
		});

		b5.app.findResource('extra', 'sound').play();
		player.extra_life = false;
		lives_left++;
		updateHud();
		animateLives();
	}	
}

function sceneTapped(scene, touch_pos)
{
	if (!game_in_progress)
		return;
		
	if (b5.app.findScene("gamehud").findActor("settings").hitTest(touch_pos) != null)
		return;
	
	if (scene.panning)
		return;
	var player1 = scene.findActor("player1");
	if (player1.allow_jump != 0 || (Date.now() - jump_timer) > 3000)
	{
		var scene_x = touch_pos.x + scene.camera_x;
		var scene_y = touch_pos.y + scene.camera_y;
		
		// Calculate and set jump velocity
		var dx = scene_x - player1.x;
		var dy = scene_y - player1.y;
		var d = Math.sqrt(dx * dx + dy * dy);
		if (d > 0)
		{
			var d2 = d > 900 ? 900 : d;
			dx = (dx * d2) / d;
			dy = (dy * d2) / d;
			var b2Vec2 = Box2D.Common.Math.b2Vec2;
			player1.body.SetLinearVelocity(new b2Vec2(dx / 8, dy / 8));
			player1.body.SetAwake(true);
			player1.allow_jump = 0;
			
			// Animate head
			var head = player1.findActor("frog_head");
			scene.timelines.add(new b5.Timeline(head, "_scale", [1, 1.5, 1], [0, 0.5, 1], 1, [b5.Ease.quartin, b5.Ease.quartout]));
			
			// Create sparkle at tap point
			var particles = new b5.ParticleActor();
			scene.addActor(particles);
			particles.generateExplosion(10, b5.Actor, 1, 200, 1, 10, 1, {
				atlas: scene.findResource("ring", "brush"),
				w: 60,
				h: 60,
				x: scene_x,
				y: scene_y,
				vsx: 1.5,
				vsy: 1.5,
			});
			
			// Update hud
			updateHud();
			
			// Play show sound effect
			b5.app.findResource('shot', 'sound').play();
			
			// Sometimes colliion does not fire for very small movements so we need to set a max time before allow jump is reset
			jump_timer = Date.now();
		}
	}
	else
	{
	}
}

function roundOver(failed, game_over)
{
	game_in_progress = false;

	if (game_over)
		showDialog("game_over_dlg", true);
	else
	{
		if (failed)
			showDialog("round_failed_dlg", true);
		else
		{
			rounds_complete[difficulty][current_round - 1] = true;
			saveGame();
			updateLocks();
			showDialog("round_completed_dlg", true);
		}
	}
		
	if (!failed)
	{
		// Create anim that sends player to wife
		var scene = b5.app.findScene("gamescene");
		var player1 = scene.findActor("player1");
		var wife = scene.findActor("wife");
		player1.releaseBody();
		scene.timelines.add(new b5.Timeline(player1, "_x", [player1.x, wife.x - 80], [0, 2], 1, [b5.Ease.quartout]));
		scene.timelines.add(new b5.Timeline(player1, "_y", [player1.y, wife.y], [0, 2], 1, [b5.Ease.quartout]));
	}
	showAds();
}

function playerCollided(player, contact)
{
	if (!game_in_progress)
		return;
	
	var scene = player.scene;
	var bodyA = contact.m_fixtureA.m_body;
	var bodyB = contact.m_fixtureB.m_body;
	var actorA = bodyA.m_userData;
	var actorB = bodyB.m_userData;
	var a = actorA.otype === "heart";
	var b = actorB.otype === "heart";
	if (a || b)
	{
		var particles = new b5.ParticleActor();
		scene.addActor(particles);
		for (var t = 0; t < 5; t++)
		{
			var particle = new b5.Actor();
			particle.atlas = scene.findResource("lives", "brush");
			particle.w = 80;
			particle.h = 72;
			particle.vy = -200;
			particle.vo = -2;
			particle.vsx = -2;
			particle.vsy = -2;
			particles.addParticle(particle, 1, 1, t * 0.1);
		}
		if (a)
		{
			particles.x = actorA.x;
			particles.y = actorA.y;
			actorA.destroy();
		}
		else
		{
			particles.x = actorB.x;
			particles.y = actorB.y;
			actorB.destroy();
		}

		scene.num_hearts--;
		if (scene.num_hearts <= 0)
			roundOver(false);
		b5.app.findResource('health', 'sound').play();
	}
	else
	{
		var a = actorA.otype === "hurt";
		var b = actorB.otype === "hurt";
		if (a || b)
		{
			if (!a)
			{
				actorA.hurt = true;
				if (difficulty == 0)
					actorB.destroy();
			}
			else
			{
				actorB.hurt = true;
				if (difficulty == 0)
					actorA.destroy();
			}
		}
		else
		{
			var a = actorA.otype === "life";
			var b = actorB.otype === "life";
			if (a || b)
			{
				if (!a)
				{
					actorA.extra_life = true;
					actorB.destroy();
				}
				else
				{
					actorB.extra_life = true;
					actorA.destroy();
				}
			}
		}
	}
	b5.app.findResource('hit', 'sound').play();
	player.allow_jump = 1;
}

function isGameComplete()
{
	for (var t = 0; t < rounds_complete[difficulty].length; t++)
	{
		if (!rounds_complete[difficulty][t])
			return false;
	}
	return true;
}

function resetGame()
{
	for (var t = 0; t < rounds_complete[0].length; t++)
		rounds_complete[0][t] = false;
	saveGame();
}

function isLocalStorageSupported()
{
	try
	{
		return 'localStorage' in window && window['localStorage'] !== null;
	}
	catch (e)
	{
		return false;
	}
}
	
function saveGame()
{
	try
	{
		if (isLocalStorageSupported())
		{
			var rounds = "";
			for (var t = 0; t < rounds_complete[0].length; t++)
			{
				if (rounds_complete[0][t])
					rounds += "1";
				else
					rounds += "0";
			}
			localStorage.setItem("rounds_complete", rounds);
			rounds = "";
			for (var t = 0; t < rounds_complete[1].length; t++)
			{
				if (rounds_complete[1][t])
					rounds += "1";
				else
					rounds += "0";
			}
			localStorage.setItem("rounds_complete_hard", rounds);
		}
	}
	catch (err) {}
}

function loadGame()
{
	try
	{
		if (isLocalStorageSupported())
		{
			var rc = localStorage.getItem("rounds_complete");
			if (rc !== null)
			{
				for (var t = 0; t < rounds_complete[0].length; t++)
					rounds_complete[0][t] = rc[t] == 1 ? true : false;
			}
			rc = localStorage.getItem("rounds_complete_hard");
			if (rc !== null)
			{
				for (var t = 0; t < rounds_complete[1].length; t++)
					rounds_complete[1][t] = rc[t] == 1 ? true : false;
			}
		}
	}
	catch (err) {}
}

function initAds()
{
	if (b5.app.cocoonjs)
	{
		Cocoon.Ad.interstitial.on("ready", function(){
			console.log("**** Ad ready");
		});
		Cocoon.Ad.interstitial.on("shown", function(){
			console.log("**** Ad shown");
		});
		Cocoon.Ad.interstitial.on("hidden", function(){
			console.log("**** Ad hidden");
		});
	}
}

function loadAds()
{
	if (b5.app.cocoonjs)
	{
console.log("**** Loading ad");
		Cocoon.Ad.loadInterstitial();
	}
}

function showAds()
{
	if (b5.app.cocoonjs)
	{
console.log("**** Showing ad");
		Cocoon.Ad.showInterstitial();
	}
}