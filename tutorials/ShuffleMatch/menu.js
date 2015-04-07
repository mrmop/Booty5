function newGame()
{
	window.shuffle_match.hard = false;
	window.shuffle_match.newGame();
	// Scroll menu scene of fscreen
	var menu_scene = b5.app.findScene("mainmenu");
	menu_scene.timelines.add(new b5.Timeline(menu_scene, "y", [0, 1024], [0, 0.5], 1, [b5.Ease.cubicout]));
}

function newHardGame()
{
	window.shuffle_match.hard = true;
	window.shuffle_match.newGame();
	// Scroll menu scene off screen
	var menu_scene = b5.app.findScene("mainmenu");
	menu_scene.timelines.add(new b5.Timeline(menu_scene, "y", [0, 1024], [0, 0.5], 1, [b5.Ease.cubicout]));
}

function pauseGame()
{
	// Scroll menu scene onto screen
	window.shuffle_match.menuscene.timelines.add(new b5.Timeline(window.shuffle_match.menuscene, 'y', [1024, 0], [0, 0.5], 1, [b5.Ease.cubicout]));
	b5.app.focus_scene = window.shuffle_match.menuscene;
	window.shuffle_match.pauseGame();
}

function continueGame()
{
	// Scroll menu scene off screen
	window.shuffle_match.menuscene.timelines.add(new b5.Timeline(window.shuffle_match.menuscene, 'y', [0, 1024], [0, 0.5], 1, [b5.Ease.cubicout]));
	b5.app.focus_scene = window.shuffle_match.viewscene;
	window.shuffle_match.continueGame();
}

function continueFromGameOver(actor)
{
	// Scroll main menu in and game over scene out
	window.shuffle_match.menuscene.timelines.add(new b5.Timeline(window.shuffle_match.menuscene, 'y', [1024, 0], [0, 0.5], 1, [b5.Ease.cubicout]));
	actor.scene.timelines.add(new b5.Timeline(actor.scene, 'y', [0, 1024], [0, 0.5], 1, [b5.Ease.cubicout]));
	b5.app.focus_scene = window.shuffle_match.menuscene;
}

function togglemusic(actor)
{

}