/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Easing functions, used by the animation system to ease between key frames
//
function Ease() {}
Ease.linear = 0;
Ease.quadin = 1;
Ease.quadout = 2;
Ease.cubicin = 3;
Ease.cubicout = 4;
Ease.quartin = 5;
Ease.quartout = 6;
Ease.sin = 7;

Ease.easingFuncs = [
    function(d)
    {
        return d;                       // Linear
    },
    function(d)
    {
        return d * d;                   // Quadratic in
    },
    function(d)
    {
        return d * (2 - d);             // Quadratic out
    },
    function(d)
    {
        return d * d * d;               // Cubic in
    },
    function(d)
    {
        d -= 1;
        return d * d * d + 1;           // Cubic out
    },
    function(d)
    {
        return d * d * d * d;           // Quartic in
    },
    function(d)
    {
        d -= 1;
        return -(d * d * d * d - 1);    // Quartic out
    },
    function(d)
    {
        return Math.sin(d * Math.PI / 2);    // Sinusoidal
    }
];

//
// An animation - A collection of key frames that are tweened and applied to a target objects property.
// A key frame consists of frames and times. Frames are values that the property should be set to and
// times are are times at which the property should be those values. The values are tweened over the
// provided times and written to the target objects property. Animations have the following features:
// - Tweens between multiple key frames with each key frame having its own time value
// - Automatically deleted when animation reaches end unless destroy is set to false
// - Can be paused, played and restarted
// - Easing can be applied between each individual key frame
// - Can repeat a specified number of times or forever
// - Can be played back at different speeds using time scale
// - Can call a user supplied function when an animation repeats or ends
// - Actions can be called when the end of a specific key frame is reached
// - Playback can be delayed by setting time to a negative value
//
// Supports the following event handlers:
// onEnd() - Called when the animation ends
// onRepeat() - Called when the animation repeats
//
function Animation(timeline, target, property, frames, times, repeat, easing)
{
    // Internal variables
    this.timeline = timeline;                   // Parent timeline
    this.state = Animation.AS_playing;          // State of playback
    this.time = -0.000001;                      // Current time
    this.repeats_left = repeat;                 // Number of repeats left to play
    this.index = -1;                            // Optimisation to prevent searching through all frames

    // Public variables
    this.target = target;                       // Target object to tween
    this.property = property;                   // Property to tween
    this.frames = frames;                       // Key frame data (array of key frame values)
    this.times = times;                         // Key frame times (array of key frame times)
    this.easing = easing;                       // Key frame easing functions (array of Tween functions)
    this.repeat = repeat;                       // Total number of times to repeat animation (0 for forever)
    this.destroy = true;                        // If true then animation will be destroyed when it finishes playing (default is true)
    this.actions = [];                          // Array of action functions (called when frame is reached)
    this.time_scale = 1.0;                      // Amount to scale time (default is 1.0)
}

Animation.AS_playing = 0;                // Animation is playing
Animation.AS_paused = 1;                 // Animation is paused

Animation.prototype.pause = function()
{
    this.state = Animation.AS_paused;
};

Animation.prototype.play = function()
{
    this.state = Animation.AS_playing;
};

Animation.prototype.restart = function()
{
    this.state = Animation.AS_playing;
    this.time = -0.000001;
    this.index = -1;
    this.repeats_left = this.repeat;
};

Animation.prototype.update = function(dt)
{
    if (this.state != Animation.AS_playing)
        return;
    dt *= this.time_scale;

    // Update time
    var time = this.time + dt;

    // Calculate tweened frame data
    var times = this.times;
    var frames = this.frames;
    var count = times.length;
    var start = this.index;
    for (var t = start; t < count; t++)
    {
        // Find next frame
        var t1 = times[t];
        if (time < t1)
        {
            this.index = t;
            if (time >= times[0])
            {
                // Check to see if we need to call an action
                if (this.index != start)
                {
                    var action = this.actions[this.index - 1];
                    if (action !== undefined)
                        action();
                }
                var t2 = times[t - 1];
                var fstart = frames[t - 1];
                var dtime = t1 - t2;
                var dframe = frames[t] - fstart;
                var ddt = time - t2;
                if (ddt != 0) {
                    if (this.easing !== undefined)
                        this.target[this.property] = fstart + dframe * Ease.easingFuncs[this.easing[t - 1]](ddt / dtime);
                    else
                        this.target[this.property] = fstart + (dframe * ddt) / dtime;
                }
            }
            break;
        }
    }

    // Handle repeat / end animation
    var duration = times[times.length - 1];
    if (time > duration)
    {
        if (this.repeat > 0)
            this.repeats_left--;
        if (this.repeat == 0 || this.repeats_left > 0)
        {
            time -= duration;

            if (this.onRepeat !== undefined)
                this.onRepeat(this);

            // Reset target property to frame 0 data
            this.target[this.property] = frames[0];
        }
        else
        {
            this.target[this.property] = frames[times.length - 1];
            this.state = Animation.AS_paused;
            if (this.onEnd !== undefined)
                this.onEnd(this);
            if (this.destroy)
                this.timeline.remove(this); // Destroy timeline
        }
        this.index = -1;
    }
    this.time = time;
};

