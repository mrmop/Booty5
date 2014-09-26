/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Sound represents a sound effect object and can be used tp play back audio. Generally a Sound should be added to
// either a scene or the global app's resources so that it can be managed by them.
//
function Sound(name, location)
{
    // Public variables
    this.name = name;					// The sound name
    this.location = location;			// Location of the sound
}

Sound.prototype.play = function()
{
    var snd = new Audio(this.location);
    snd.play();
    return snd;
};
