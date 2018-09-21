/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Movement actions are actions that affect the position, speed or velocity of an object
//
// A_StopMove           - Stops an object from moving, pauses for a duration then exits
// A_Gravity            - Apply gravity to an object, does not exit
// A_Move               - Moves an object dx, dy units over the specified time then exits
// A_MoveTo             - Moves an object to a specific coordinate over the specified time then exits
// A_MoveWithSpeed      - Moves an object at a specific speed in its current direction over the specified time then exits
// A_Follow             - Follows a target object, does not exit
// A_LookAt             - Turns an object to face another object, does not exit
// A_FollowPath         - Follows a path, does not exit
// A_FollowPathVel      - Uses velocities to follow a path, does not exit
// A_LimitMove          - Limits movement of object to within a rectangular area, does not exit
//

/**
 * Action that stops an object from moving then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_StopMove
 * @constructor
 * @returns {b5.A_StopMove}             The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param stop_vx {boolean}             Stops x velocity
 * @param stop_vy {boolean}             Stops y velocity
 * @param stop_vr                       Stops rotational velocity
 * @param duration {number}             Amount of time to wait before stopping in seconds
 *
 */
b5.A_StopMove = function(target, stop_vx, stop_vy, stop_vr, duration)
{
    this.target = target;
    this.stop_vx = stop_vx;
    this.stop_vy = stop_vy;
    this.stop_vr = stop_vr;
    this.duration = duration;
};
b5.A_StopMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_StopMove.prototype.onTick = function()
{
    if (!((Date.now() - this.time) < (this.duration * 1000)))
    {
        var target = this.target;
        if (this.stop_vx)
            target.vx = 0;
        if (this.stop_vy)
            target.vy = 0;
        if (this.stop_vr)
            target.vr = 0;
        return false;
    }
    return true;
};
b5.ActionsRegister.register("StopMove", function(p) { return new b5.A_StopMove(p[1],p[2],p[3],p[4],p[5]); });

/**
 * Action that applies gravity to an object, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Gravity
 * @constructor
 * @returns {b5.A_Gravity}              The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param gravity_x {number}            Gravity strength on x-axis
 * @param gravity_y {number}            Gravity strength on y-axis
 *
 */
b5.A_Gravity = function(target, gravity_x, gravity_y)
{
    this.target = target;
    this.gravity_x = gravity_x;
    this.gravity_y = gravity_y;
};
b5.A_Gravity.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_Gravity.prototype.onTick = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    target.vx += this.gravity_x;
    target.vy += this.gravity_y;
    return false;
};
b5.ActionsRegister.register("Gravity", function(p) { return new b5.A_Gravity(p[1],p[2],p[3]); });

/**
 * Action that moves an object dx, dy units over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Move
 * @constructor
 * @returns {b5.A_Move      }           The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param dx {number}                   Distance to move on x axis (passing null will not affect the property)
 * @param dy {number}                   Distance to move on y axis (passing null will not affect the property)
 * @param duration {number}             Amount of time to move over in seconds
 *
 */
