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
    var that = this;
    
    if (FBInstant !== undefined)
    {
        FBInstant.onPause(function() {
            if (that.onPaused !== undefined)
                that.onPaused();
        });
        FBInstant.payments.onReady(function () {
            Log(">>>> Purchasing is ready");
            that.purchasingReady = true;
            if (that.onPaymentsReady !== undefined)
                that.onPaymentsReady();
        });        
    }
};

b5.Instants.prototype.Init = function()
{
    var supportedAPIs = FBInstant.getSupportedAPIs();
    if (supportedAPIs.includes("getInterstitialAdAsync"))
        this.interstitialAdsSupported = true;
    if (supportedAPIs.includes("getRewardedVideoAsync"))
        this.videoAdsSupported = true;
    if (supportedAPIs.includes("payments.purchaseAsync"))
        this.purchasingSupported = true;
};

b5.Instants.prototype.StartInit = function(done_callback)
{
    FBInstant.initializeAsync().then(function()
	{
        FBInstant.logEvent('FB Init Success');
        if (done_callback !== undefined)
            done_callback();
    });
};

b5.Instants.prototype.StartGame = function(done_callback)
{
    FBInstant.startGameAsync().then(function()
    {
        if (b5.app.total_load_errors > 0)
            FBInstant.logEvent('FB Load Errors');
        else
            FBInstant.logEvent('FB Load Finished');
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(e) {
        done_callback(false);
    });
};

b5.Instants.prototype.SetLoadingProgress = function(perc)
{
    FBInstant.setLoadingProgress(perc);
};

b5.Instants.prototype.GetLocale = function()
{
    return FBInstant.getLocale();
};

b5.Instants.prototype.GetPlatform = function()
{
    return FBInstant.getPlatform();
};

b5.Instants.prototype.GetEntryPointData = function()
{
    return FBInstant.getEntryPointData();
};

b5.Instants.prototype.GetPlayerID = function()
{
    return FBInstant.player.getID();
};

b5.Instants.prototype.GetPlayerName = function()
{
    return FBInstant.player.getName();
};

b5.Instants.prototype.GetPlayerPhotoURL = function()
{
    return FBInstant.player.getPhoto();
};

b5.Instants.prototype.GetConnectedPlayers = function(done_callback)
{
    FBInstant.player.getConnectedPlayersAsync()
    .then(function(players) {
        if (done_callback !== undefined)
            done_callback(players);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(null);
    });
};

b5.Instants.prototype.GetContext = function()
{
    return FBInstant.context;
};

b5.Instants.prototype.GetContextPlayers = function(done_callback)
{
    FBInstant.context.getPlayersAsync()
    .then(function(players) {
        if (done_callback !== undefined)
            done_callback(players);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(null);
    });
};

b5.Instants.prototype.ChooseContext = function(done_callback)
{
    FBInstant.context.chooseAsync()
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.ChooseContextWithOptions = function(options, done_callback)
{
    FBInstant.context.chooseAsync(options)
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.SwitchContext = function(context_id, done_callback)
{
    FBInstant.context.switchAsync(context_id)
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.CreateContext = function(player_id, done_callback)
{
    FBInstant.context.createAsync(player_id)
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true, FBInstant.context.getID());
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.SetPlayerData = function(data_object, done_callback)
{
    FBInstant.player.setDataAsync(data_object)
    .then(function() {
        if (done_callback !== undefined)
            done_callback(true);
        Log("Player data set");
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false);
    });
};

b5.Instants.prototype.GetPlayerData = function(property_array, done_callback)
{
    FBInstant.player.getDataAsync(property_array)
    .then(function(data) {
        if (done_callback !== undefined)
            done_callback(data);
        Log("Player data loaded");
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback();
    });
};

b5.Instants.prototype.SetSessionData = function(data_object)
{
    FBInstant.setSessionData(data_object);
};

b5.Instants.prototype.SwitchGame = function(app_id, data, fail_callback)
{
    FBInstant.switchGameAsync(app_id, data).catch(function(e)
    {
        if (fail_callback !== undefined)
            fail_callback(e);
    });
};

b5.Instants.prototype.PostCustomUpdate = function(title, image64, message, custom_template, strategy, data, done_callback)
{
    FBInstant.updateAsync({
        action: "CUSTOM",
        cta: title,
        image: image64,
        text: {
            default: message,
            localizations: {
            }
        },
        template: custom_template,
        data: { myReplayData: data },
        strategy: strategy,
        notification: "NO_PUSH",
    })
    .then(function(){
        Log("Message was sent successfully");
        if (done_callback !== undefined)
            done_callback();
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback();
    });
};

b5.Instants.prototype.PostLeaderboardUpdate = function(leaderboard, message, done_callback)
{
    FBInstant.updateAsync({
        action: "LEADERBOARD",
        name: leaderboard,
        text: message
    })
    .then(function(){
        Log("Leaderboard message was sent successfully");
        if (done_callback !== undefined)
            done_callback();
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback();
    });
};

b5.Instants.prototype.ShareCustom = function(intent, image, message, data, done_callback)
{
    FBInstant.shareAsync({
        intent: intent,
        image: image,
        text: message,
        data: { myReplayData: data },
    })
    .then(function(){
        Log("Shared successfully");
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(false, error);
    });
};

b5.Instants.prototype.GetLeaderboardEntries = function(leaderboard_name, start, count, done_callback)
{
    FBInstant.getLeaderboardAsync(leaderboard_name)
        .then(function(leaderboard) {
            return leaderboard.getEntriesAsync(count, start);
        }).then(function(entries) {
            Log("Leaderboard retrieved");
            Log(entries);
            if (done_callback != undefined)
                done_callback(entries);
        }).catch(function(error) {
            Log(error)
            if (done_callback != undefined)
                done_callback(null);
        });
};

b5.Instants.prototype.GetConnectedLeaderboardEntries = function(leaderboard_name, start, count, done_callback)
{
    FBInstant.getLeaderboardAsync(leaderboard_name)
        .then(function(leaderboard) {
            return leaderboard.getConnectedPlayerEntriesAsync(count, start);
        }).then(function(entries) {
            Log("Connected leaderboard retrieved");
            Log(entries);
            if (done_callback != undefined)
                done_callback(entries);
        }).catch(function(error) {
            Log(error)
            if (done_callback != undefined)
                done_callback(null);
        });
};

b5.Instants.prototype.SetLeaderboardScore = function(leaderboard_name, score, meta, done_callback)
{
    FBInstant.getLeaderboardAsync(leaderboard_name)
        .then(function(leaderboard) {
            return leaderboard.setScoreAsync(score, meta);
        }).then(function(entry) {
            Log("Score saved");
            Log(entry);
            if (done_callback != undefined)
                done_callback(true, entry);
        }).catch(function(error) {
            Log(error);
            if (done_callback != undefined)
                done_callback(false);
        });
};

b5.Instants.prototype.GetLeaderboardScore = function(leaderboard_name, done_callback)
{
    FBInstant.getLeaderboardAsync(leaderboard_name)
        .then(function(leaderboard)
        {
            return leaderboard.getPlayerEntryAsync();
        }).then(function(entry) {
            Log("Score retrieved");
            Log(entry);
            if (done_callback != undefined)
                done_callback(entry);
        }).catch(function(error) {
            if (done_callback != undefined)
                done_callback(null);
            console.error(error);
        });
};

b5.Instants.prototype.CanMatchPlayer = function(done_callback)
{
    FBInstant.checkCanPlayerMatchAsync()
        .then(function(canMatch) {
            if (done_callback !== undefined)
                done_callback(canMatch);
        }).catch(function(error) {
            Log(error);
            if (done_callback !== undefined)
                done_callback(false);
        });
}

b5.Instants.prototype.MatchPlayer = function(tag, switch_context, done_callback)
{
    FBInstant.matchPlayerAsync(tag, switch_context)
        .then(function() {
            if (done_callback !== undefined)
                done_callback(true);
        }).catch(function(err) {
            if (done_callback !== undefined)
                done_callback(false);
        });
}

b5.Instants.prototype.Quit = function()
{
    FBInstant.quit();
};

b5.Instants.prototype.GetPlayerPhotoURL = function()
{
    return FBInstant.player.getPhoto();
};

b5.Instants.prototype.PreloadVideoAd = function(done_callback, placement_id)
{
    if (!this.videoAdsSupported)
        return;
    var that = this;
    FBInstant.getRewardedVideoAsync(
        placement_id
      ).then(function(rewarded) {
        that.preloadedVideoAd = rewarded;
        return that.preloadedVideoAd.loadAsync();
      }).then(function() {
        that.adReady = true;
        that.adLoadError = "";
        Log("Rewarded video preloaded");
        if (done_callback !== undefined)
            done_callback(true);
      }).catch(function(err){
        that.adLoadError = err.message;
        Log("Rewarded video failed to preload: " + err.message);
        if (done_callback !== undefined)
            done_callback(false, err);
      });
};

b5.Instants.prototype.ReloadVideoAd = function(done_callback)
{
    if (!this.videoAdsSupported)
        return;
    var that = this;
    this.preloadedVideoAd.loadAsync()
      .then(function() {
        that.adReady = true;
        that.adLoadError = "";
        Log("Rewarded video preloaded");
        if (done_callback !== undefined)
            done_callback(true);
      }).catch(function(err){
        that.adLoadError = err.message;
        Log("Rewarded video failed to preload: " + err.message);
        if (done_callback !== undefined)
            done_callback(false, err);
      });
};

b5.Instants.prototype.ShowVideoAd = function(done_callback)
{
    var that = this;
    if (!this.videoAdsSupported)
    {
        Log("Rewarded video ads not supported on this device");
        that.adLoadError = "Not supported";
        if (done_callback !== undefined)
            done_callback(false);
        return;
    }
    if (this.preloadedVideoAd === null)
    {
        return;
    }
    this.preloadedVideoAd.showAsync()
    .then(function() {
        if (done_callback !== undefined)
        {
            Log("Rewarded video paid");
            done_callback(true);
        }
    }).catch(function(e) {
        Log("Rewarded video playback error: " + e.message);
        that.adLoadError = e.message;
        if (done_callback !== undefined)
            done_callback(false, e);
    });
};

b5.Instants.prototype.PreloadInterstitialAd = function(done_callback, placement_id)
{
    if (!this.interstitialAdsSupported)
        return;
    var that = this;
    FBInstant.getInterstitialAdAsync(
        placement_id
      ).then(function(interstitial) {
        that.preloadedInterAd = interstitial;
        return that.preloadedInterAd.loadAsync();
      }).then(function() {
        that.adReady = true;
        that.adLoadError = "";
        Log("Interstitial preloaded");
        if (done_callback !== undefined)
            done_callback(true);
      }).catch(function(err){
        that.adLoadError = err.message;
        Log("Interstitial failed to preload: " + err.message);
        if (done_callback !== undefined)
            done_callback(false, err);
      });
};

b5.Instants.prototype.ReloadInterstitialAd = function(done_callback)
{
    if (!this.interstitialAdsSupported)
        return;
    var that = this;
    this.preloadedInterAd.loadAsync()
      .then(function() {
        that.adReady = true;
        that.adLoadError = "";
        Log("Interstitial preloaded");
        if (done_callback !== undefined)
            done_callback(true);
      }).catch(function(err){
        that.adLoadError = err.message;
        Log("Interstitial failed to preload: " + err.message);
        if (done_callback !== undefined)
            done_callback(false, err);
      });
};

b5.Instants.prototype.ShowInterstitialAd = function(done_callback)
{
    var that = this;
    if (!this.interstitialAdsSupported)
    {
        Log("Interstitial ads not supported on this device");
        that.adLoadError = "Not supported";
        if (done_callback !== undefined)
            done_callback(false);
        return;
    }
    if (this.preloadedInterAd === null)
    {
        if (done_callback !== undefined)
        {
            done_callback(true);
        }
        return;
    }
    this.preloadedInterAd.showAsync()
    .then(function() {
        if (done_callback !== undefined)
        {
            done_callback(true);
        }
    }).catch(function(e) {
        Log("Interstitial playback error: " + e.message);
        that.adLoadError = e.message;
        if (done_callback !== undefined)
            done_callback(false, e);
    });
};

b5.Instants.prototype.IsAdReady = function()
{
    var r = this.adReady;
    this.adReady = false;
    return r;
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

b5.Instants.prototype.GetScreenshot = function(image, type, quality)
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
		if (type === "jpeg")
			return this.shotCache.toDataURL("image/jpeg", quality);
		else
			return this.shotCache.toDataURL("image/png");
    }
    catch (ex)
    {
        return null;
    }
}

b5.Instants.prototype.LogEvent = function(name, params, value)
{
    FBInstant.logEvent(name, value, params);
}

b5.Instants.prototype.GetProducts = function(done_callback)
{
    FBInstant.payments.getCatalogAsync().then(function(catalog)
    {
        if (done_callback !== undefined)
            done_callback(catalog);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(null);
    });
}

b5.Instants.prototype.GetUnconsumedProducts = function(done_callback)
{
    FBInstant.payments.getPurchasesAsync().then(function(purchases)
    {
        if (done_callback !== undefined)
            done_callback(purchases);
    }).catch(function(error) {
        Log(error);
        if (done_callback !== undefined)
            done_callback(null);
    });
}

b5.Instants.prototype.BuyProduct = function(product_id, payload, done_callback)
{
    FBInstant.payments.purchaseAsync(
    {
        productID: product_id,
        developerPayload: payload,
    }).then(function(purchase)
    {
        if (done_callback !== undefined)
            done_callback(purchase);
    }).catch(function(e) {
        Log("Purchase error: " + e.message);
        if (done_callback !== undefined)
            done_callback(null, e);
    });
}

b5.Instants.prototype.ConsumeProduct = function(token, done_callback)
{
    FBInstant.payments.consumePurchaseAsync(token)
    .then(function()
    {
        if (done_callback !== undefined)
            done_callback(true);
    }).catch(function(e) {
        Log("Purchase consumption error: " + e.message);
        if (done_callback !== undefined)
            done_callback(false, e);
    });
}

b5.Instants.prototype.CreateShortcut = function(done_callback)
{
	//console.log(">>>>>> CreateShortcut");
    FBInstant.canCreateShortcutAsync()
    .then(function(canCreateShortcut)
    {
        //console.log("canCreateShortcutAsync = " + canCreateShortcut);
        if (canCreateShortcut)
        {
            FBInstant.createShortcutAsync()
            .then(function() {
                console.log("Shortcut created");
                if (done_callback !== undefined)
                    done_callback(true);
            })
            .catch(function(error) {
                console.log("Shortcut creation error " + error);
                if (done_callback !== undefined)
                    done_callback(false);
            });
        }
        else
        {
            if (done_callback !== undefined)
                done_callback(false);
        }
    });
}

b5.Instants.instance = new b5.Instants();




