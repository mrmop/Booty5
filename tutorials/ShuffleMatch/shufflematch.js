function ShuffleMatch()
{
	var app = window.app;

	// Game states
	ShuffleMatch.GS_VIEWING = 0;
	ShuffleMatch.GS_GUESSING = 1;
	ShuffleMatch.GS_ROUND_OVER = 2;
	ShuffleMatch.GS_GAME_OVER = 3;
	ShuffleMatch.GS_MAIN_MENU = 4;

	// Properties
	this.max_guess_timer = 4.0;			// Maximum time allowed to guess
	this.max_lives = 10;				// Maximum lives allowed
	this.hard = false;					// Difficulty
	this.round = -1;					// Current round
	this.round_score = 0;				// Round score
	this.score = 0;						// Total score
	this.tiles_left = 1;				// Total tiles left to uncover
	this.lives_left = 2;				// Total number of lives left
	this.score_multiplier = 1;			// Used to multiply score when multiple tiles are found in same shuffle
	this.shuffles = 0;					// Total shufflers done
	this.run = 0;						// Total guesses of same number without error
	this.best_run = 0;					// Best total guesses of same number without error
	this.best_round_score = 0;			// Best round score
	this.round_potential_score = 0;		// Best potential score for round
	this.potential_score = 0;			// Best potential score overall

	// Game internal
	this.game_state = ShuffleMatch.GS_MAIN_MENU;	// Current game state
	this.allow_shuffle = true;						// Used to prevent shuffles during animation phase
	this.target_number = 0;							// Target number tht user is guessing at
	this.board = null;								// Tile board
	this.guess_timer = this.max_guess_timer;		// guess time

	// Parse scenes that make up the game because these scenes are not automatically loaded like the loading scene
	var xoml = new Xoml(app);
	xoml.parseResources(app, [window.viewarea]);
	xoml.parseResources(app, [window.guessarea]);
	xoml.parseResources(app, [window.gameover]);
	xoml.parseResources(app, [window.mainmenu]);

	// Make main menu the focus scene
	this.menuscene = window.app.findScene("mainmenu");
	app.focus_scene = this.menuscene;
	this.viewscene = window.app.findScene("viewarea");
	this.guessscene = window.app.findScene("guessarea");
}

ShuffleMatch.prototype.newGame = function()
{
	this.lives_left = this.max_lives;
	this.round = -1;
	this.score = 0;
	this.shuffles = 0;
	this.best_run = 1;
	this.round_score = 0;
	this.nextRound();
	if (this.hard)
		this.max_guess_timer = 2.0;
	else
		this.max_guess_timer = 4.0;

	// Show continue button in main menu
	this.menuscene.findActor("continue_button").visible = true;
	
	// Play music
	window.app.findResource("music", "sound").play();
};

ShuffleMatch.prototype.nextRound = function()
{
	this.round++;
	app.focus_scene = this.viewscene;
	// Generate board;
	var size = this.round + 3;
	if (size > 10) size = 10;
	if (this.board != null)
		this.board.destroy();
	this.board = new Board(size, size);
	this.round_potential_score = this.board.getPotentialScore();
	this.potential_score += this.round_potential_score;

	// Set up defaults
	this.state = ShuffleMatch.GS_VIEWING;
	this.tiles_left = size * size;
	this.score_multiplier = 1;
	this.allow_shuffle = true;
	this.guess_timer = this.max_guess_timer;
	this.round_score = 0;
	this.run = 0;

	// Choose number to guess
	this.chooseNumber();

	// Reset shuffle views
	this.viewscene.camera_x = 0;
	this.guessscene.camera_x = -768;

	// Update HUD
	this.updateHUD();
};

ShuffleMatch.prototype.gameOver = function()
{
	var gameover_scene = window.app.findScene("gameover");
	gameover_scene.timelines.add(new Timeline(gameover_scene, "y", [1024, 0], [0, 0.5], 1, [Ease.cubicout]));
	window.app.focus_scene = gameover_scene;

	this.state = ShuffleMatch.GS_GAME_OVER;

	// Hide continue button in main menu
	this.menuscene.findActor("continue_button").visible = false;

	this.updateGameOver();
};

ShuffleMatch.prototype.pauseGame = function()
{
};

ShuffleMatch.prototype.continueGame = function()
{
};

ShuffleMatch.prototype.chooseNumber = function()
{
	this.target_number = this.board.chooseRandomTile();
	var brush = window.app.findResource("d" + this.target_number, "brush");
	var chosen_value = this.viewscene.findActor("ChosenValue");
	chosen_value.atlas = brush;
	var remember_value = this.guessscene.findActor("RememberValue");
	remember_value.atlas = brush;
};

ShuffleMatch.prototype.correct = function(tile)
{
	this.guess_timer = this.max_guess_timer;

	// Update run / best run
	this.run++;
	if (this.run > this.best_run)
		this.best_run = this.run;

	// Increase score multiplier
	this.score_multiplier++;
	if (this.score_multiplier > 20)
		this.score_multiplier = 20;

	// Blank view tile and show guess tile
	var type = tile.type;
	tile.type = -1;
	tile.view_actor.atlas = window.app.findResource("empty", "brush");
	tile.guess_actor.atlas = window.app.findResource("d" + type, "brush");

	// If no tiles of this type left them shuffle
	if (this.board.countTilesOfType(type) == 0)
	{
		this.run = 0;
		this.shuffle();
	}

	// Create score floater
	var actor = new Actor();
	actor.x = tile.guess_actor.x;
	actor.y = tile.guess_actor.y;
	actor.vy = -500;
	actor.atlas = window.app.findResource("s" + this.score_multiplier * 10, "brush");
	actor.w = actor.atlas.frames[0].w;
	actor.h = actor.atlas.frames[0].h;
	actor.onTick = function(dt) {
		if (this.y < -384)
			this.destroy();
	};
	tile.guess_actor.scene.addActor(actor);

	// Increase score
	this.round_score += this.score_multiplier * 10;
	if (this.round_score > this.best_round_score)
		this.best_round_score = this.round_score;
	this.updateHUD();
	this.score += this.score_multiplier * 10;

	// Animate score indicator to show added score
	var score_icon = this.viewscene.findActor("score_icon");
	score_icon.scene.timelines.add(new Timeline(score_icon, "_scale", [1, 1.2, 1], [0, 0.25, 0.5], 1, [Ease.quadout, Ease.quadin]));

	// Reduce number of tiles left to find
	this.tiles_left--;
	if (this.tiles_left <= 0)
	{
		this.nextRound();
		window.app.findResource("win", "sound").play();
	}

	window.app.findResource("correct", "sound").play();
};