b5.A_Move = function(target, dx, dy, duration)
{
    this.target = target;
    this.dx = dx;
    this.dy = dy;
    this.duration = duration;
    this.x = target.x;
    this.y = target.y;
};
b5.A_Move.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    if (this.dx != null)
        target.vx = this.dx / this.duration;
    if (this.dy != null)
        target.vy = this.dy / this.duration;
    this.time = Date.now();
};
b5.A_Move.prototype.onTick = function()
{
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("Move", function(p) { return new b5.A_Move(p[1],p[2],p[3],p[4]); });

/**
 * Action that moves an object to a specific coordinate over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_MoveTo
 * @constructor
 * @returns {b5.A_MoveTo}               The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param x {number}                    Target x-axis position to move to (passing null will not affect the property)
 * @param y {number}                    Target y-axis position to move to (passing null will not affect the property)
 * @param duration {number}             Amount of time to move over in seconds
 * @param ease_x {number}               Easing function to use on x-axis (see {@link b5.Ease})
 * @param ease_y {number}               Easing function to use on y-axis (see {@link b5.Ease})
 *
 */
b5.A_MoveTo = function(target, x, y, duration, ease_x, ease_y)
{
    this.target = target;
    this.duration = duration;
    this.x = x;
    this.y = y;
    this.sx = target.x;
    this.sy = target.y;
    this.ease_x = ease_x || b5.Ease.linear;
    this.ease_y = ease_y || b5.Ease.linear;
};
b5.A_MoveTo.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    this.time = Date.now();
    this.sx = target.x;
    this.sy = target.y;
};
b5.A_MoveTo.prototype.onTick = function()
{
    var target = this.target;
    var dt = Date.now() - this.time;
    var d = dt / (this.duration * 1000);
    if (d > 1) d = 1;
    if (this.x != null)
        target._x = this.sx + (this.x - this.sx) * b5.Ease.easingFuncs[this.ease_x](d);
    if (this.y != null)
        target._y = this.sy + (this.y - this.sy) * b5.Ease.easingFuncs[this.ease_y](d);
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("MoveTo", function(p) { return new b5.A_MoveTo(p[1],p[2],p[3],p[4],p[5],p[6]); });

/**
 * Action that moves an object at specific speed in its current direction over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_MoveWithSpeed
 * @constructor
 * @returns {b5.A_MoveWithSpeed}        The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param speed {number}                Speed at which to move
 * @param duration {number}             Amount of time to move over in seconds
 * @param ease {number}                 Easing function used to increase to target speed (see {@link b5.Ease})
 *
 */
b5.A_MoveWithSpeed = function(target, speed, duration, ease)
{
    this.target = target;
    this.speed = speed;
    this.duration = duration;
    this.ease = ease;
};
b5.A_MoveWithSpeed.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
    if (this.duration === 0)
    {
        var target = this.target;
        var speed = this.speed;
        var dir = target.rotation;
        target.vx = speed * Math.sin(dir);
        target.vy = -speed * Math.cos(dir);
    }
};
b5.A_MoveWithSpeed.prototype.onTick = function()
{
    var dt = Date.now() - this.time;
    var dur = this.duration;
    if (dur !== 0)
    {
        var target = this.target;
        var dir = target.rotation;
        var d = dt / (dur * 1000);
        if (d > 1) d = 1;
        var speed = this.speed * b5.Ease.easingFuncs[this.ease](d);
        target.vx = speed * Math.sin(dir);
        target.vy = -speed * Math.cos(dir);
    }

    return (dt < (dur * 1000));
};
b5.ActionsRegister.register("MoveWithSpeed", function(p) { return new b5.A_MoveWithSpeed(p[1],p[2],p[3],p[4]); });

/**
 * Action that follows a target, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Follow
 * @constructor
 * @returns {b5.A_Follow}               The created action
 * @param source {string|b5.Actor}      Path to or instance of source object that will follow the target
 * @param target {string|b5.Actor}      Path to or instance of target object to follow
 * @param speed {number}                Speed at which to follow, larger values will catch up with target slower
 * @param distance {number}             Minimum distance allowed between source and target (squared)
 *
 */
b5.A_Follow = function(source, target, speed, distance)
{
    this.source = source;
    this.target = target;
    this.speed = speed;
    this.distance = distance;
};
b5.A_Follow.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.source = b5.Utils.resolveObject(this.source);
};
b5.A_Follow.prototype.onTick = function()
{
    var target = this.target;
    var source = this.source;
    var speed = this.speed;
    var dx = target.x - source.x;
    var dy = target.y - source.y;
    var d = dx * dx + dy * dy;
    if (d < this.distance)
    {
        source.vx = 0;
        source.vy = 0;
    }
    else
    {
        source.vx = dx / speed;
        source.vy = dy / speed;
    }
    return true;
};
b5.ActionsRegister.register("Follow", function(p) { return new b5.A_Follow(p[1],p[2],p[3],p[4]); });

/**
 * Action that turns an object to face another object, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_LookAt
 * @constructor
 * @returns {b5.A_LookAt}               The created action
 * @param source {string|b5.Actor}      Path to or instance of source object that will look at the target
 * @param target {string|b5.Actor}      Path to or instance of target object to look at
 * @param lower {number}                Optional lower limit angle
 * @param upper {number}                Optional upper limit angle
 *
 */
