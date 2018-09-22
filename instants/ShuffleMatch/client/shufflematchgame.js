function ShuffleMatch()
{
	var app = b5.app;

	// Game states
	ShuffleMatch.GS_VIEWING = 0;
	ShuffleMatch.GS_GUESSING = 1;
	ShuffleMatch.GS_ROUND_OVER = 2;
	ShuffleMatch.GS_GAME_OVER = 3;
	ShuffleMatch.GS_MAIN_MENU = 4;

	// Properties
	this.max_guess_timer = 4.0;			// Maximum time allowed to guess
	this.max_lives = 3;					// Maximum lives allowed
	this.hard = false;					// Difficulty
	this.round = 0;					// Current round
	this.pre_score = 0;					// Previous score before the round started.
	this.score = 0;						// Total score
	this.best_score = 0;				// Best score
	this.tiles_left = 1;				// Total tiles left to uncover
	this.lives_left = 2;				// Total number of lives left
	this.score_multiplier = 1;			// Used to multiply score when multiple tiles are found in same shuffle
	this.shuffles = 0;					// Total shufflers done
	this.coins = 0;
	this.fct = 0;
	this.muted = false;
	this.current_leaderboard = "global";
	this.products_retrieved = false;

	// Game internal
	this.game_state = ShuffleMatch.GS_MAIN_MENU;	// Current game state
	this.allow_shuffle = true;						// Used to prevent shuffles during animation phase
	this.target_number = 0;							// Target number tht user is guessing at
	this.board = null;								// Tile board
	this.guess_timer = this.max_guess_timer;		// guess time

	// Parse scenes that make up the game because these scenes are not automatically loaded like the loading scene
	var xoml = new b5.Xoml(app);
	xoml.parseResources(app, [b5.data.viewarea]);
	xoml.parseResources(app, [b5.data.guessarea]);
	xoml.parseResources(app, [b5.data.gameover]);
	xoml.parseResources(app, [b5.data.leaderboard]);
	
	// Make main menu the focus scene
	this.menuscene = b5.app.findScene("mainmenu");
	b5.app.focus_scene = this.menuscene;
	this.viewscene = b5.app.findScene("viewarea");
	this.guessscene = b5.app.findScene("guessarea");
	this.gameoverscene = b5.app.findScene("gameover");
	this.leaderboardscene = b5.app.findScene("leaderboard");

	// Instants
	this.LeaderboardName = "Best Shufflers";
	this.Instants = new b5.Instants();
	this.ChallengerName = "";
	this.RewardedShare = false;

	this.Instants.Init();
    this.PreloadAds(true);
    this.PreloadAds(false);
    this.Instants.CreateScreenshotCache(800);
    this.Challenger = this.Instants.GetEntryPointData();
    if (this.Challenger != null)
    {
        this.SetChallenged();
    }

    this.LoadGame(function()
    {
		b5.Sound.muted = this.muted;
		if (!this.muted)
		{
			b5.app.findResource("music", "sound").load();
		}
		this.UpdateMusicUI();
		var now = Date.now();
		if (this.fct === 0)
		{
			this.fct = now - (24 * 1000 * 60 * 60);
			b5.Utils.findObjectFromPath("mainmenu.instructions").playTimeline("show");
		}
		var dt = (now - this.fct) / (1000 * 60 * 60);
		if (dt >= 16)	// 16 hours between gifts
		{
			this.fct = now;
			b5.Utils.findObjectFromPath("mainmenu.dialy_reward").playTimeline("show");
		}
	}.bind(this));
	this.GetPlayerRank();
	this.GetLeaderboard();

	var that = this;
	this.Instants.CreateShortcut(function(success){
		that.Instants.LogEvent("Shortcut Created " + success, 1);
	});

}

ShuffleMatch.prototype.UpdateMusicUI = function()
{
	var audio_button = b5.Utils.findObjectFromPath("viewarea.audio");
	if (b5.Sound.muted)
	{
		audio_button._atlas = "audio_off";
	}
	else
	{
		audio_button._atlas = "audio_on";
	}
}

ShuffleMatch.prototype.newGame = function()
{
	this.round--;
	this.lives_left = this.max_lives;
	this.score = this.pre_score;
	this.shuffles = 0;
	this.round_score = 0;
	this.nextRound();
	if (this.hard)
		this.max_guess_timer = 2.0;
	else
		this.max_guess_timer = 4.0;

	this.viewscene.camera_x = 0;
	this.viewscene.camera_y = 0;
};

