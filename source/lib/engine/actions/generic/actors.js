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

/**
 * Action that creates an explosion particle system actor then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CreateExplosion
 * @constructor
 * @returns {b5.A_CreateExplosion} The created action
 * @param container {string|b5.Scene|b5.Actor}     Path to scene / actor or instance of scene / actor that will contain the generated particle actor
 * @param count {number}                    Total number of particles to create
 * @param type {object|string}              The actor type of each particle created, for example Actor, ArcActor, LabelActor, PolygonActor etc
 * @param duration {number}                 The total duration of the particle system in seconds
 * @param speed {number}                    The speed at which the particles blow apart
 * @param spin_speed {number}               The speed at which particles spin
 * @param rate {number}                     Rate at which particles are created
 * @param damping {number}                  A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
 * @param properties {object}               Object that contains property / value pairs that will be set to particles when they are created (e.g. {"vx":0,"vy":0})
 * @param actor {b5.Actor}                  If provided then the generated particle actor will be placed at the same position and orientation as this actor, actor can be an instance of an actor or a path to an actor
 *
 */
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

/**
 * Action that creates a plume particle system actor then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CreatePlume
 * @constructor
 * @returns {b5.A_CreatePlume} The created action
 * @param container {string|b5.Scene|b5.Actor}     Path to scene / actor or instance of scene / actor that will contain the generated particle actor
 * @param count {number}                    Total number of particles to create
 * @param type {object|string}              The actor type of each particle created, for example Actor, ArcActor, LabelActor, PolygonActor etc
 * @param duration {number}                 The total duration of the particle system in seconds
 * @param speed {number}                    The speed at which the particles blow apart
 * @param spin_speed {number}               The speed at which particles spin
 * @param rate {number}                     Rate at which particles are created
 * @param damping {number}                  A factor to reduce velocity of particles each frame, values greater than 1 will increase velocities
 * @param properties {object}               Object that contains property / value pairs that will be set to particles when they are created (e.g. {"vx":0,"vy":0})
 * @param actor {b5.Actor}                  If provided then the generated particle actor will be placed at the same position and orientation as this actor, actor can be an instance of an actor or a path to an actor
 *
 */
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