b5.A_LookAt = function(source, target, lower, upper)
{
    this.source = source;
    this.target = target;
    this.lower = lower;
    this.upper = upper;
};
b5.A_LookAt.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.source = b5.Utils.resolveObject(this.source);
};
b5.A_LookAt.prototype.onTick = function()
{
    var target = this.target;
    var source = this.source;
    var angle = Math.atan2(target.y - source.y, target.x - source.x) + Math.PI / 2;
    var lower = this.lower;
    if (lower !== undefined && angle < lower)
        angle = lower;
    var upper = this.upper;
    if (upper !== undefined && angle > upper)
        angle = upper;
    source._rotation = angle;
    return true;
};
b5.ActionsRegister.register("LookAt", function(p) { return new b5.A_LookAt(p[1],p[2],p[3],p[4]); });

/**
 * Action that causes an object follows a path, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_FollowPath
 * @constructor
 * @returns {b5.A_FollowPath}           The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param path {object[]}               Path to follow, array of x,y values that define the path, e.g. [x1,y1,x2,y2,etc..]
 * @param start {number}                Distance to start along the path
 * @param speed {number}                Speed at which to travel down the path
 * @param angle {boolean}               If set to true then angle will adjust to path direction
 *
 */
b5.A_FollowPath = function(target, path, start, speed, angle)
{
    this.target = target;
    this.path = path;
    this.distance = start;
    this.speed = speed;
    this.angle = angle;

    // Calculate distances between each node
    var count = path.length >> 1;
    var total = 0;
    this.distances = [];
    this.angles = [];
    this.distances[0] = 0;
    for (var t = 1; t < count; t++)
    {
        var dx = path[t << 1] - path[(t - 1) << 1];
        var dy = path[(t << 1) + 1] - path[((t - 1) << 1) + 1];
        total += Math.sqrt(dx * dx + dy * dy);
        this.distances[t] = total;
        if (this.angle)
            this.angles[t - 1] = Math.atan2(dy, dx) + Math.PI / 2;
    }
};
b5.A_FollowPath.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_FollowPath.prototype.onTick = function()
{
    var target = this.target;

    // Find path node we are currently on
    var path = this.path;
    var count = path.length >> 1;
    var distances = this.distances;
    var distance = this.distance + this.speed;
    var total_dist = distances[count - 1];
    while (distance >= total_dist)
        distance -= total_dist;
    while (distance < 0)
        distance += total_dist;
    this.distance = distance;
    for (var t = 0; t < count; t++)
    {
        if (distance < distances[t])
        {
            var t2 = t - 1;
            if (t2 >= count)
                t2 = 0;
            var x1 = path[t2 << 1];
            var x2 = path[t << 1];
            var y1 = path[(t2 << 1) + 1];
            var y2 = path[(t << 1) + 1];
            var d = (distance - distances[t2]) / (distances[t] - distances[t2]);
            target._x = x1 + (x2 - x1) * d;
            target._y = y1 + (y2 - y1) * d;
            if (this.angle)
                target._rotation = this.angles[t2];
            break;
        }
    }

    return true;
};
b5.ActionsRegister.register("FollowPath", function(p) { return new b5.A_FollowPath(p[1],p[2],p[3],p[4],p[5]); });

/**
 * Action that causes an object to follow a path using velocity, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_FollowPathVel
 * @constructor
 * @returns {b5.A_FollowPathVel}        The created action
 * @param target {string|b5.Actor}      Path to or instance of target object
 * @param path {object[]}               Path to follow, array of x,y values that define the path, e.g. [x1,y1,x2,y2,etc..]
 * @param start {number}                Distance to start along the path
 * @param speed {number}                Speed at which to travel down the path
 * @param catchup_speed {number}        Speed at which object catches up with path target modes
 * @param angle {boolean}               If set to true then angle will adjust to path direction
 *
 */
