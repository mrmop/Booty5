/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Bitmap represents a bitmap image
//
function Bitmap(name, location, preload)
{
	// Public variables
	this.name = name;					// The bitmap name
	this.image = new Image();			// Image
	this.location = location;			// Location of bitmap
	
	if (preload)
		this.image.src = location;
}

Bitmap.prototype.load = function()
{
	this.image.src = this.location;
};
