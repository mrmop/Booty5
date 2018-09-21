/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Easing functions, used by the animation system to ease between key frames
//
/**
 * Provides easing functions, used by the animation system to ease between key frames
 *
 * @class b5.Ease
 * @constructor
 *
 */
b5.Ease = function Ease() {};
/**
 * Linear easing
 * @type {number}
 */
b5.Ease.linear = 0;
/**
 * Quadratic in easing
 * @type {number}
 */
b5.Ease.quadin = 1;
/**
 * Quadratic out easing
 * @type {number}
 */
b5.Ease.quadout = 2;
/**
 * Cubic in easing
 * @type {number}
 */
b5.Ease.cubicin = 3;
/**
 * Cubic out easing
 * @type {number}
 */
b5.Ease.cubicout = 4;
/**
 * Quartic in easing
 * @type {number}
 */
b5.Ease.quartin = 5;
/**
 * Quartic out easing
 * @type {number}
 */
b5.Ease.quartout = 6;
/**
 * Sin In easing
 * @type {number}
 */
b5.Ease.sin = 7;    // Backward compatibility
b5.Ease.sinin = 7;
/**
 * Sin Out easing
 * @type {number}
 */
b5.Ease.sinout = 8;
/**
 * Sin InOut easing
 * @type {number}
 */
b5.Ease.sininout = 9;
/**
 * Quadratic inout easing
 * @type {number}
 */
b5.Ease.quadinout = 10;
/**
 * Cubic inout easing
 * @type {number}
 */
b5.Ease.cubicinout = 11;
/**
 * Quartic inout easing
 * @type {number}
 */
b5.Ease.quarticinout = 12;
/**
 * Bounce in easing
 * @type {number}
 */
b5.Ease.bouncein = 13;
/**
 * Bounce out easing
 * @type {number}
 */
b5.Ease.bounceout = 14;
/**
 * Bounce inout easing
 * @type {number}
 */
b5.Ease.bounceinout = 15;
/**
 * Back in easing
 * @type {number}
 */
b5.Ease.backin = 16;
/**
 * Back out easing
 * @type {number}
 */
b5.Ease.backout = 17;
/**
 * Back inout easing
 * @type {number}
 */
b5.Ease.backinout = 18;
/**
 * Circ in easing
 * @type {number}
 */
b5.Ease.circin = 19;
/**
 * Circ  out easing
 * @type {number}
 */
b5.Ease.circout = 20;
/**
 * Circ  inout easing
 * @type {number}
 */
b5.Ease.circinout = 21;
/**
 * Exp in easing
 * @type {number}
 */
b5.Ease.expin = 22;
/**
 * Exp out easing
 * @type {number}
 */
b5.Ease.expout = 23;
/**
 * Exp inout easing
 * @type {number}
 */
b5.Ease.expinout = 24;

b5.Ease.easingFuncs = [
    function(d)
    {
        return d;                       // Linear
    },
    function(d)
    {
        return d * d;                   // Quadratic in
    },
    function(d)
    {
        return d * (2 - d);             // Quadratic out
    },
    function(d)
    {
        return d * d * d;               // Cubic in
    },
    function(d)
    {
        d -= 1;
        return d * d * d + 1;           // Cubic out
    },
    function(d)
    {
        return d * d * d * d;           // Quartic in
    },
    function(d)
    {
        d -= 1;
        return -(d * d * d * d - 1);    // Quartic out
    },
    function(d)
    {
        return 1 - Math.cos(d * Math.PI / 2);    // Sin In
    },
    function(d)
    {
        return Math.sin(d * Math.PI / 2);    // Sin Out
    },
    function(d)
    {
        return 0.5 * (1 - Math.cos(Math.PI * d));    // Sin InOut
    },
    function(d)
    {
        return (d < 0.5) ? 2 * d * d : -1 + (4 - 2 * d) * d;                   // Quadratic in / out
    },
    function(d)
    {
        return (d < 0.5) ? 4 * d * d * d : (d - 1) * (2 * d - 2) * (2 * d - 2) + 1; // Cubic in / out
    },
    function(d)
    {
        return (d < 0.5) ?  8 * d * d * d * d : 1 - 8 * (--d) * d * d * d;      // Quartic in / out
    },
    function(d)
    {
        return 1 - b5.Ease.easingFuncs[b5.Ease.bounceout](1 - d);        // Bounce in
    },
    function(d)
    {
        if (d < (1 / 2.75))
        {
            return 7.5625 * d * d;
        }
        else if (d < (2 / 2.75))
        {
            return 7.5625 * (d -= (1.5 / 2.75)) * d + 0.75;
        }
        else if (d < (2.5 / 2.75))
        {
            return 7.5625 * (d -= (2.25 / 2.75)) * d + 0.9375;
        }
        else
        {
            return 7.5625 * (d -= (2.625 / 2.75)) * d + 0.984375;
        }
    },
    function(d)
    {
        if (d < 0.5)                                // Bounce in / out
            return b5.Ease.easingFuncs[b5.Ease.bounceout](d * 2) * 0.5;
        else
            return b5.Ease.easingFuncs[b5.Ease.bounceout](d * 2 - 1) * 0.5 + 0.5;
    },
    function(d)
    {
        var s = 1.70158;
        return d * d * ((s + 1) * d - s);           // Back in
    },
    function(d)
    {
        var s = 1.70158;
        return --d * d * ((s + 1) * d + s) + 1;     // Back out
    },
    function(d)
    {
        var s = 1.70158 * 1.525;                    // Back in / out
        if ((d *= 2) < 1)
            d = 0.5 * (d * d * ((s + 1) * d - s));
        else
            d = 0.5 * ((d -= 2) * d * ((s + 1) * d + s) + 2);
    },
    function(d)
    {
        return 1 - Math.sqrt(1 - d * d);            // Circ in
    },
    function(d)
    {
        return Math.sqrt(1 - (--d * d));            // Circ out
    },
    function(d)                                     // Circ in / out
    {
        d *= 2;
        if (d < 1)
            d = -0.5 * (Math.sqrt(1 - d * d) - 1);
        else
            d = 0.5 * (Math.sqrt(1 - (d -= 2) * d) + 1);
    },
    function(d)
    {
        return (d == 0) ? 0 : Math.pow(1024, d - 1);    // Exp in
    },
    function(d)
    {
        return (d == 1) ? d : 1 - Math.pow(2, -10 * d); // Exp out
    },
    function(d)
    {
        if (d == 0)                                     // Exp in / out
            return 0;
        if (d == 1)
            return 1;
        if ((d *= 2) < 1)
            return 0.5 * Math.pow(1024, d - 1);
        else
            return 0.5 * (-Math.pow(2, -10 * (d - 1)) + 2);
    },
];