b5.A_FollowPathVel = function(target, path, start, speed, catchup_speed, angle)
{
    this.target = target;
    this.path = path;
    this.distance = start;
    this.speed = speed;
    this.angle = angle;
    this.catchup_speed = catchup_speed;

    // Calculate distances between each node
    var count = path.length >> 1;
    var total = 0;
    this.distances = [];
    this.distances[0] = 0;
    for (var t = 1; t < count; t++)
    {
        var dx = path[t << 1] - path[(t - 1) << 1];
        var dy = path[(t << 1) + 1] - path[((t - 1) << 1) + 1];
        total += Math.sqrt(dx * dx + dy * dy);
        this.distances[t] = total;
    }
};
b5.A_FollowPathVel.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_FollowPathVel.prototype.onTick = function()
{
    var target = this.target;

    // Find path node we are currently on
    var path = this.path;
    var count = path.length >> 1;
    var distances = this.distances;
    var distance = this.distance + this.speed;
    var total_dist = distances[count - 1];
    while (distance >= total_dist)
        distance -= total_dist;
    while (distance < 0)
        distance += total_dist;
    this.distance = distance;
    for (var t = 0; t < count; t++)
    {
        if (distance < distances[t])
        {
            var t2 = t - 1;
            if (t2 >= count)
                t2 = 0;
            var x1 = path[t2 << 1];
            var x2 = path[t << 1];
            var y1 = path[(t2 << 1) + 1];
            var y2 = path[(t << 1) + 1];
            var d = (distance - distances[t2]) / (distances[t] - distances[t2]);
            var catchup = this.catchup_speed;
            target.vx = ((x1 + (x2 - x1) * d) - target.x) * catchup;
            target.vy = ((y1 + (y2 - y1) * d) - target.y) * catchup;
            if (this.angle)
                target._rotation = Math.atan2(target.vy, target.vx) + Math.PI / 2;
            break;
        }
    }

    return true;
};
b5.ActionsRegister.register("FollowPathVel", function(p) { return new b5.A_FollowPathVel(p[1],p[2],p[3],p[4],p[5],p[6]); });

/**
 * Action that limits movement of object to within a rectangular area, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_LimitMove
 * @constructor
 * @returns {b5.A_LimitMove}            The created action
 * @param target {string|b5.Actor}      Path to or instance of target object that will be limited
 * @param area {number[]}               Rectangular area limit [x,y,w,h]
 * @param hit {string}                  Action to perform when object oversteps boundary (bounce, wrap, stop)
 * @param bounce {number}               Bounce factor
 *
 */
b5.A_LimitMove = function(target, area, hit, bounce)
{
    this.target = target;
    this.area = area;
    if (hit === "bounce")
        this.hit = 0;
    else if (hit === "stop")
        this.hit = 1;
    else if (hit === "wrap")
        this.hit = 2;
    this.bounce = bounce;
};
b5.A_LimitMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_LimitMove.prototype.onTick = function()
{
    var target = this.target;
    var x = target.x;
    var y = target.y;
    var hit = this.hit;
    var area = this.area;
    var bounce = this.bounce;
    if (area[2] !== 0)
    {
        var l = area[0];
        var r = l + area[2];
        if (x < l)
        {
            if (hit === 0)
                target.vx = -target.vx * bounce;
            else if (hit === 1)
                target.vx = 0;
            else if (hit === 2)
                target._x = r;
        }
        else
        if (x > r)
        {
            if (hit === 0)
                target.vx = -target.vx * bounce;
            else if (hit === 1)
                target.vx = 0;
            else if (hit === 2)
                target._x = l;
        }
    }
    if (area[3] !== 0)
    {
        var t = area[1];
        var b = t + area[3];
        if (y < t)
        {
            if (hit === 0)
                target.vy = -target.vy * bounce;
            else if (hit === 1)
                target.vy = 0;
            else if (hit === 2)
                target._y = b;
        }
        else
        if (y > b)
        {
            if (hit === 0)
                target.vy = -target.vy * bounce;
            else if (hit === 1)
                target.vy = 0;
            else if (hit === 2)
                target._y = t;
        }
    }
    return false;
};
b5.ActionsRegister.register("LimitMove", function(p) { return new b5.A_LimitMove(p[1],p[2],p[3],p[4]); });