ShuffleMatch.prototype.resetGame = function()
{
	this.lives_left = this.max_lives;
	this.round = -1;
	this.score = 0;
	this.shuffles = 0;
	this.round_score = 0;
	this.nextRound();
	if (this.hard)
		this.max_guess_timer = 2.0;
	else
		this.max_guess_timer = 4.0;

	this.viewscene.camera_x = 0;
	this.viewscene.camera_y = 0;
};

ShuffleMatch.prototype.nextRound = function()
{
	this.pre_score = this.score;
	this.round++;
	b5.app.focus_scene = this.viewscene;
	// Generate board;
	var size = ((this.round / 4) | 0) + 3;
	if (size > 10) size = 10;
	if (this.board != null)
		this.board.destroy();
	this.board = new Board(size, size);

	// Set up defaults
	this.state = ShuffleMatch.GS_VIEWING;
	this.tiles_left = size * size;
	this.score_multiplier = 1;
	this.allow_shuffle = true;
	this.guess_timer = this.max_guess_timer;
	this.round_score = 0;

	// Choose number to guess
	this.chooseNumber();

	// Reset shuffle views
	//this.viewscene.camera_x = 0;
	//this.guessscene.camera_x = -768;

	// Update HUD
	this.updateHUD();
};

ShuffleMatch.prototype.gameOver = function()
{
	this.gameoverscene.playTimeline("show");
	b5.app.focus_scene = this.gameoverscene;
	b5.Utils.findObjectFromPath("gameover.ad1").playTimeline("show");
	b5.Utils.findObjectFromPath("gameover.ad2").playTimeline("show");
	
	this.state = ShuffleMatch.GS_GAME_OVER;

	if (this.score > this.best_score)
		this.best_score = this.score;
	this.Instants.SetLeaderboardScore(this.LeaderboardName, this.best_score, null);

	this.updateGameOver();

    this.SaveGame();
	var data = { score: this.best_score, id: this.Instants.GetPlayerID() };
	var that = this;
    b5.Utils.RunafterTime(0.5, function()
    {
        if (that.Challenger !== null)
        {
            if (that.best_score > that.Challenger.myReplayData.score)
            {
                that.Instants.PostCustomUpdate("Play", that.Instants.GetScreenshot(), that.Instants.GetPlayerName() + " beat " + that.ChallengerName + " with a best score of " + that.best_score + "!", "match_won", "LAST", data);
            }
            else
            if (that.best_score == that.Challenger.myReplayData.score)
            {
                that.Instants.PostCustomUpdate("Play", that.Instants.GetScreenshot(), that.Instants.GetPlayerName() + " drew with " + that.ChallengerName + " with a best score of " + that.best_score + "!", "match_tie", "LAST", data);
            }
            else
            {
                that.Instants.PostCustomUpdate("Play", that.Instants.GetScreenshot(), that.ChallengerName + " beat " + that.Instants.GetPlayerName() + " with a best score of " + that.best_score + "!", "match_lost", "LAST", data);
            }
        }
        else
        {
            that.Instants.PostCustomUpdate("Play", that.Instants.GetScreenshot(), that.Instants.GetPlayerName() + " got a best score of " + that.best_score + ". Can you beat it?", "match_won", "LAST", data);
        }
    });
	
};

ShuffleMatch.prototype.pauseGame = function()
{
	this.state = ShuffleMatch.GS_GAME_OVER;
};

ShuffleMatch.prototype.continueGame = function()
{
	this.state = ShuffleMatch.GS_VIEWING;
	this.viewscene.playTimeline("camin")
	this.guessscene.playTimeline("camin")
	b5.app.focus_scene = this.viewscene;
	this.chooseNumber();
	this.updateHUD();
};

ShuffleMatch.prototype.chooseNumber = function()
{
	this.target_number = this.board.chooseRandomTile();
	var brush = b5.app.findResource("d" + this.target_number, "brush");
	var chosen_value = b5.Utils.findObjectFromPath("viewarea.remember.value");
	chosen_value.atlas = brush;
	var remember_value = b5.Utils.findObjectFromPath("guessarea.find.value");
	remember_value.atlas = brush;
};

