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

//
// The A_SetLinearVelocity action sets the linear velocity of an actors body for a duration then exits
// - target - Path to or instance of actor object that will be changed
// - vx - x-axis velocity
// - vy - y-axis velocity
// - duration - Duration of action
//
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

//
// The A_SetAngularVelocity action sets the angular velocity of an actors body for a duration then exits
// - target - Path to or instance of actor object that will be changed
// - vr - Angular velocity
// - duration - Duration of action
//
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

//
// The A_ApplyForce action applies force to an object over a period of time then exits
// - target - Path to or instance of actor object that will be changed
// - fx - x-axis force
// - fy - y-axis force
// - dx - x-axis offset to apply force
// - dy - y-axis offset to apply force
// - duration - Duration of action
//
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

//
// The A_ApplyImpulse action applies an impulse to an object then exits
// - target - Path to or instance of actor object that will be changed
// - ix - x-axis impulse
// - iy - y-axis impulse
// - dx - x-axis offset to apply force
// - dy - y-axis offset to apply force
//
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

//
// The A_ApplyTorque action applies torque to an object over a period of time then exits
// - target - Path to or instance of actor object that will be changed
// - torque - Torque
// - duration - Duration of action
//
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
