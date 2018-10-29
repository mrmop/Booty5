"use strict";

var Log = function(message)
{
    if (b5.app.debug)
        console.log(message);
}

b5.Instants = function()
{
    this.onPaused = undefined;
    this.onPaymentsReady = undefined;
    this.videoAdsSupported = false;
    this.interstitialAdsSupported = false;
    this.purchasingSupported = false;
    this.purchasingReady = false;
    this.preloadedVideoAd = null;
    this.preloadedInterAd = null;
    this.adReady = false;
    this.adLoadError = "";
    this.shotCache = null;
	this.mock = true;
}

b5.Instants.prototype.Init = function()
{
};

b5.Instants.prototype.StartInit = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback();
};

b5.Instants.prototype.StartGame = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback();
};

b5.Instants.prototype.SetLoadingProgress = function(perc)
{
};

b5.Instants.prototype.GetLocale = function()
{
    return "en_US";
};

b5.Instants.prototype.GetPlatform = function()
{
    return "web";
};

b5.Instants.prototype.GetEntryPointData = function()
{
    return null;
};

b5.Instants.prototype.GetPlayerID = function()
{
    return "1";
};

b5.Instants.prototype.GetPlayerName = function()
{
    return null
};

b5.Instants.prototype.GetPlayerPhotoURL = function()
{
    return null
};

b5.Instants.prototype.GetConnectedPlayers = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(null);
};

b5.Instants.prototype.GetContext = function()
{
    return null;
};

b5.Instants.prototype.GetContextPlayers = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(null);
};

b5.Instants.prototype.ChooseContext = function(done_callback)
{
	if (done_callback != null)
		done_callback(false, "NO");
};

b5.Instants.prototype.ChooseContextWithOptions = function(options, done_callback)
{
	if (done_callback != null)
		done_callback(false, "NO");
};

b5.Instants.prototype.SwitchContext = function(context_id, done_callback)
{
	if (done_callback != null)
		done_callback(false, "NO");
};

b5.Instants.prototype.CreateContext = function(player_id, done_callback)
{
	if (done_callback != null)
		done_callback(false, "NO");
};

b5.Instants.prototype.SetPlayerData = function(data_object, done_callback)
{
	var data = localStorage.getItem("playerData");
	var obj = JSON.parse(data);
	if (obj === undefined || obj == null)
		obj = {};
	for (var attr in data_object)
	{
		obj[attr] = data_object[attr];
	}
	localStorage.setItem("playerData", JSON.stringify(obj));
	if (done_callback !== undefined)
		done_callback(true);
};

b5.Instants.prototype.GetPlayerData = function(property_array, done_callback)
{
	var data = localStorage.getItem("playerData");
	var response = {};
	if (data) {
		data = JSON.parse(data);
		property_array.forEach(function(key){
			if (data[key] !== "undefined") {
				response[key] = data[key];
			}
		});
	}
	if (done_callback !== undefined)
		done_callback(response);
};

b5.Instants.prototype.SetSessionData = function(data_object)
{
};

b5.Instants.prototype.SwitchGame = function(app_id, data, fail_callback)
{
};

b5.Instants.prototype.PostCustomUpdate = function(title, image64, message, custom_template, strategy, data, done_callback)
{
	if (done_callback !== undefined)
		done_callback();
};

b5.Instants.prototype.PostLeaderboardUpdate = function(leaderboard, message, done_callback)
{
	if (done_callback !== undefined)
		done_callback();
};

b5.Instants.prototype.ShareCustom = function(intent, image, message, data, done_callback)
{
	if (done_callback != null)
		done_callback(false, "NO");
};

b5.Instants.prototype.GetLeaderboardEntries = function(leaderboard_name, start, count, done_callback)
{
	if (done_callback !== undefined)
		done_callback(null);
};

b5.Instants.prototype.GetConnectedLeaderboardEntries = function(leaderboard_name, start, count, done_callback)
{
	if (done_callback !== undefined)
		done_callback(null);
};

b5.Instants.prototype.SetLeaderboardScore = function(leaderboard_name, score, meta, done_callback)
{
	if (done_callback !== undefined)
		done_callback(false);
};

b5.Instants.prototype.GetLeaderboardScore = function(leaderboard_name, done_callback)
{
	if (done_callback !== undefined)
		done_callback(null);
};

b5.Instants.prototype.CanMatchPlayer = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(false);
}

b5.Instants.prototype.MatchPlayer = function(tag, switch_context, done_callback)
{
	if (done_callback !== undefined)
		done_callback(false);
}

b5.Instants.prototype.Quit = function()
{
	// TODO:
};

b5.Instants.prototype.GetPlayerPhotoURL = function()
{
    return null;
};

b5.Instants.prototype.PreloadVideoAd = function(done_callback, placement_id)
{
	if (done_callback !== undefined)
		done_callback(false, "NO");
};

b5.Instants.prototype.ReloadVideoAd = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(false, "NO");
};

b5.Instants.prototype.ShowVideoAd = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(false, "NO");
};

b5.Instants.prototype.PreloadInterstitialAd = function(done_callback, placement_id)
{
	if (done_callback !== undefined)
		done_callback(false, "NO");
};

b5.Instants.prototype.ReloadInterstitialAd = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(false, "NO");
};

b5.Instants.prototype.ShowInterstitialAd = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(false, "NO");
};

b5.Instants.prototype.IsAdReady = function()
{
    return false;
};

b5.Instants.prototype.CreateScreenshotCache = function(height)
{
    var disp = b5.app.display;
    this.shotCache = disp.createCache();
    if (this.shotCache === null)
        return null;
    var canvas = b5.app.canvas;
    this.shotCache.height = height;
    this.shotCache.width = canvas.width * (this.shotCache.height / canvas.height);
}

b5.Instants.prototype.GetScreenshot = function(image)
{
    var disp = b5.app.display;
    if (this.shotCache === null)
        return null;
    try
    {
        var canvas = b5.app.canvas;
        if (image !== undefined)
            canvas = image;
        var scale = (this.shotCache.height / canvas.height) / b5.app.pixel_ratio;
        disp.setCache(this.shotCache);
        disp.setTransform(scale,0,0,scale, 0,0);
        disp.drawImage(canvas, 0, 0);
        disp.setCache(null);
        return this.shotCache.toDataURL("image/png");
    }
    catch (ex)
    {
        return null;
    }
}

b5.Instants.prototype.LogEvent = function(name, params, value)
{
	// TODO:
}

b5.Instants.prototype.GetProducts = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(null);
}

b5.Instants.prototype.GetUnconsumedProducts = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(null);
}

b5.Instants.prototype.BuyProduct = function(product_id, payload, done_callback)
{
	if (done_callback !== undefined)
		done_callback(null, "NO");
}

b5.Instants.prototype.ConsumeProduct = function(token, done_callback)
{
	if (done_callback !== undefined)
		done_callback(null, "NO");
}

b5.Instants.prototype.CreateShortcut = function(done_callback)
{
	if (done_callback !== undefined)
		done_callback(false);
}

b5.Instants.instance = new b5.Instants();
