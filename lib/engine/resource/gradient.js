/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A Gradient object represents c collection of colours that form a gradient
// Generally a Gradient should be added to either a scene or the global app's resources so that it can be
// managed by them. Gradients can be used to fill Actor visuals.
//

b5.Gradient = function(name, colour_stops)
{
    // Internal variables

    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// Gradient name
    if (colour_stops !== undefined)
        this.stops = colour_stops;	    // Array of colour stops
    else
        this.stops = [];
};

b5.Gradient.prototype.addColourStop = function(colour, offset)
{
    this.stops.push({c: colour, offs: offset});
};

b5.Gradient.prototype.getColourStop = function(index)
{
    return this.stops[index];
};

b5.Gradient.prototype.getMaxStops = function()
{
    return this.stops.length;
};

b5.Gradient.prototype.destroy = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "brush");
};

b5.Gradient.prototype.createStyle = function(w, h, start, end)
{
    if (this.stops !== undefined)
    {
        var x1 = 0, y1 = 0;
        var x2 = 1, y2 = 0;
        if (start !== undefined)
        {
            x1 = start.x;
            y1 = start.y;
        }
        if (end !== undefined)
        {
            x2 = end.x;
            y2 = end.y;
        }
        x1 = x1 * w - w / 2;
        y1 = y1 * h - h / 2;
        x2 = x2 * w - w / 2;
        y2 = y2 * h - h / 2;
        var grad = b5.app.display.context.createLinearGradient(x1, y1, x2, y2);
        for (var t = 0; t < this.stops.length; t++)
        {
            var s = this.stops[t];
            grad.addColorStop(s.offs, s.c);
        }
        return grad;
    }

    return null;
};