Animation.prototype.setTime = function(time)
{
    this.time = time;
    this.index = -1;
    this.update(0);
};

Animation.prototype.setAction = function(index, action_function)
{
    this.actions[index] = action_function;
};

//
// A Timeline manages a collection of animations. Animation is done using timelines. A timeline is a collection of
// animations with each animation targeting a specific property of a specific object. Multiple frames of animation cab
// be attached to the same animation. once an animation has been created it should be added to either a scene timeline
// manager or global app timeline manager in order for it to be processed. This enables all timelines to be paused
// when a scene is deactivated.
//
// Example of creating a simple fire and forget timeline with 4 key frames
//
// Create a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and using
// QuarticIn easing to ease between each frame
// timeline = new Timeline(my_object, "x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [Ease.quartin, Ease.quartin, Ease.quartin]);
//
// Example of creating a more complex timeline animation:
//
// Create a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and using
// QurticIn easing to ease between each frame. A callback function will be called each time the timeline hits a specific
// frame, callbacks functions will also be called when the animation ends and repeats
// timeline = new Timeline();
// var anim = this.timeline.add(this, "x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [Ease.quartin, Ease.quartin, Ease.quartin]);
// anim.setAction(0,function() { console.log("Hit frame 0"); });
// anim.setAction(1,function() { console.log("Hit frame 1"); });
// anim.setAction(2,function() { console.log("Hit frame 2"); });
// anim.onEnd = function() { console.log("Animation ended"); };
// anim.onRepeat = function() { console.log("Animation repeated"); };
//
function Timeline(target, property, frames, times, repeat, easing)
{
    // Public variables
    this.anims = [];                    // Animations
    this.manager = null;                // Parebt timeline manager
    this.name = "";					    // Name of timeline

    if (target !== undefined)
        this.add(target, property, frames, times, repeat, easing);
}

Timeline.prototype.add = function(target, property, frames, times, repeat, easing)
{
    var anim = new Animation(this, target, property, frames, times, repeat, easing);
    this.anims.push(anim);
    return anim;
};

Timeline.prototype.remove = function(animation)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        if (anims[t] == animation)
        {
            anims.splice(t, 1);
            return;
        }
    }
};

Timeline.prototype.pause = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].pause();
};

Timeline.prototype.play = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].play();
};

Timeline.prototype.restart = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].restart();
};

Timeline.prototype.print = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
    {
        console.log(this.anims[t]);
    }
};

Timeline.prototype.update = function(dt)
{
    // Remove timeline from manager if no animations left to update
    var count = this.anims.length;
    if (count == 0 && this.manager !== undefined)
    {
        this.manager.remove(this);
        return;
    }

    // Update animations
    for (var t = count - 1; t >= 0; t--)
    {
        this.anims[t].update(dt);
    }
};

//
// A TimelineManager manages a collection of timelines, each Scene has its own TimelineManager as well as the global app
//
function TimelineManager()
{
    // Public variables
    this.timelines = [];                  // Array of timelines
}

TimelineManager.prototype.add = function(timeline)
{
    this.timelines.push(timeline);
    timeline.manager = this;
};

TimelineManager.prototype.remove = function(timeline)
{
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        if (timelines[t] == timeline)
        {
            timelines.splice(t, 1);
            return;
        }
    }
};

TimelineManager.prototype.pause = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].pause();
};

TimelineManager.prototype.play = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].play();
};

TimelineManager.prototype.restart = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].restart();
};

TimelineManager.prototype.print = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        console.log(this.timelines[t]);
};

TimelineManager.prototype.update = function(dt)
{
    // Update timelines
    var count = this.timelines.length;
    for (var t = count - 1; t >= 0; t--)
    {
        this.timelines[t].update(dt);
    }
};
