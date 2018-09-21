/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Camera actions are actions that affect the scene camera
//
// A_CamStopMove           - Stops a camera from moving, pauses for a duration then exits
// A_CamGravity            - Apply gravity to a camera, does not exit
// A_CamMove               - Moves a camera dx, dy units over the specified time then exits
// A_CamMoveTo             - Moves a camera to a specific coordinate over the specified time then exits
// A_CamFollow             - Camera follows a target object, does not exit
// A_CamFollowPath         - Camera follows a path, does not exit
// A_CamFollowPathVel      - Uses velocities to make camera follow a path, does not exit
// A_CamLimitMove          - Limits movement of camera to within a rectangular area, does not exit
//

/**
 * Action that stops a scene camera from moving then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamStopMove
 * @constructor
 * @returns {b5.A_CamStopMove}          The created action
 * @param target {string|b5.Scene}      Path to or instance of target scene that contains camera
 * @param stop_vx {boolean}             Stops x velocity
 * @param stop_vy {boolean}             Stops y velocity
 * @param duration {number}             Amount of time to wait before stopping in seconds
 *
 */
b5.A_CamStopMove = function(target, stop_vx, stop_vy, duration)
{
    this.target = target;
    this.stop_vx = stop_vx;
    this.stop_vy = stop_vy;
    this.duration = duration;
};
b5.A_CamStopMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
};
b5.A_CamStopMove.prototype.onTick = function()
{
    if (!((Date.now() - this.time) < (this.duration * 1000)))
    {
        var target = this.target;
        if (this.stop_vx)
            target.camera_vx = 0;
        if (this.stop_vy)
            target.camera_vy = 0;
        return false;
    }
    return true;
};
b5.ActionsRegister.register("CamStopMove", function(p) { return new b5.A_CamStopMove(p[1],p[2],p[3],p[4]); });

/**
 * Action that applies gravity to a scene camera, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamGravity
 * @constructor
 * @returns {b5.A_CamGravity}           The created action
 * @param target {string|b5.Scene}      Path to or instance of target scene that contains camera
 * @param gravity_x {number}            Gravity strength on x-axis
 * @param gravity_y {number}            Gravity strength on y-axis
 *
 */
b5.A_CamGravity = function(target, gravity_x, gravity_y)
{
    this.target = target;
    this.gravity_x = gravity_x;
    this.gravity_y = gravity_y;
};
b5.A_CamGravity.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_CamGravity.prototype.onTick = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    target.camera_vx += this.gravity_x;
    target.camera_vy += this.gravity_y;
    return false;
};
b5.ActionsRegister.register("CamGravity", function(p) { return new b5.A_CamGravity(p[1],p[2],p[3]); });

/**
 * Action that moves a scene camera dx, dy units over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamMove
 * @constructor
 * @returns {b5.A_CamMove}              The created action
 * @param target {string|b5.Scene}      Path to or instance of target scene that contains camera
 * @param dx {number}                   Distance to move on x axis (passing null will not affect the property)
 * @param dy {number}                   Distance to move on y axis (passing null will not affect the property)
 * @param duration {number}             Amount of time to move over in seconds
 *
 */
b5.A_CamMove = function(target, dx, dy, duration)
{
    this.target = target;
    this.dx = dx;
    this.dy = dy;
    this.duration = duration;
    this.x = target.x;
    this.y = target.y;
};
b5.A_CamMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    if (this.dx != null)
        target.camera_vx = this.dx / this.duration;
    if (this.dy != null)
        target.camera_vy = this.dy / this.duration;
    this.time = Date.now();
};
b5.A_CamMove.prototype.onTick = function()
{
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("CamMove", function(p) { return new b5.A_CamMove(p[1],p[2],p[3],p[4]); });

/**
 * Action that moves a scene camera to a specific coordinate over the specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamMoveTo
 * @constructor
 * @returns {b5.A_CamMoveTo}            The created action
 * @param target {string|b5.Scene}      Path to or instance of target scene that contains camera
 * @param x {number}                    Target x-axis position to move to (passing null will not affect the property)
 * @param y {number}                    Target y-axis position to move to (passing null will not affect the property)
 * @param duration {number}             Amount of time to move over in seconds
 * @param ease_x {number}               Easing function to use on x-axis (see {@link b5.Ease})
 * @param ease_y {number}               Easing function to use on y-axis (see {@link b5.Ease})
 *
 */
b5.A_CamMoveTo = function(target, x, y, duration, ease_x, ease_y)
{
    this.target = target;
    this.duration = duration;
    this.x = x;
    this.y = y;
    this.ease_x = ease_x || b5.Ease.linear;
    this.ease_y = ease_y || b5.Ease.linear;
};
b5.A_CamMoveTo.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    this.time = Date.now();
    this.sx = target.camera_x;
    this.sy = target.camera_y;
};
b5.A_CamMoveTo.prototype.onTick = function()
{
    var target = this.target;
    var dt = Date.now() - this.time;
    var d = dt / (this.duration * 1000);
    if (d > 1) d = 1;
    if (this.x != null)
        target.camera_x = this.sx + (this.x - this.sx) * b5.Ease.easingFuncs[this.ease_x](d);
    if (this.y != null)
        target.camera_y = this.sy + (this.y - this.sy) * b5.Ease.easingFuncs[this.ease_y](d);
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("CamMoveTo", function(p) { return new b5.A_CamMoveTo(p[1],p[2],p[3],p[4],p[5],p[6]); });

/**
 * Action that causes scene camera to follow a target, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamFollow
 * @constructor
 * @returns {b5.A_CamFollow}            The created action
 * @param source {string|b5.Scene}      Path to or instance of scene that contains camera that will follow the target
 * @param target {string|b5.Actor}      Path to or instance of target object to follow
 * @param speed {number}                Speed at which to follow, larger values will catch up with target slower
 * @param distance {number}             Minimum distance allowed between source and target (squared)
 *
 */
b5.A_CamFollow = function(source, target, speed, distance)
{
    this.source = source;
    this.target = target;
    this.speed = speed;
    this.distance = distance;
};
b5.A_CamFollow.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.source = b5.Utils.resolveObject(this.source);
};
b5.A_CamFollow.prototype.onTick = function()
{
    var target = this.target;
    var source = this.source;
    var speed = this.speed;
    var dx = target.x - source.camera_x;
    var dy = target.y - source.camera_y;
    var d = dx * dx + dy * dy;
    if (d < this.distance)
    {
        source.camera_vx = 0;
        source.camera_vy = 0;
    }
    else
    {
        source.camera_vx = dx / speed;
        source.camera_vy = dy / speed;
    }
    return true;
};
b5.ActionsRegister.register("CamFollow", function(p) { return new b5.A_CamFollow(p[1],p[2],p[3],p[4]); });