ShuffleMatch.prototype.correct = function(tile)
{
	this.guess_timer = this.max_guess_timer;

	// Increase score multiplier
	this.score_multiplier++;
	if (this.score_multiplier > 20)
		this.score_multiplier = 20;

	// Blank view tile and show guess tile
	var type = tile.type;
	tile.type = -1;
	tile.view_actor.atlas = b5.app.findResource("empty", "brush");
	tile.guess_actor.atlas = b5.app.findResource("d" + type, "brush");

	// If no tiles of this type left them shuffle
	if (this.board.countTilesOfType(type) == 0)
	{
		this.shuffle();
	}

	// Create score floater
	var actor = new b5.Actor();
	actor.x = tile.guess_actor.x;
	actor.y = tile.guess_actor.y;
	actor.vy = -200;
	actor.atlas = b5.app.findResource("s" + this.score_multiplier * 10, "brush");
	actor.w = actor.atlas.frames[0].w;
	actor.h = actor.atlas.frames[0].h;
	actor.onTick = function(dt) {
		if (this.y < -384)
			this.destroy();
	};
	tile.guess_actor.scene.addActor(actor);

	// Increase score
	this.score += this.score_multiplier * 10;
	this.updateHUD();

	// Animate score indicator to show added score
//	var score_icon = this.viewscene.findActor("score_icon");
//	score_icon.playTimeline("pulse");

	// Reduce number of tiles left to find
	this.tiles_left--;
	if (this.tiles_left <= 0)
	{
		this.nextRound();
		this.SaveGame();
		b5.app.findResource("win", "sound").play();
		b5.Utils.RunafterTime(0.5, function()
		{
			b5.Utils.findObjectFromPath("viewarea.you_won").playTimeline("show", true);
		});
	}

	b5.app.findResource("correct", "sound").play();
};

ShuffleMatch.prototype.incorrect = function(type)
{
	// Animate life indicator to show life lost
	this.viewscene.findActor("lives_icon").playTimeline("pulse");

	// Do next shuffle
	this.shuffle();

	// Reduce number lives left
	this.lives_left--;
	if (this.lives_left <= 0)
	{
		this.gameOver();
		b5.app.findResource("lose", "sound").play();
	}
	this.updateHUD();

	b5.app.findResource("wrong", "sound").play();
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
		this.viewscene.playTimeline("camout")
		this.guessscene.playTimeline("camout")
		b5.app.focus_scene = this.guessscene;
		this.shuffles++;
	}
	else
	if (this.state == ShuffleMatch.GS_GUESSING)
	{
		// Currently in guessing mode so shuffle to viewing mode
		this.state = ShuffleMatch.GS_VIEWING;
		this.viewscene.playTimeline("camin")
		this.guessscene.playTimeline("camin")
		b5.app.focus_scene = this.viewscene;
		this.chooseNumber();
	}
	b5.app.findResource("swap", "sound").play();
};

ShuffleMatch.prototype.updateGuessArea = function(actor)
{
	if (this.state == ShuffleMatch.GS_GUESSING)
	{
		// If player runs out of time then they get an incorrect
		this.guess_timer -= b5.app.dt;
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
		var db = (683 * (this.max_guess_timer - this.guess_timer)) / this.max_guess_timer;
		if (db < 1) db = 1;
		actor.w = 683 - db;
		var frame = actor.atlas.frames[0];  // Note that we are changing the atlas frame directly
		frame.x = 1233 + (db >> 1);
		frame.w = 683 - db;
	}
};

