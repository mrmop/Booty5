function updateHud()
{
	var app = window.app;
	var hud_scene = app.findScene("gamehud");
	var hud_actor = hud_scene.findActor("hud");
	var game_scene = app.findScene("gamescene");
	var lives = hud_actor.findActor("lives_left");
	lives.text = lives_left.toString();
	var round = hud_actor.findActor("round");
	round.text = current_round.toString();
}

function animateLives()
{
	var hud_scene = app.findScene("gamehud");
	var hud_actor = hud_scene.findActor("hud");
	var lives = hud_actor.findActor("lives_icon");
	hud_scene.timelines.add(new Timeline(lives, "_scale", [1, 1.5, 1], [0, 0.5, 1], 1, [Ease.quartin, Ease.quartout]));
}

function showDialog(dlg_name, show)
{
	var app = window.app;
	var hud_scene = app.findScene("gamehud");
	var dlg = hud_scene.findActor(dlg_name);
	var game_scene = app.findScene("gamescene");
	
	var timeline = new Timeline();
	if (show)
	{
		app.focus_scene = hud_scene;
		timeline.add(dlg, "rotation", [10, 0], [0, 2], 1, [Ease.sin]);
		timeline.add(dlg, "x", [-2000, 0], [0, 2], 1, [Ease.sin]);
		hud_scene.timelines.add(timeline);
	}
	else
	{
		app.focus_scene = game_scene;
		timeline.add(dlg, "rotation", [0, 10], [0, 2], 1, [Ease.sin]);
		timeline.add(dlg, "x", [0, -2000], [0, 2], 1, [Ease.sin]);
		hud_scene.timelines.add(timeline);
	}
}

function showHud(show)
{
	var hud_scene = app.findScene("gamehud");
	if (hud_scene.visible)
		return;
	hud_scene.visible = show;
	hud_scene.active = show;
	if (show)
	{
		var hud = hud_scene.findActor("hud");
		hud_scene.timelines.add(new Timeline(hud, "y", [-420, -420 + 80], [0, 1], 1, [Ease.quartin]));
	}
}

function pauseGame()
{
	var app = window.app;
	var game_scene = app.findScene("gamescene");
	game_scene.active = false;
	game_scene.visible = false;
	var menu_scene = app.findScene("mainmenu");
	menu_scene.active = true;
	menu_scene.visible = true;
	menu_scene.findActor("resume_button").visible = true;
	var hud_scene = app.findScene("gamehud");
	hud_scene.active = false;
	hud_scene.visible = false;
	window.app.focus_scene = menu_scene;
}

function resumeGame()
{
	var game_scene = app.findScene("gamescene");
	game_scene.active = true;
	game_scene.visible = true;
	var menu_scene = app.findScene("mainmenu");
	menu_scene.active = false;
	menu_scene.visible = false;
	var hud_scene = app.findScene("gamehud");
	hud_scene.active = true;
	hud_scene.visible = true;
	window.app.focus_scene = game_scene;
}

function goBackToMainMenu()
{
	var app = window.app;
	var game_scene = app.findScene("gamescene");
	game_scene.active = false;
	game_scene.visible = false;
	var menu_scene = app.findScene("mainmenu");
	menu_scene.active = true;
	menu_scene.visible = true;
	menu_scene.findActor("resume_button").visible = false;
	var hud_scene = app.findScene("gamehud");
	hud_scene.active = false;
	hud_scene.visible = false;
	window.app.focus_scene = menu_scene;
}

function updateLocks()
{
	var app = window.app;
	var level_scene = app.findScene("levelselect");
	var locks = [0,0,0,0];
	
	// Determine which rounds are locked / unlocked
	for (var t = 0; t < max_rounds; t++)
	{
		var index = (t / 5) << 0;
		if (rounds_complete[t])
			locks[index]++;
	}
	
	// Update level icons in level select screen
	for (var t = 6; t < max_rounds + 1; t++)
	{
		var ac = level_scene.findActor("level" + t);
		var locked = locks[((t - 6) / 5) << 0] != 5;
//locked = false;		
		if (locked)
			ac.opacity = 0.5;
		else
			ac.opacity = 1.0;
		ac.touchable = !locked;
	}
}

function isRoundUnlocked(round)
{
	var locks = [0,0,0,0];
	
	// Determine which rounds are locked / unlocked
	for (var t = 0; t < max_rounds; t++)
	{
		var index = (t / 5) << 0;
		if (rounds_complete[t])
			locks[index]++;
	}
	return locks[((round - 6) / 5) << 0] == 5;
}

function getFirstIncompleteRound()
{
	for (var t = 0; t < max_rounds; t++)
	{
		if (!rounds_complete[t])
			return t + 1;
	}
	return 0;
}

