/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Bitmap object represents a bit-mapped image that can be displayed by {@link b5.Actor}'s. Generally a Bitmap should be added to
 * either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be managed by them.
 *
 * Example showing how to create a bitmap and add it to the scenes resource manager
 *
 *      var bitmap = new b5.Bitmap("background", "images/background.jpg", true);
 *      scene.addResource(bitmap, "bitmap");    // Add to scenes resource manager so it can be reused
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Bitmap
 * @constructor
 * @returns {b5.Bitmap}                     The created bitmap
 * @param name {string}                     Name of bitmap resource
 * @param location {string}                 Location of the bitmap resource
 * @param preload {boolean}                 If true then the bitmap will be loaded as soon as it is created
 * @param onload {function}                 Callback function that should be called when the bitmap has finished loading or null
 *
 * @property {Image}                    image           - The HTML5 Image that contains the bitmap (internal)
 * @property {string}                   name            - Name of this bitmap resource
 * @property {string}                   location        - Location of the bitmap resource
 * @property {function}                 onload          - Callback function that should be called when the bitmap has finished loading or null
 * @property {boolean}                  preload         - If set to true then the bitmap will be loaded as soon as it is created
 * @property {boolean}                  loaded          - If true then this resource has finished loading
 */
b5.Bitmap = function(name, location, preload, onload)
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
            b5.app.onResourceLoaded(that, false);
            if (onload !== undefined)
                onload(that);
        };
        this.image.onerror = function()
        {
            b5.app.onResourceLoaded(that, true);
        };
        this.image.src = location;  // Start the load
    }
};

/**
 * Loads the bitmap, only required if not preloaded
 */
b5.Bitmap.prototype.load = function()
{
    var that = this;
    this.image.onload = function()
    {
        b5.app.onResourceLoaded(that, false);
        if (that.onload !== undefined)
            that.onload(that);
    };
    this.image.onerror = function()
    {
        b5.app.onResourceLoaded(that, true);
    };
    this.image.src = this.location; // Start the load
};

/**
 * Removes this resource from its resource manager and destroys it
 */
b5.Bitmap.prototype.destroy = function()
{
    this.image = null;
    if (this.parent !== null)
        this.parent.removeResource(this, "bitmap");
};