ShuffleMatch.prototype.updateHUD = function()
{
	var app = b5.app;

	// Update lives left
	var lives_actor = this.viewscene.findActor("lives");
	lives_actor.atlas = app.findResource("d" + this.lives_left, "brush");

	// Update score
	var div = 1000000;
	var acc = this.score;
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

	// Update coins
	var div = 1000;
	var acc = this.coins;
	for (var t = 0; t < 4; t++)
	{
		var act = this.viewscene.findActor("coin" + (3 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}
};

ShuffleMatch.prototype.updateGameOver = function()
{
	var app = b5.app;
	var gameover = this.gameoverscene;

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

	// Update best score
	div = 10000000;
	acc = this.best_score;
	for (var t = 0; t < 8; t++)
	{
		var act = gameover.findActor("brs" + (7 - t));
		act.atlas = app.findResource("d" + ((acc / div) << 0), "brush");
		acc %= div;
		div /= 10;
	}
};

ShuffleMatch.prototype.SaveGame = function()
{
    var data = {
		round: this.round,
		pre_score: this.pre_score,
		best_score: this.best_score,
		muted: this.muted,
		coins: this.coins,
		fct: this.fct
    };
    this.Instants.SetPlayerData(data);
}

ShuffleMatch.prototype.LoadGame = function(done_callback)
{
	//return; // REMOVE:
	var that = this;
    this.Instants.GetPlayerData(["round", "pre_score", "best_score", "muted", "coins", "fct"], function(data)
    {
        if (data !== undefined)
        {
            if (data["round"] !== undefined)
                that.round = data["round"];
            if (data["pre_score"] !== undefined)
                that.pre_score = data["pre_score"];
            if (data["best_score"] !== undefined)
                that.best_score = data["best_score"];
            if (data["muted"] !== undefined)
                that.muted = data["muted"];
            if (data["coins"] !== undefined)
                that.coins = data["coins"];
            if (data["fct"] !== undefined)
                that.fct = data["fct"];
		}
        if (done_callback !== undefined)
            done_callback();
    });
}

ShuffleMatch.prototype.PreloadAds = function(video)
{
	var retries = 5;
	if (video)
	{
		this.Instants.PreloadVideoAd(function(success)
		{
			var ReloadAds = function()
			{
				retries--;
				if (retries > 0)
				{
					this.Instants.ReloadVideoAd(function(success)
					{
						if (!success)
							b5.Utils.RunafterTime(5, ReloadAds);
					});
				}
			}
			if (!success)
			{
				b5.Utils.RunafterTime(5, ReloadAds);
			}
		}, "<YOUR REWARDED AD ID>");
	}
	else
	{
		this.Instants.PreloadInterstitialAd(function(success)
		{
			var ReloadAds = function()
			{
				retries--;
				if (retries > 0)
				{
					this.Instants.ReloadInterstitialAd(function(success)
					{
						if (!success)
							b5.Utils.RunafterTime(3, ReloadAds);
					});
				}
			}
			if (!success)
			{
				b5.Utils.RunafterTime(3, ReloadAds);
			}
		}, "<YOUR INTERSTITIAL AD ID>");
	}
}

ShuffleMatch.prototype.ShowVideoAd = function()
{
	if (!this.Instants.videoAdsSupported)
	{
		b5.Utils.findObjectFromPath("gameover.noads_dlg").playTimeline("show");
		return;
	}

	var that = this;
    this.Instants.ShowVideoAd(function(success)
    {
		if (success)
		{
			that.lives_left += 2;
			that.gameoverscene.playTimeline("hide");
			that.continueGame();
			that.PreloadAds(true);
		}
		else
		{
			that.ShowAdsError(true);
		}
	});
}

ShuffleMatch.prototype.ShowVideoAdShop = function(from_game_over)
{
	if (!this.Instants.videoAdsSupported)
	{
		if (from_game_over)
			b5.Utils.findObjectFromPath("gameover.noads_dlg").playTimeline("show");
		else
			b5.Utils.findObjectFromPath("mainmenu.noads_dlg").playTimeline("show");
		return;
	}

	var that = this;
    this.Instants.ShowVideoAd(function(success)
    {
		if (success)
		{
			that.coins += 2;
			that.updateHUD();
			that.SaveGame();
			that.PreloadAds(true);
			UpdateShopCoins();
		}
		else
		{
			//that.ShowAdsError(true);
		}
	});
}

ShuffleMatch.prototype.ShowInterstitialAd = function(done_callback)
{
	if (!this.Instants.interstitialAdsSupported)
	{
		if (done_callback !== undefined)
			done_callback(false);
		return;
	}

	var that = this;
    this.Instants.ShowInterstitialAd(function(success)
    {
		if (success)
		{
			that.PreloadAds(false);
			if (done_callback !== undefined)
				done_callback(true);
		}
		else
		{
			if (done_callback !== undefined)
				done_callback(false);
		}
	});
}

ShuffleMatch.prototype.ShowAdsError = function()
{
	var dlg = b5.Utils.findObjectFromPath("gameover.adserror_dlg");
	dlg.active = true;
	dlg.visible = true;
	dlg.playTimeline("show");
}

ShuffleMatch.prototype.ChallengeFriendPressed = function()
{
	var that = this;
    this.Instants.ChooseContext(function(success, error)
    {
        that.Challenger = null;
    });
}

ShuffleMatch.prototype.ShowChallenged = function()
{
    var dlg = b5.Utils.findObjectFromPath("mainmenu.challenged_dlg");
    dlg.visible = true;
    dlg.active = true;
    b5.app.findResource("slide", "sound").play();
    dlg.playTimeline("show");
}

ShuffleMatch.prototype.SetChallenged = function()
{
	var that = this;
	this.ChallengerName = null;

	if (this.Challenger.myReplayData.id == this.Instants.GetPlayerID())
	{
		this.Challenger = null;
		return;
	}

    this.Instants.GetConnectedPlayers(function(players)
    {
        for (var t = 0; t < players.length; t++)
        {
            if (players[t].getID() == that.Challenger.myReplayData.id)
            {
                that.ChallengerName = players[t].getName();
                b5.Utils.findObjectFromPath("mainmenu.challenged_dlg.name")._text = that.ChallengerName;
                b5.Utils.findObjectFromPath("mainmenu.challenged_dlg.bestscore")._text = that.Challenger.myReplayData.score;
                var bitmap = new b5.Bitmap("photo", players[t].getPhoto(), false, function(bitmap)
                {
                    var actor = b5.Utils.findObjectFromPath("mainmenu.challenged_dlg.photo");
                    actor.bitmap = bitmap;
                    that.ShowChallenged();
                });
                bitmap.image.crossOrigin = "anonymous";
                bitmap.load();
                break;
            }
        }
    });
}

ShuffleMatch.prototype.ShareBestScore = function()
{
	var data = { score: this.best_score, id: this.Instants.GetPlayerID() };
	var that = this;
    this.Instants.ShareCustom("CHALLENGE", this.Instants.GetScreenshot(), "Can you beat my best score of " + this.best_score + "?", data, function()
    {
        if (!that.RewardedShare)
        {
            that.RewardedShare = true;   
        }
    });
}

ShuffleMatch.prototype.GetPlayerRank = function()
{
	this.Instants.GetLeaderboardScore(this.LeaderboardName, function(entry)
	{
		if (entry !== null)
		{
			b5.Utils.findObjectFromPath("leaderboard.top_panel.rank_holder.rank")._text = AddOrdinalSuffice(entry.getRank()) + " Place";
			b5.Utils.findObjectFromPath("leaderboard.top_panel.rank_holder.score")._text = entry.getScore();
		}
	});
}

ShuffleMatch.prototype.GetLeaderboard = function()
{
	if (this.current_leaderboard === "global")
	{
		this.Instants.GetLeaderboardEntries(this.LeaderboardName, 0, 20, function(entries)
		{
			for (var t = 0; t < 20; t++)
			{
				var actor = b5.Utils.findObjectFromPath("leaderboard.listbox.entry" + (t + 1));
				if (t < entries.length)
				{
					var entry = entries[t];
					actor.visible = true;
					actor.findActor("rank")._text = AddOrdinalSuffice(entry.getRank());
					actor.findActor("name")._text = entry.getPlayer().getName();
					actor.findActor("score")._text = entry.getScore();
					var bitmap = new b5.Bitmap("entry" + (t + 1), entry.getPlayer().getPhoto(), false, function(bitmap)
					{
					});
					actor.findActor("photo").bitmap = bitmap;
					bitmap.image.crossOrigin = "anonymous";
					bitmap.load();
				}
				else
				{
					actor.visible = false;
				}
			}
			var lbd = b5.Utils.findObjectFromPath("leaderboard.listbox");
			var range = (entries.length + 1) * 240;
			lbd.scroll_range = [0, -range / 2, 0, range / 2];
		});
	}
	else
	{
		this.Instants.GetConnectedLeaderboardEntries(this.LeaderboardName, 0, 20, function(entries)
		{
			for (var t = 0; t < 20; t++)
			{
				var actor = b5.Utils.findObjectFromPath("leaderboard.listbox.entry" + (t + 1));
				if (t < entries.length)
				{
					var entry = entries[t];
					actor.visible = true;
					actor.findActor("rank")._text = AddOrdinalSuffice(entry.getRank());
					actor.findActor("name")._text = entry.getPlayer().getName();
					actor.findActor("score")._text = entry.getScore();
					var bitmap = new b5.Bitmap("entry" + (t + 1), entry.getPlayer().getPhoto(), false, function(bitmap)
					{
					});
					actor.findActor("photo").bitmap = bitmap;
					bitmap.image.crossOrigin = "anonymous";
					bitmap.load();
				}
				else
				{
					actor.visible = false;
				}
			}
			var lbd = b5.Utils.findObjectFromPath("leaderboard.listbox");
			var range = (entries.length + 1) * 240;
			lbd.scroll_range = [0, -range / 2, 0, range / 2];
		});
	}
}

ShuffleMatch.prototype.GetProducts = function()
{
	if (!this.Instants.purchasingSupported || this.products_retrieved)
		return;
	this.Instants.GetProducts(function(catalog)
	{
		for (var t = 0; t < catalog.length; t++)
		{
			var product = catalog[t];
			if (product.productID == "com.yourname.coins10")
			{
				b5.Utils.findObjectFromPath("mainmenu.shop_dialog.iap2.text")._text = "BUY NOW " + product.price;
				b5.Utils.findObjectFromPath("gameover.shop_dialog.iap2.text")._text = "BUY NOW " + product.price;
			}
			else if (product.productID == "com.yourname.coins100")
			{
				b5.Utils.findObjectFromPath("mainmenu.shop_dialog.iap3.text")._text = "BUY NOW " + product.price;
				b5.Utils.findObjectFromPath("gameover.shop_dialog.iap3.text")._text = "BUY NOW " + product.price;
			}
			else if (product.productID == "com.yourname.coins1000")
			{
				b5.Utils.findObjectFromPath("mainmenu.shop_dialog.iap4.text")._text = "BUY NOW " + product.price;
				b5.Utils.findObjectFromPath("gameover.shop_dialog.iap4.text")._text = "BUY NOW " + product.price;
			}
		}
		this.products_retrieved = true;
	});
	this.ConsumeAllProducts();
}

ShuffleMatch.prototype.ConsumeAllProducts = function()
{
	var that = this;
	this.Instants.GetUnconsumedProducts(function(purchases)
	{
		for (var t = 0; t < purchases.length; t++)
		{
			var purchase = purchases[t];
			//console.log(">>>> Consuming product");
			//console.log(purchase);
			var coins = 0;
			if (purchase.productID === "com.yourname.coins10")
				coins = 25;
			else if (purchase.productID === "com.yourname.coins100")
				coins = 100;
			else if (purchase.productID === "com.yourname.coins1000")
				coins = 1000;
			that.coins += coins;
			that.Instants.ConsumeProduct(purchase.purchaseToken);
		}
		that.SaveGame();
		that.updateHUD();
		UpdateShopCoins();
});
}

ShuffleMatch.prototype.BuyProduct = function(product, done_callback)
{
	if (!this.Instants.purchasingSupported)
		return;
	var that = this;
	var product_id = "com.yourname." + product;
	var payload = "secretword" + ((Math.random() * 1024) | 0);
	this.Instants.BuyProduct(product_id, payload, function(purchase)
	{
		if (purchase !== null && payload == purchase.developerPayload)
		{
			var coins = 0;
			if (purchase.productID === "com.yourname.coins10")
				coins = 25;
			else if (purchase.productID === "com.yourname.coins100")
				coins = 100;
			else if (purchase.productID === "com.yourname.coins1000")
				coins = 1000;
			that.coins += coins;
			that.SaveGame();
			that.Instants.ConsumeProduct(purchase.purchaseToken);
			that.updateHUD();
			UpdateShopCoins();
			if (done_callback != undefined)
				done_callback(true);
		}
		else
		{
			if (done_callback != undefined)
				done_callback(false);
		}
	});
}

ShuffleMatch.prototype.SwitchGame = function(which)
{
	var that = this;
	if (which === 0)
		this.Instants.SwitchGame("656374114754101", null, function()
		{
            that.Instants.LogEvent("Switch to Ad 1", 1);
		});
	else if (which === 1)
		this.Instants.SwitchGame("165246960826033", null, function()
		{
            that.Instants.LogEvent("Switch to Ad 2", 1);
		});
}

function GameLoaded()
{
	window.shuffle_match = new ShuffleMatch();
}

