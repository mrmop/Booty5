/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Easing functions, used by the animation system to ease between key frames
//
b5.Ease = function Ease() {};
b5.Ease.linear = 0;
b5.Ease.quadin = 1;
b5.Ease.quadout = 2;
b5.Ease.cubicin = 3;
b5.Ease.cubicout = 4;
b5.Ease.quartin = 5;
b5.Ease.quartout = 6;
b5.Ease.sin = 7;

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
        return Math.sin(d * Math.PI / 2);    // Sinusoidal
    },
];
