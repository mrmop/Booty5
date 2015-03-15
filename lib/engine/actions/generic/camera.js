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

//
// The A_CamStopMove action stops a scene camera from moving then exits
// - target - Path to or instance of target scene that contains camera
// - stop_vx - Stops x velocity
// - stop_vy - Stops y velocity
// - duration - Amount of time wait before stopping
//
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

//
// The A_CamGravity action applies gravity ti a scene camera, does not exit
// - target - Path to or instance of target scene that contains camera
// - gravity_x - Gravity strength on x-axis
// - gravity_y - Gravity strength on y-axis
//
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

//
// The A_CamMove action moves a scene camera dx, dy units over the specified time then exits
// - target - Path to or instance of target scene that contains camera
// - dx, dy - Distances to move on x and y axis (passing null will not affect the property)
// - duration - Amount of time to move over
//
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

//
// The A_CamMoveTo action moves a scene camera to a specific coordinate over the specified time then exits
// - target - Path to or instance of target scene that contains camera
// - x, y - Target position to move to (passing null will not affect the property)
// - duration - Amount of time to move over
// - ease_x - Easing function to use on x-axis
// - ease_y - Easing function to use on y-axis
//
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

//
// The A_CamFollow action causes scene camera to follow a target, does not exit
// - source - Path to or instance of scene that contains camera that will follow the target
// - target - Path to or instance of target object to follow
// - speed - Speed at which to follow, larger values will catch up with target slower
// - distance - Minimum distance allowed between source and target (squared)
//
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

//
// The A_CamFollowPath action causes scene camera to follows a path, does not exit
// - target - Path to or instance of target scene that contains camera
// - path - Path to follow, array of x,y values that define the path
// - start - Distance to start along the path
// - speed - Speed at which to travel down the path
//
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

//
// The A_CamFollowPathVel action causes scene camera to follow a path using velocity, does not exit
// - target - Path to or instance of target scene that contains camera
// - path - Path to follow, array of x,y values that define the path
// - start - Distance to start along the path
// - speed - Speed at which to travel down the path
// - catchup_speed - Speed at which object catches up with path target modes
//
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

//
// The A_CamLimitMove action limits movement of scene camera to within a rectangular area, does not exit
// - target - Path to or instance of target scene that contains camera
// - area - Rectangular area limit [x,y,w,h]
// - hit - Action to perform when object oversteps boundary (bounce, wrap, stop)
// - bounce - Bounce factor
//
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

