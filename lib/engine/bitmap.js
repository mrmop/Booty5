/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Bitmap object represents a bit-mapped image that can be displayed by Actors. Generally a Bitmap should be added to
// either a scene or the global app's resources so that it can be managed by them.
//
function Bitmap(name, location, preload)
{
    // Internal variables
    this.image = new Image();			// Image object

    // Public variables
    this.name = name;					// The bitmaps name
    this.location = location;			// Location of the bitmap

    if (preload)
        this.image.src = location;
}

Bitmap.prototype.load = function()
{
    this.image.src = this.location;
};
