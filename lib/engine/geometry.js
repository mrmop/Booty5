/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Geometry is a 2dD geometric shape, used to provide visual shape to actors
//
function Geometry(name)
{
	// Public variables
	this.name = name;					// The geometries  name
	this.vertices = [];					// List of vertices that define the geometry
}

