/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A Sound represents a sound effect object and can be used tp play back audio. Generally a Sound should be added to
// either a scene or the global app's resources so that it can be managed by them.
//
b5.Sound = function(name, location, reuse)
{
    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// The sound name
    this.location = location;			// Location of the sound
    this.location2 = null;			    // Location of fallback sound
    this.loop = false;                  // If set to true the this sound will replay continuously
    if (reuse !== undefined)
        this.reuse = reuse;			    // When set to true sound effect instance will be reused
    else
        this.reuse = false;
    this.snd = null;                    // Sound instance (re-usable sound only)
    this.preload = false;               // Set to true to preload sound
    this.loaded = false;                // Set to true once audio cam be played
};

b5.Sound.prototype.load = function()
{
    var debug = b5.app.debug;
    var snd;
    var that = this;
    if (b5.app.use_marm)
        snd = new Media("/android_asset/webassets/" + this.location);
    else
    {
        snd = new Audio();
        if (this.loop)
        {
            if (typeof snd.loop === "boolean")
                snd.loop = true;
            else
            {
                snd.addEventListener('ended', function() {
                    this.currentTime = 0;
                    this.play();
                }, false);
            }
        }
        snd.onerror = function() {
            snd.onerror = null;
            if (that.location2 !== null)
            {
                snd.onerror = function() {
                    snd.onerror = null;
                    b5.app.onResourceLoaded(that, true);
                };
                snd.src = that.location2;
                snd.play();
                that.snd = snd;
            }
            else
            {
                b5.app.onResourceLoaded(that, true);
            }
        };
        snd.oncanplaythrough = function() {
            snd.oncanplaythrough = null;
            b5.app.onResourceLoaded(that, false);
        };
        snd.src = this.location;
    }
    this.snd = snd;
};

b5.Sound.prototype.play = function()
{
    var snd = null;
    if (this.reuse)
        snd = this.snd;
    if (snd === null)
    {
        if (b5.app.use_marm || !this.reuse)
            this.load();
    }
    if (snd !== null)
        snd.play();
    return snd;
};

b5.Sound.prototype.stop = function()
{
    if (this.reuse && this.snd !== null)
        this.snd.stop();
};

b5.Sound.prototype.pause = function()
{
    if (this.reuse && this.snd !== null)
        this.snd.pause();
};

b5.Sound.prototype.destroy = function()
{
    if (this.parent !== null)
    {
        if (b5.app.use_marm)
        {
            if (b5.app.use_marm && this.snd !== null)
                this.snd.release();
            this.parent.removeResource(this, "sound");
        }
    }
};