/**
 * Action that causes scene camera to follow a target, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamFollowPath
 * @constructor
 * @returns {b5.A_CamFollowPath}        The created action
 * @param target {string|b5.Scene}      Path to or instance of scene that contains camera that will follow the target
 * @param path {object[]}               Path to follow, array of x,y values that define the path, e.g. [x1,y1,x2,y2,etc..]
 * @param start {number}                Distance to start along the path
 * @param speed {number}                Speed at which to travel down the path
 *
 */
b5.A_CamFollowPath = function(target, path, start, speed)
{
    this.target = target;
    this.path = path;
    this.distance = start;
    this.speed = speed;

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
b5.A_CamFollowPath.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_CamFollowPath.prototype.onTick = function()
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
            target.camera_x = x1 + (x2 - x1) * d;
            target.camera_y = y1 + (y2 - y1) * d;
            break;
        }
    }

    return true;
};
b5.ActionsRegister.register("CamFollowPath", function(p) { return new b5.A_CamFollowPath(p[1],p[2],p[3],p[4]); });

/**
 * Action that causes scene camera to follow a path using velocity, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamFollowPathVel
 * @constructor
 * @returns {b5.A_CamFollowPathVel}     The created action
 * @param target {string|b5.Scene}      Path to or instance of scene that contains camera that will follow the target
 * @param path {object[]}               Path to follow, array of x,y values that define the path, e.g. [x1,y1,x2,y2,etc..]
 * @param start {number}                Distance to start along the path
 * @param speed {number}                Speed at which to travel down the path
 * @param catchup_speed {number}        Speed at which object catches up with path target modes
 *
 */
b5.A_CamFollowPathVel = function(target, path, start, speed, catchup_speed)
{
    this.target = target;
    this.path = path;
    this.distance = start;
    this.speed = speed;
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
b5.A_CamFollowPathVel.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_CamFollowPathVel.prototype.onTick = function()
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
            target.camera_vx = ((x1 + (x2 - x1) * d) - target.x) * catchup;
            target.camera_vy = ((y1 + (y2 - y1) * d) - target.y) * catchup;
            break;
        }
    }

    return true;
};
b5.ActionsRegister.register("CamFollowPathVel", function(p) { return new b5.A_CamFollowPathVel(p[1],p[2],p[3],p[4],p[5]); });

/**
 * Action that limits movement of scene camera to within a rectangular area, does not exit
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_CamLimitMove
 * @constructor
 * @returns {b5.A_CamLimitMove}         The created action
 * @param target {string|b5.Scene}      Path to or instance of scene that contains camera that will be limited
 * @param area {number[]}               Rectangular area limit [x,y,w,h]
 * @param hit {string}                  Action to perform when object oversteps boundary (bounce, wrap, stop)
 * @param bounce {number}               Bounce factor
 *
 */
b5.A_CamLimitMove = function(target, area, hit, bounce)
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
b5.A_CamLimitMove.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
};
b5.A_CamLimitMove.prototype.onTick = function()
{
    var target = this.target;
    var x = target.camera_x;
    var y = target.camera_y;
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
                target.camera_vx = -target.camera_vx * bounce;
            else if (hit === 1)
                target.camera_vx = 0;
            else if (hit === 2)
                target.camera_x = r;
        }
        else
        if (x > r)
        {
            if (hit === 0)
                target.camera_vx = -target.camera_vx * bounce;
            else if (hit === 1)
                target.camera_vx = 0;
            else if (hit === 2)
                target.camera_x = l;
        }
    }
    if (area[3] !== 0)
    {
        var t = area[1];
        var b = t + area[3];
        if (y < t)
        {
            if (hit === 0)
                target.camera_vy = -target.camera_vy * bounce;
            else if (hit === 1)
                target.camera_vy = 0;
            else if (hit === 2)
                target.camera_y = b;
        }
        else
        if (y > b)
        {
            if (hit === 0)
                target.camera_vy = -target.camera_vy * bounce;
            else if (hit === 1)
                target.camera_vy = 0;
            else if (hit === 2)
                target.camera_y = t;
        }
    }
    return false;
};
b5.ActionsRegister.register("CamLimitMove", function(p) { return new b5.A_CamLimitMove(p[1],p[2],p[3],p[4]); });

