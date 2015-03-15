/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A Material represents a physical material and is assigned to Actor fixtures which modifies their behaviour within
// the physics engine, Generally a material should be added to either a scene or the global app's resources so that
// it can be managed by them.
//
//// Example showing how to create a physics material
// var material = new b5.Material("floor");
// material.type = "static";
// material.density = 1;
// material.friction = 0.1;
// material.restitution = 0.5;
b5.Material = function(name)
{
    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// The materials name
    this.type = "static";				// Type of material (can be static, dynamic or kinematic)
    this.density = 1;					// Material density, higher values make for heavier objects
    this.friction = 0.1;				// Material friction, lower values make objects more slippery
    this.restitution = 0.1;				// Material restitution, lower values make he object more bouncy
    this.gravity_scale = 1;				// Gravity scale, lower values lessen the affects of gravity on the object
    this.fixed_rotation = false;		// Set to true to prevent objects from rotating
    this.is_bullet = false;				// Set to true if fast moving object
};

b5.Material.prototype.destroy = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "material");
};

