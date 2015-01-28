/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A Bitmap object represents a bit-mapped image that can be displayed by Actors. Generally a Bitmap should be added to
// either a scene or the global app's resources so that it can be managed by them.
//
//// Example showing how to create a bitmap and add it to the scenes resource manager
// var bitmap = new Bitmap("background", "images/background.jpg", true);
// scene.addResource(bitmap, "bitmap");    // Add to scenes resource manager so it can be reused

function Bitmap(name, location, preload, onload)
{
    // Internal variables
    this.image = new Image();			// Image object

    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// The bitmaps name
    this.location = location;			// Location of the bitmap
    this.onload = onload;               // On image loaded callback
    this.preload = preload;             // If true then image will be preloaded
    this.loaded = false;                // Set to true once image has done loading

    if (preload)
    {
        var that = this;
        this.image.onload = function()
        {
            window.app.onResourceLoaded(that, false);
            if (onload !== undefined)
                onload();
        };
        this.image.onerror = function()
        {
            window.app.onResourceLoaded(that, true);
        };
        this.image.src = location;
    }
}

Bitmap.prototype.load = function()
{
    var that = this;
    this.image.onload = function()
    {
        window.app.onResourceLoaded(that, false);
        if (that.onload !== undefined)
            that.onload();
    };
    this.image.onerror = function()
    {
        window.app.onResourceLoaded(that, true);
    };
    this.image.src = this.location;
};

Bitmap.prototype.destroy = function()
{
    this.image = null;
    if (this.parent != null)
        this.parent.removeResource(this, "bitmap");
};
