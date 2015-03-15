/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A Shape object represents a 2D geometric shape, used to:
// a) Provide physical shapes that can be attached as fixtures to actors changing their shape in the physics system. 
// b) Provide visual shape to actors
// c) Provide clipping regions for scenes and actors that support child clipping
// Generally a Shape should be added to either a scene or the global app's resources so that it can be managed by them.
//
//// Example showing how to add a clipping shape to a scene
// var clipper = new b5.Shape();       // Create a circle shape
// clipper.type = b5.Shape.TypeCircle;
// clipper.width = 100;
// scene.clip_shape = clipper;      // Assign the shape as the scenes clip shape
//

b5.Shape = function(name)
{
    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// The shapes name
    this.type = b5.Shape.TypeBox;		 // Type of shape
    this.width = 0;						// Width of shape (or radius if circle)
    this.height = 0;					// Height of shape
    this.vertices = [];					// Array of vertices for a polygon type shape in the form [x1,y1,x2,y2,....]
    this.convexVertices = [];           // If the shape represented by vertices is concave then this property contains a list of convex polygons, each element is an array of vertices
};
b5.Shape.TypeBox = 0;
b5.Shape.TypeCircle = 1;
b5.Shape.TypePolygon = 2;

b5.Shape.prototype.typeToConst = function(type_name)
{
    if (shape.type === "polygon")
        return b5.Shape.TypePolygon;
    else
    if (shape.type === "circle")
        return b5.Shape.TypeCircle;

    return b5.Shape.TypeBox;
};

b5.Shape.prototype.remove = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "shape");
};

