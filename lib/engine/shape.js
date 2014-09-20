/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Shape represents a custom Box2D physics shape
//
function Shape(name)
{
	// Public variables
	this.name = name;					// The shapes name
	this.type = Shape.TypeBox;		    // Type of shape
	this.width = 0;						// Width of shape (or radius if circle)
	this.height = 0;					// Height of shape
	this.vertices = [];					// List of vertices for a polygon type
}
Shape.TypeBox = 0;
Shape.TypeCircle = 1;
Shape.TypePolygon = 2;

Shape.prototype.typeToConst = function(type_name)
{
    if (shape.type == "polygon")
        return Shape.TypePolygon;
    else
    if (shape.type == "circle")
        return Shape.TypeCircle;

    return Shape.TypeBox;
}