/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Shape object represents a 2D geometric shape. A shape can be used to:
 *
 * - Provide physical shapes that can be attached as fixtures to {@link b5.Actor}s changing their shape in the physics system
 * - Provide visual shape to actors affecting how they are rendered
 * - Provide clipping regions for {@link b4.Scene}s and {@link b5.Actor}s that support child clipping
 *
 * Generally a shape should be added to either a {@link b5.Scene} or the global {@link b5.App}'s resources so that it can be managed by them.
 *
 * Example showing how to add a clipping shape to a scene
 *
 *      var clipper = new b5.Shape();       // Create a circle shape
 *      clipper.type = b5.Shape.TypeCircle;
 *      clipper.width = 100;
 *      scene.clip_shape = clipper;      // Assign the shape as the scenes clip shape
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Shape
 * @constructor
 * @returns {b5.Shape}                      The created shape
 * @param name {string}                     Name of shape resource
 *
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {string}                   name            - Name of this image atlas resource
 * @property {number}                   type            - Type of shape
 * @property {number}                   width           - Width of shape (or radius if circle)
 * @property {number}                   height          - Height of shape
 * @property {number[]}                 vertices        - Array of vertices for a polygon type shape in the form [x1,y1,x2,y2,....]
 * @property {object[]}                 convexVertices  - If the shape represented by vertices is concave then this property contains a list of convex polygons, each element is an array of vertices
 */
b5.Shape = function(name)
{
    // Internal variables
    this.parent = null;                 // Parent container

    // Public variables
    this.name = name;					// The shapes name
    this.type = b5.Shape.TypeBox;		// Type of shape
    this.width = 0;						// Width of shape (or radius if circle)
    this.height = 0;					// Height of shape
    this.vertices = [];					// Array of vertices for a polygon type shape in the form [x1,y1,x2,y2,....]
    this.convexVertices = [];           // If the shape represented by vertices is concave then this property contains a list of convex polygons, each element is an array of vertices
};

/**
 * Shape is of type box
 * @type {number}
 */
b5.Shape.TypeBox = 0;
/**
 * Shape is of type circle
 * @type {number}
 */
b5.Shape.TypeCircle = 1;
/**
 * Shape is of type polygon
 * @type {number}
 */
b5.Shape.TypePolygon = 2;

/**
 * Converts shape name to shape value
 * @param type_name {string}    Name of shape
 * @returns {number}            Shape type
 */
b5.Shape.prototype.typeToConst = function(type_name)
{
    if (shape.type === "polygon")
        return b5.Shape.TypePolygon;
    else
    if (shape.type === "circle")
        return b5.Shape.TypeCircle;

    return b5.Shape.TypeBox;
};

/**
 * Removes the shape from the scene / app and destroys it
 */
b5.Shape.prototype.remove = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "shape");
};

