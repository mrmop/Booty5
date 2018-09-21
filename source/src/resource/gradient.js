/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Gradient object is a brush that represents a collection of colours and offsets of those colours that form a gradient.
 * Generally a Gradient should be added to either a scene or the global {@link b5.App}'s resources so that it can be managed
 * by them. Gradients are not used directly by {@link b5.Actor}'s but they can be used to create stroke and fill styles for them.
 *
 * Example showing how to create a gradient and use it to paint an Actor
 *
 *      // Create a gradient
 *      var gradient = new b5.Gradient();
 *      gradient.addColourStop("#ff0000", 0);
 *      gradient.addColourStop("#00ff00", 0.5);
 *      gradient.addColourStop("#0000ff", 1);
 *
 *      // Create an actor and assign the gradient fill style
 *      var actor = new b5.ArcActor();
 *      actor.x = -100;
 *      actor.w = 100;
 *      actor.radius = 100;
 *      actor.filled = true;
 *      actor.fill_style = gradient.createStyle(actor.w, actor.w, { x: 0, y: 0 }, { x: 1, y: 1 });;
 *      scene.addActor(actor);
 *
 * A colour stop is an object of the form {number, colour}
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Gradient
 * @constructor
 * @returns {b5.Gradient}                   The created Gradient
 * @param name {string}                     Name of gradient resource
 * @param colour_stops {string}             Optional list of colour stops
 *
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {object[]}                 stops           - Array of colour stops (internal)
 * @property {string}                   name            - Name of this gradient resource
 */
b5.Gradient = function(name, colour_stops)
{
    // Internal variables
    this.parent = null;                 // Parent container
    if (colour_stops !== undefined)
        this.stops = colour_stops;	    // Array of colour stops
    else
        this.stops = [];

    // Public variables
    this.name = name;					// Gradient name
};

/**
 * Adds a colour stop to the gradient
 * @param colour {object} A colour for example #ffffff
 * @param offset {number} Gradient offset position
 */
b5.Gradient.prototype.addColourStop = function(colour, offset)
{
    this.stops.push({c: colour, offs: offset});
};

/**
 * Returns the colour stop at the specified index for this gradient
 * @param index {number} Index of colour stop
 * @returns {Object} The colour stop
 */
b5.Gradient.prototype.getColourStop = function(index)
{
    return this.stops[index];
};

/**
 * Get the total number of colour stops in this gradient
 * @returns {Number} Total number of gradient stops
 */
b5.Gradient.prototype.getMaxStops = function()
{
    return this.stops.length;
};

/**
 * Removes this resource from its resource manager and destroys it
 */
b5.Gradient.prototype.destroy = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "brush");
};

/**
 * Creates a style that can be used as strokes and fills when rendering a {@link b5.Actor}
 * @param w {number} Width of gradient
 * @param h {number} Height of gradient
 * @param start {object} Start x,y position of gradient
 * @param end {object} End x,y position of gradient
 * @returns {object} Gradient fill style
 */
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

