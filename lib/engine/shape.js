/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// A Shape object represents a 2D geometric shape, used to provide physical shapes that can be attached as fixtures to
// actors changing their shape in the physics system. Generally a Shape should be added to either a scene or the global
// app's resources so that it can be managed by them.
//
//// Example showing how to add a clipping shape to a scene
// var clipper = new Shape();       // Create a circle shape
// clipper.type = Shape.TypeCircle;
// clipper.width = 100;
// scene.clip_shape = clipper;      // Assign the shape as the scenes clip shape
//

function Shape(name)
{
    // Public variables
    this.name = name;					// The shapes name
    this.type = Shape.TypeBox;		    // Type of shape
    this.width = 0;						// Width of shape (or radius if circle)
    this.height = 0;					// Height of shape
    this.vertices = [];					// Array of vertices for a polygon type shape in the form [x1,y1,x2,y2,....]
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