ShuffleMatch.prototype.incorrect = function(type)
{
	this.run = 0;

	// Reduce number lives left
	this.lives_left--;
	if (this.lives_left <= 0)
	{
		this.gameOver();
		window.app.findResource("lose", "sound").play();
	}
	this.updateHUD();

	// Animate life indicator to show life lost
	var lives_icon = this.viewscene.findActor("lives_icon");
	lives_icon.scene.timelines.add(new Timeline(lives_icon, "_scale", [1, 1.2, 1], [0, 0.25, 0.5], 1, [Ease.quadout, Ease.quadin]));

	// Do next shuffle
	this.shuffle();

	window.app.findResource("wrong", "sound").play();
};

ShuffleMatch.prototype.shuffle = function()
{
	this.score_multiplier = 1;
	this.allow_shuffle = false;
	this.guess_timer = this.max_guess_timer;
	if (this.state == ShuffleMatch.GS_VIEWING)
	{
		// Currently in viewing mode so shuffle to guessing mode
		this.state = ShuffleMatch.GS_GUESSING;
		var timeline = new Timeline(this.viewscene, "camera_y", [0, 1024], [0, 0.5], 1, [Ease.quadout]);
		this.viewscene.timelines.add(timeline);
		timeline.anims[0].onEnd = function() {window.shuffle_match.allow_shuffle = true;};
		this.guessscene.timelines.add(new Timeline(this.guessscene, "camera_y", [0, 1024], [0, 0.5], 1, [Ease.quadout]));
		app.focus_scene = this.guessscene;
		this.shuffles++;
	}
	else
	if (this.state == ShuffleMatch.GS_GUESSING)
	{
		// Currently in guessing mode so shuffle to viewing mode
		this.state = ShuffleMatch.GS_VIEWING;
		var timeline = new Timeline(this.viewscene, "camera_y", [1024, 0], [0, 0.5], 1, [Ease.quadout]);
		this.viewscene.timelines.add(timeline);
		timeline.anims[0].onEnd = function() {window.shuffle_match.allow_shuffle = true;};
		this.guessscene.timelines.add(new Timeline(this.guessscene, "camera_y", [1024, 0], [0, 0.5], 1, [Ease.quadout]));
		app.focus_scene = this.viewscene;
		this.chooseNumber();
	}
	window.app.findResource("swap", "sound").play();
};

ShuffleMatch.prototype.updateGuessArea = function(actor)
{
	if (this.state == ShuffleMatch.GS_GUESSING)
	{
		// If player runs out of time then they get an incorrect
		this.guess_timer -= window.app.dt;
		if (this.guess_timer <= 0)
		{
			this.guess_timer = 0;
			// if user didn't get a single tile then lose a life
			if (this.score_multiplier == 1)
				this.incorrect();
			else
				this.shuffle();
		}
		// Update timer bar actor
		var db = (685 * (this.max_guess_timer - this.guess_timer)) / this.max_guess_timer;
		if (db < 1) db = 1;
		actor.w = 685 - db;
		var frame = actor.atlas.frames[0];  // Note that e are changing the atlas frame directly
		frame.x = db >> 1;
		frame.w = 685 - db;
	}
};

ShuffleMatch.prototype.updateHUD = function()
{
	var app = window.app;

	// Update lives left
	var lives_actor = this.viewscene.findActor("lives");
	lives_actor.atlas = app.findResource("d" + this.lives_left, "brush");

	// Update score
	var div = 1000000;
	var acc = this.round_score;
	for (var t = 0; t < 7; t++)
	{
		var act = this.viewscene.findActor("sc" + (6 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}

	// Update round number
	var div = 1000;
	var acc = this.round + 1;
	for (var t = 0; t < 4; t++)
	{
		var act = this.viewscene.findActor("ro" + (3 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}
};

ShuffleMatch.prototype.updateGameOver = function()
{
	var app = window.app;
	var gameover = app.findScene("gameover");

	// Update score
	var div = 10000000;
	var acc = this.score;
	for (var t = 0; t < 8; t++)
	{
		var act = gameover.findActor("fs" + (7 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}

	// Update round number
	div = 10000;
	acc = this.best_round_score;
	for (var t = 0; t < 5; t++)
	{
		var act = gameover.findActor("brs" + (4 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}

	// Update best run
	div = 10;
	acc = this.best_run;
	for (var t = 0; t < 2; t++)
	{
		var act = gameover.findActor("br" + (1 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}

	// Update shuffles
	div = 10000;
	acc = this.shuffles;
	for (var t = 0; t < 5; t++)
	{
		var act = gameover.findActor("sh" + (4 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}

	// Update rating
	div = 10;
	acc = (this.score * 100) / this.potential_score;
	for (var t = 0; t < 2; t++)
	{
		var act = gameover.findActor("ra" + (1 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}

};

