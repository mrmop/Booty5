/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Physics actions are that modify the physical state of actors
//
// A_SetLinearVelocity          - Sets the linear velocity of an actors body for a specified period of time
// A_SetAngularVelocity         - Sets the angular velocity of an actors body for a specified period of time
// A_ApplyForce                 - Apply a force to actors body for a specified period of time
// A_ApplyImpulse               - Apply an impulse to actors body
// A_ApplyTorque                - Apply a torque to actors body for a specified period of time

/**
 * Action that sets the linear velocity of an actors body for a duration then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_SetLinearVelocity
 * @constructor
 * @returns {b5.A_SetLinearVelocity}    The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param vx {number}                   x-axis velocity
 * @param vy {number}                   y-axis velocity
 * @param duration {number}             Duration of action
 *
 */
b5.A_SetLinearVelocity = function(target, vx, vy, duration)
{
    this.target = target;
    this.vx = vx;
    this.vy = vy;
    this.duration = duration;
};
b5.A_SetLinearVelocity.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_SetLinearVelocity.prototype.onTick = function()
{
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        body.SetAwake(true);
        body.SetLinearVelocity(new b2Vec2(this.vx, this.vy));
    }
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("SetLinearVelocity", function(p) { return new b5.A_SetLinearVelocity(p[1], p[2], p[3], p[4]); });

/**
 * Action that sets the angular velocity of an actors body for a duration then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_SetAngularVelocity
 * @constructor
 * @returns {b5.A_SetAngularVelocity}   The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param vr {number}                   Angular velocity
 * @param duration {number}             Duration of action
 *
 */
b5.A_SetAngularVelocity = function(target, vr, duration)
{
    this.target = target;
    this.vr = vr;
    this.duration = duration;
};
b5.A_SetAngularVelocity.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_SetAngularVelocity.prototype.onTick = function()
{
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        body.SetAwake(true);
        body.SetAngularVelocity(this.vr);
    }
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("SetAngularVelocity", function(p) { return new b5.A_SetAngularVelocity(p[1], p[2], p[3]); });

/**
 * Action that applies force to an object over a period of time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ApplyForce
 * @constructor
 * @returns {b5.A_ApplyForce}           The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param fx {number}                   x-axis force
 * @param fy {number}                   y-axis force
 * @param dx {number}                   x-axis offset to apply force
 * @param dy {number}                   y-axis offset to apply force
 * @param duration {number}             Duration of action
 *
 */
b5.A_ApplyForce = function(target, fx, fy, dx, dy, duration)
{
    this.target = target;
    this.fx = fx;
    this.fy = fy;
    this.dx = dx;
    this.dy = dy;
    this.duration = duration;
};
b5.A_ApplyForce.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_ApplyForce.prototype.onTick = function()
{
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        var ws = target.scene.world_scale;
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        body.SetAwake(true);
        var pos = body.GetWorldPoint(new b2Vec2(this.dx / ws, this.dy / ws));
        body.ApplyForce(new b2Vec2(this.fx, this.fy), pos);
    }
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("ApplyForce", function(p) { return new b5.A_ApplyForce(p[1], p[2], p[3], p[4], p[5], p[6]); });

/**
 * Action that applies an impulse to an object then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ApplyImpulse
 * @constructor
 * @returns {b5.A_ApplyImpulse}         The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param ix {number}                   x-axis impulse
 * @param iy {number}                   y-axis impulse
 * @param dx {number}                   x-axis offset to apply force
 * @param dy {number}                   y-axis offset to apply force
 *
 */
b5.A_ApplyImpulse = function(target, ix, iy, dx, dy)
{
    this.target = target;
    this.ix = ix;
    this.iy = iy;
    this.dx = dx;
    this.dy = dy;
};
b5.A_ApplyImpulse.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        var ws = target.scene.world_scale;
        var b2Vec2 = Box2D.Common.Math.b2Vec2;
        body.SetAwake(true);
        var pos = body.GetWorldPoint(new b2Vec2(this.dx / ws, this.dy / ws));
        body.ApplyImpulse(new b2Vec2(this.ix, this.iy), pos);
    }
};
b5.ActionsRegister.register("ApplyImpulse", function(p) { return new b5.A_ApplyImpulse(p[1], p[2], p[2], p[3], p[4]); });

/**
 * Action that applies a torque to an object over a period of time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ApplyTorque
 * @constructor
 * @returns {b5.A_ApplyTorque}          The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be affected
 * @param torque {number}               Amount of Torque to apply
 * @param duration {number}             Duration of action
 *
 */
b5.A_ApplyTorque = function(target, torque, duration)
{
    this.target = target;
    this.torque = torque;
    this.duration = duration;
};
b5.A_ApplyTorque.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_ApplyTorque.prototype.onTick = function()
{
    var target = this.target;
    var body = target.body;
    if (body !== null)
    {
        body.SetAwake(true);
        body.ApplyTorque(this.torque);
    }
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("ApplyTorque", function(p) { return new b5.A_ApplyTorque(p[1], p[2], p[3]); });
