/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Material represents a physical material and is assigned to {@link b5.Actor} fixtures which modifies their behaviour
 * within the physics engine. Generally a material should be added to either a {@link b5.Scene} or the global {@link b5.App}'s
 * resources so that it can be managed by them.
 *
 * Example showing how to create a physics material
 *
 *      var material = new b5.Material("floor");
 *      material.type = "static";
 *      material.density = 1;
 *      material.friction = 0.1;
 *      material.restitution = 0.5;
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.Material
 * @constructor
 * @returns {b5.Material}                   The created material
 * @param name {string}                     Name of material resource
 *
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {string}                   name            - Name of this image atlas resource
 * @property {string}                   type            - Type of physics material (static, dynamic or kinematic)
 * @property {number}                   density         - Material density, higher values make for heavier objects
 * @property {number}                   friction        - Material friction, lower values make objects more slippery
 * @property {number}                   restitution     - Material restitution, lower values make he object less bouncy
 * @property {number}                   gravity_scale   - Gravity scale, lower values lessen the affects of gravity on the object
 * @property {boolean}                  fixed_rotation  - Set to true to prevent objects from rotating
 * @property {boolean}                  is_bullet       - Set to true if fast moving object
 */
b5.Material = function(name)
{
    // Internal variables
    this.parent = null;                 // Parent container

    // Public variables
    this.name = name;					// The materials name
    this.type = "static";				// Type of material (can be static, dynamic or kinematic)
    this.density = 1;					// Material density, higher values make for heavier objects
    this.friction = 0.1;				// Material friction, lower values make objects more slippery
    this.restitution = 0.1;				// Material restitution, lower values make he object less bouncy
    this.gravity_scale = 1;				// Gravity scale, lower values lessen the affects of gravity on the object
    this.fixed_rotation = false;		// Set to true to prevent objects from rotating
    this.is_bullet = false;				// Set to true if fast moving object
};

/**
 * Removes the material from the scene / app and destroys it
 */
b5.Material.prototype.destroy = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "material");
};

