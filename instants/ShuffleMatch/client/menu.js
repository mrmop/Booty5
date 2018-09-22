var last_focus;
function newGame()
{
	window.shuffle_match.hard = false;
	window.shuffle_match.newGame();
	// Scroll menu scene of fscreen
	window.shuffle_match.menuscene.playTimeline("hide");
}

function restartGame()
{
	window.shuffle_match.hard = false;
	window.shuffle_match.newGame();
	window.shuffle_match.gameoverscene.playTimeline("hide");
	b5.app.focus_scene = window.shuffle_match.viewscene;
	window.shuffle_match.ShowInterstitialAd();
}

function continueFromGameOver(actor)
{
	// Scroll main menu in and game over scene out
	window.shuffle_match.ShowVideoAd();
}

function SetLeaderboard(which)
{
	if (which === "global")
	{
		b5.Utils.findObjectFromPath("leaderboard.top_panel.friends_button.marker")._av = false;
		b5.Utils.findObjectFromPath("leaderboard.top_panel.global_button.marker").playTimeline("show");
	}
	else
	{
		b5.Utils.findObjectFromPath("leaderboard.top_panel.friends_button.marker").playTimeline("show");
		b5.Utils.findObjectFromPath("leaderboard.top_panel.global_button.marker")._av = false;
	}
	window.shuffle_match.current_leaderboard = which;
	window.shuffle_match.GetLeaderboard();
}

function ShowLeaderboard(show)
{
	if (show)
	{
		window.shuffle_match.GetPlayerRank();
		window.shuffle_match.GetLeaderboard();
		last_focus = b5.app.focus_scene;
		b5.app.focus_scene = window.shuffle_match.leaderboardscene;
		window.shuffle_match.leaderboardscene.playTimeline("show");
	}
	else
	{
		window.shuffle_match.leaderboardscene.playTimeline("hide");
		b5.app.focus_scene = last_focus;
	}
}

function ToggleAudio()
{
	b5.Sound.muted = !b5.Sound.muted;
	window.shuffle_match.muted = b5.Sound.muted;
	window.shuffle_match.SaveGame();
	window.shuffle_match.UpdateMusicUI();
	var music = b5.app.findResource("music", "sound");
	if (b5.Sound.muted)
	{
		music.stop();
	}
	else
	{
		if (music.loaded)
			music.play();
		else
			music.load();
	}
}

function ResetGamePressed()
{
	b5.Utils.findObjectFromPath("mainmenu.reset_dialog").playTimeline("show");
}

function ResetGame()
{
	window.shuffle_match.resetGame();
	window.shuffle_match.menuscene.playTimeline("hide");
	b5.Utils.findObjectFromPath("mainmenu.reset_dialog")._av = false;
}

function CancelResetGame()
{
	b5.Utils.findObjectFromPath("mainmenu.reset_dialog")._av = false;
}

function ShowShop(show)
{
	if (show)
	{
		window.shuffle_match.GetProducts();
		UpdateShopCoins();
		b5.Utils.findObjectFromPath("mainmenu.shop_dialog").playTimeline("show");
	}
	else
	{
		b5.Utils.findObjectFromPath("mainmenu.shop_dialog")._av = false;
		b5.Utils.findObjectFromPath("gameover.shop_dialog")._av = false;
	}
}

function ShowShopFromGameOver(show)
{
	if (show)
	{
		window.shuffle_match.GetProducts();
		UpdateShopCoins();
		b5.Utils.findObjectFromPath("gameover.shop_dialog").playTimeline("show");
	}
}

function ShowPurchaseError(from_game_over)
{
	if (from_game_over)
		b5.Utils.findObjectFromPath("gameover.nopurchase_dlg").playTimeline("show");
	else
		b5.Utils.findObjectFromPath("mainmenu.nopurchase_dlg").playTimeline("show");
}

function BuyCoins(count, from_game_over)
{
	if (count === 3)
	{
		window.shuffle_match.ShowVideoAdShop(from_game_over);
	}
	else if (count === 25)
	{
		window.shuffle_match.BuyProduct("coins10", function(success)
		{
			if (!success)
				ShowPurchaseError(from_game_over);
		});
	}
	else if (count === 100)
	{
		window.shuffle_match.BuyProduct("coins100", function(success)
		{
			if (!success)
				ShowPurchaseError(from_game_over);
		});
	}
	else if (count === 1000)
	{
		window.shuffle_match.BuyProduct("coins1000", function(success)
		{
			if (!success)
				ShowPurchaseError(from_game_over);
		});
	}
}

function Peek()
{
	if (window.shuffle_match.coins > 0)
	{
		b5.Utils.findObjectFromPath("guessarea.peek")._av = false;
		window.shuffle_match.coins--;
		window.shuffle_match.SaveGame();
		window.shuffle_match.updateHUD();
		window.shuffle_match.board.flashTargetNumbers();
		b5.Utils.RunafterTime(1, function()
		{
			b5.Utils.findObjectFromPath("guessarea.peek")._av = true;
		});
	}
}

function UpdateShopCoins()
{
	var parent1 = b5.Utils.findObjectFromPath("gameover.shop_dialog.rect");
	var parent2 = b5.Utils.findObjectFromPath("mainmenu.shop_dialog.rect");
	
	// Update coins
	var div = 1000;
	var acc = window.shuffle_match.coins;
	for (var t = 0; t < 4; t++)
	{
		var act = parent1.findActor("coin" + (3 - t));
		var brush = b5.app.findResource("d" + ((acc / div) << 0), "brush");
		act.atlas = brush;
		act = parent2.findActor("coin" + (3 - t));
		act.atlas = brush;
		acc %= div;
		div /= 10;
	}
}

function DismissDaily()
{
	window.shuffle_match.coins += 5;
	window.shuffle_match.SaveGame();
	window.shuffle_match.updateHUD();
	b5.Utils.findObjectFromPath("mainmenu.dialy_reward")._av = false;
}

function GameOverClosed()
{
	b5.Utils.findObjectFromPath("gameover.ad1")._av = false;
	b5.Utils.findObjectFromPath("gameover.ad2")._av = false;
}

function SwitchGame(which)
{
	b5.app.findResource('tap', 'sound').play();
	window.shuffle_match.SwitchGame(which);
}