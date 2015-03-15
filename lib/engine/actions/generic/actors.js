/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Actor actions are actions that create / modify actors
//
// A_CreateExplosion    - Creates an explosion particle system actor then exits
// A_CreatePlume        - Creates a plume particle system actor then exits

//
// The A_CreateExplosion action creates a particle system actor then exits
// - container - Path to scene or actor or instance of scene or actor that will contain the generated particle actor
// - count - Total number of particles to create
// - type - The actor type of each particle created, for example ArcActor
// - duration - The total duration of the particle system in seconds
// - speed - The speed at which the particles blow apart
// - spin_speed - The speed at which particles spin
// - rate - Rate at which particles are created
// - damping - A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
// - properties - Object that contains property / value pairs that will be set to particles when they are created (e.g. {"vx":0,"vy":0})
// - actor - If provided then the generated particle actor will be placed at the same position and orientation as this actor, actor can be an instance of an actor or a path to an actor
//
b5.A_CreateExplosion = function(container, count, type, duration, speed, spin_speed, rate, damping, properties, actor)
{
    this.container = container;
    this.actor = actor;
    this.count = count;
    this.type = type;
    this.duration = duration;
    this.speed = speed;
    this.spin_speed = spin_speed;
    this.rate = rate;
    this.damping = damping;
    this.properties = properties;
};
b5.A_CreateExplosion.prototype.onInit = function()
{
    this.container = b5.Utils.resolveObject(this.container);
    this.actor = b5.Utils.resolveObject(this.actor);
    var actor = new b5.ParticleActor();
    this.container.addActor(actor);
    actor.generateExplosion(this.count, this.type, this.duration, this.speed, this.spin_speed, this.rate, this.damping, this.properties);
    if (this.actor !== null)
    {
        actor._x = this.actor.x;
        actor._y = this.actor.y;
        actor._rotation = this.actor.rotation;
    }
};
b5.ActionsRegister.register("CreateExplosion", function(p) { return new b5.A_CreateExplosion(p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],p[10]); });

//
// The A_CreatePlume action creates a particle system actor then exits
// - container - Path to scene or actor or instance of scene or actor that will contain the generated particle actor
// - count - Total number of particles to create
// - type - The actor type of each particle created, for example ArcActor
// - duration - The total duration of the particle system in seconds
// - speed - The speed at which the particles rise
// - spin_speed - The speed at which particles spin
// - rate - Rate at which particles are created
// - damping - A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
// - properties - Object that contains property / value pairs that will be set to particles when they are created (e.g. {"vx":0,"vy":0})
// - actor - If provided then the generated particle actor will be placed at the same position and orientation as this actor, actor can be an instance of an actor or a path to an actor
//
b5.A_CreatePlume = function(container, count, type, duration, speed, spin_speed, rate, damping, properties, actor)
{
    this.container = container;
    this.actor = actor;
    this.count = count;
    this.type = type;
    this.duration = duration;
    this.speed = speed;
    this.spin_speed = spin_speed;
    this.rate = rate;
    this.damping = damping;
    this.properties = properties;
};
b5.A_CreatePlume.prototype.onInit = function()
{
    this.container = b5.Utils.resolveObject(this.container);
    this.actor = b5.Utils.resolveObject(this.actor);
    var actor = new b5.ParticleActor();
    this.container.addActor(actor);
    actor.generatePlume(this.count, this.type, this.duration, this.speed, this.spin_speed, this.rate, this.damping, this.properties);
    if (this.actor !== null)
    {
        actor._x = this.actor.x;
        actor._y = this.actor.y;
        actor._rotation = this.actor.rotation;
    }
};
b5.ActionsRegister.register("CreatePlume", function(p) { return new b5.A_CreatePlume(p[1],p[2],p[3],p[4],p[5],p[6],p[7],p[8],p[9],p[10]); });

