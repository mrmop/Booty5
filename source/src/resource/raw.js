/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A raw JSON data object. Generally a Raw should be added to either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be
 * managed by them.
 *
 * @class b5.Raw
 * @constructor
 * @returns {b5.Raw}                        The created raw data
 * @param name {string}                     Name of raw resource
 * @param location {string}                 Location of the raw resource
 * @param preload {boolean}                 If true then the raw will be loaded as soon as it is created
 * @param onload {function}                 Callback function that should be called when the raw has finished loading or null
 *
 * @property {object}                   data            - The raw JSON data
 * @property {string}                   name            - Name of this raw resource
 * @property {string}                   location        - Location of the raw resource
 * @property {function}                 onload          - Callback function that should be called when the raw has finished loading or null
 * @property {boolean}                  preload         - If set to true then the raw will be loaded as soon as it is created
 * @property {boolean}                  loaded          - If true then this resource has finished loading
 */
b5.Raw = function(name, location, preload, onload)
{
    // Internal variables
    this.data = null;

    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// The raws name
    this.location = location;			// Location of the raw
    this.onload = onload;               // On data loaded callback
    this.preload = preload;             // If true then data will be preloaded
    this.loaded = false;                // Set to true once data has done loading
    this.load_retry = 0;
    
    if (preload)
    {
        this.load();
    }
};

/**
 * Loads the raw, only required if not preloaded
 */
b5.Raw.prototype.load = function()
{
    var that = this;
    b5.Utils.loadJSON(this.location, false, function(data){
        that.data = data;
        if (data !== null)
        {
            that.loaded = true;
            b5.app.onResourceLoaded(that, false);
        }
        else
        {
            that.load_retry++;
            if (that.load_retry > 3)
            {
                b5.app.onResourceLoaded(that, true);
                if (onload !== undefined)
                    onload(data);
            }
            else
                that.load();
        }
    }, false);
};

/**
 * Removes this resource from its resource manager and destroys it
 */
b5.Raw.prototype.destroy = function()
{
    this.data = null;
    if (this.parent !== null)
        this.parent.removeResource(this, "raw");
};

