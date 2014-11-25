/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// An Gradient object represents c collection of colours that form a gradient
// Generally a Gradient should be added to either a scene or the global app's resources so that it can be
// managed by them. Gradients can be used to fill Actor visuals.
//

function Gradient(name, colour_stops)
{
    // Internal variables

    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// Gradient name
    this.angle = 0;                     // Gradient angle in degrees
    if (colour_stops !== undefined)
        this.stops = colour_stops;	    // Array of colour stops
    else
        this.stops = [];
}

Gradient.prototype.addColourStop = function(colour, offset)
{
    this.stops.push({c: colour, offs: offset});
};

Gradient.prototype.getColourStop = function(index)
{
    return this.stops[index];
};

Gradient.prototype.getMaxStops = function()
{
    return this.stops.length;
};

Gradient.prototype.destroy = function()
{
    if (this.parent != null)
        this.parent.removeResource(this, "brush");
};
