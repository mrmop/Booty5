/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Geometry object represents a 2D geometric shape, used to provide visual shape that can be drawn by actors.
// Generally a Geometry should be added to either a scene or the global app's resources so that it can be managed by them.
//
function Geometry(name)
{
    // Public variables
    this.name = name;					// The geometries  name
    this.vertices = [];					// List of vertices that define the geometry
}

