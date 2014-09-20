/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Material represents a physical material
//
function Material(name)
{
	// Public variables
	this.name = name;					// The shapes name
	this.type = "static";				// Type of material
	this.density = 1;					// Material density
	this.friction = 0.1;				// Material friction
	this.restitution = 0.1;				// Material restitution
	this.gravity_scale = 1;				// Gravity scale
	this.fixed_rotation = false;		// Set to true to ensure object does not spin
	this.is_bullet = false;				// Set to true if fast moving object
}

