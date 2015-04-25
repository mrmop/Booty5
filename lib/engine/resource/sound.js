/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Sound represents a sound effect object and can be used to play back audio
 *
 * Generally a sound should be added to either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be managed by them.
 *
 * Example showing how to load and play a sound effect
 *
 *      var sound = new b5.Sound("explosion", "sounds/explosion.mp3", true);
 *      var instance = sound.play();
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Sound
 * @constructor
 * @returns {b5.Sound}                      The created sound
 * @param name {string}                     Name of sound resource
 * @param location {string}                 The sound file location
 * @param reuse {boolean}                   Mark the sound to be re-used (only one single instance will ever be created if true)
 *
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {object}                   snd             - Sound instance (re-usable sound only) (internal). For Web Audio stores a {source:AudioBufferSourceNode, gain:GainNode} object for auto play sounds
 * @property {object}                   buffer          - AudioBufferSourceNode containing decoded audio data (Web Audio only)
 * @property {string}                   name            - Name of this sound resource
 * @property {string}                   location        - The location of the sound file that is used to create the audio object
 * @property {string}                   location2       - The location of the sound file that is used as a fall back if sound at location does not load
 * @property {boolean}                  reuse           - When set to false the generated sound Audio will be re-used, this can prevent sounds that are currently playing being replayed whilst currently being played but can help resolve audio playback issues (Not used by Marmalade or Web Audio)
 * @property {boolean}                  loop            - If set to true then sound will be looped
 * @property {boolean}                  preload         - If set to true then this sound will be preloaded
 * @property {boolean}                  auto_play         - If set to true then this sound will be preloaded
 * @property {boolean}                  loaded          - If true then this resource has finished loading
 */
b5.Sound = function(name, location, reuse)
{
    // internal variables
    this.parent = null;                 // Parent container
    this.snd = null;                    // Sound instance (re-usable sound only). For Web Audio stores a {AudioBufferSourceNode, GainNode } object for auto play sounds
    this.buffer = null;                 // AudioBufferSourceNode containing decoded audio data (Web Audio only)

    // Public variables
    this.name = name;					// The sound name
    this.location = location;			// Location of the sound
    this.location2 = null;			    // Location of fallback sound
    this.loop = false;                  // If set to true the this sound will replay continuously
    if (reuse !== undefined)
        this.reuse = reuse;			    // When set to true sound effect instance will be reused
    else
        this.reuse = false;
    this.preload = false;               // Set to true to preload sound
    this.loaded = false;                // Set to true once audio cam be played
    this.auto_play = false;             // Set to true to auto play sound when loaded
};

/**
 * AudioContext used by Web Audio API
 * @type {object}
 */
b5.Sound.context = null;

b5.Sound.mp3_supported = false;
b5.Sound.ogg_supported = false;
b5.Sound.wav_supported = false;

/**
 * Initialises the sound system
 * @parm app {b5.App}   The App that will manage the audio engine
 * @returns {boolean}   true for success or false if error
 */
b5.Sound.init = function(app)
{
    if (!app.use_marm)
    {
        b5.Sound.ogg_supported = new Audio().canPlayType("audio/ogg") !== "";
        b5.Sound.mp3_supported = new Audio().canPlayType("audio/mpeg") !== "";
        b5.Sound.wav_supported = new Audio().canPlayType("audio/wav") !== "";
    }
    if (app.use_web_audio)
    {
        try
        {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (window.AudioContext === undefined)
                return false;
            b5.Sound.context = new AudioContext();
        }
        catch(e)
        {
            return false;
        }
        return true;
    }
    return false;
};

/**
 * Checks if the supplied audio file type is supported
 * @param  filename {string}    Name of audio file
 * @returns {boolean}           true if probably supported, false if not
 */
b5.Sound.isSupported = function(filename)
{
    var type = filename.substr(filename.lastIndexOf('.') + 1);
    if (type === "ogg" && b5.Sound.ogg_supported)
        return true;
    if (type === "mp3" && b5.Sound.mp3_supported)
        return true;
    if (type === "wav" && b5.Sound.wav_supported)
        return true;

    return false;
};

/**
 * Loads the sound
 */
b5.Sound.prototype.load = function()
{
    var debug = b5.app.debug;
    var snd;
    var that = this;
    var filename = this.location;
    var auto_play = this.auto_play;
    if (b5.app.use_marm)
    {
        snd = new Media("/android_asset/webassets/" + filename);
        if (auto_play)
            this.play();
    }
    else
    {
        if (!b5.Sound.isSupported(filename))
        {
            filename = this.location2;
            if (!b5.Sound.isSupported(filename))
            {
                if (b5.app.debug)
                {
                    console.log("Warning: Unsupported audio formats")
                    b5.app.onResourceLoaded(that, true);
                }
                return;
            }
        }
        if (b5.app.use_web_audio)
        {
            if (!b5.Utils.loadJSON(filename, false, function(data) {
                if (data !== null)
                {
                    b5.Sound.context.decodeAudioData(data, function(buffer) {
                        that.buffer = buffer;
                        b5.app.onResourceLoaded(that, false);
                        if (auto_play)
                            that.play();
                    }, function(e) {console.log(e)});
                }
                }, true))
                b5.app.onResourceLoaded(that, true);
        }
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
                b5.app.onResourceLoaded(that, true);
            };
            snd.oncanplaythrough = function() {
                snd.oncanplaythrough = null;
                b5.app.onResourceLoaded(that, false);
                if (auto_play)
                    that.play();
            };
            snd.src = filename;
        }
    }
    this.snd = snd;
};

/**
 * Starts playback of the sound
 * @returns {object} An Audio object representing the playing sound or a {source, gain} object if using Web Audio API
 */
b5.Sound.prototype.play = function()
{
    if (b5.app.use_web_audio)
    {
        if (this.buffer === null)
            return null;
        var context = b5.Sound.context;
        var source = context.createBufferSource();
        var gain = context.createGain();
        source.buffer = this.buffer;
        source.loop = this.loop;
        source.connect(gain);
        gain.connect(context.destination);
        gain.gain.value = 1;
        source.start(0);
        if (this.auto_play)
            this.snd = { source: source, gain: gain };
        return { source: source, gain: gain };
    }

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

/**
 * Stops playback of thr sound (re-usable sound only)
 */
b5.Sound.prototype.stop = function()
{
    if (this.reuse && this.snd !== null)
        this.snd.stop();
};

/**
 * Pauses playback of the sound (re-usable sound only)
 */
b5.Sound.prototype.pause = function()
{
    if (this.reuse && this.snd !== null)
        this.snd.pause();
};

/**
 * Removes the sound from the scene / app and destroys it
 */
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

