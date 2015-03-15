/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Audio actions are actions that deal with changing audio
//
// A_Sound      - Plays, pauses or stops a sound

//
// The Sound action plays, pauses or stops a sound then exits
// - name - Path to or instance of sound
// - action - Action to perform on sound (play, pause or stop)
//
b5.A_Sound = function(sound, action)
{
    this.sound = sound;
    this.action = action;
};
b5.A_Sound.prototype.onInit = function()
{
    this.sound = b5.Utils.resolveResource(this.sound, "sound");
    var sound = this.sound;
    if (sound !== null)
    {
        var action = this.action;
        if (action === "play")
            sound.play();
        else if (action === "pause")
            sound.pause();
        else if (action === "stop")
            sound.stop();
    }
};
b5.ActionsRegister.register("Sound", function(p) { return new b5.A_Sound(p[1],p[2]); });
