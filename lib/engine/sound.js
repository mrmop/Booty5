/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Sound represents a sound effect
//
function Sound(name, location)
{
	// Public variables
	this.name = name;					// The sound name
	this.location = location;			// Location of sound
}

Sound.prototype.play = function()
{
	var snd = new Audio(this.location);
	snd.play();
	return snd;
};
