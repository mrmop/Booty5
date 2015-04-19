/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * An animation is a collection of key frames that are tweened and applied to a target objects property. A key
 * frame consists of frames and times. Frames are values that the property should be set to and times are the times
 * at which the property should be those values. The values are tweened over the provided times and written to the
 * target objects property.
 *
 * Generally animations are created and added to a {@link b5.Timeline} object which then processes them all automatically.
 *
 * Animations have the following features:
 *
 * - Tweens between multiple key frames with each key frame having its own time value
 * - Automatically deleted when animation reaches end unless destroy is set to false
 * - Can be paused, played and restarted
 * - Easing can be applied between each individual key frame
 * - Can repeat a specified number of times or forever
 * - Can be played back at different speeds using time scale
 * - Can call a user supplied function when an animation repeats or ends
 * - Actions can be called when the end of a specific key frame is reached
 * - Playback can be delayed by setting time to a negative value
 *
 * Supports the following event handlers:
 *
 * - onEnd() - Called when the animation ends
 * - onRepeat() - Called when the animation repeats
 *
 * <b>Examples</b>
 *
 * Example showing how to create an animation
 *
 *      var anim = new b5.Animation(null, actor1, “_x”, [0, 200], [0, 2], 0, [b5.Ease.quartin]);
 *
 * For a complete overview of Animation see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/animation-lets-dance/ Booty5 Animation Overview}
 *
 * @class b5.Animation
 * @constructor
 * @returns {b5.Animation} The created animation
 * @param timeline (b5.Timeline)            The parent Timeline that will manage this animation
 * @param target {object}                   The target object that will have its properties animated
 * @param property {string}                 The name of the property that will be animated
 * @param frames {object[]}                 An array of key frame values that represent the value of the property at each time slot
 * @param times {number[]}                  An array of time values that represent the time at which each key frame should be used
 * @param repeat {number}                   The total number of times that the animation should repeat (0 for forever)
 * @param easing {number[]}                 An array of easing values (optional) (see {@link b5.Ease})
 *
 * @property {b5.Timeline}      timeline                                - Parent timeline (internal)
 * @property {number}           state                                   - State of playback (default b5.Animation.AS_playing} (internal)
 * @property {number}           time                                    - Current time (internal)
 * @property {number}           repeats_left                            - Number of repeats left to play (internal)
 * @property {number}           index                                   - Optimisation to prevent searching through all frames (internal)
 * @property {string}           name                                    - Animation name
 * @property {object}           target                                  - Target object to tween
 * @property {string}           property                                - Property to tween
 * @property {number[]|string[]|boolean[]}   frames                     - Key frame data (array of key frame values)
 * @property {number[]}         times                                   - Key frame times (array of key frame times)
 * @property {number[]}         easing                                  - Key frame easing functions (array of Tween functions) (see {@link b5.Ease})
 * @property {number}           repeat                                  - Total number of times to repeat animation (0 for forever)
 * @property {boolean}          destroy                                 - If true then animation will be destroyed when it finishes playing (default is true)
 * @property {function[]}       actions                                 - Array of action functions (called when frame is reached)
 * @property {number}           time_scale                              - Amount to scale time (default is 1.0)
 * @property {boolean}          tween                                   - If true then frames will be tweened (default is true)
 */
b5.Animation = function(timeline, target, property, frames, times, repeat, easing)
{
    // Internal variables
    this.timeline = timeline;                   // Parent timeline
    this.state = b5.Animation.AS_playing;       // State of playback
    this.time = -0.000001;                      // Current time
    this.repeats_left = repeat;                 // Number of repeats left to play
    this.index = -1;                            // Optimisation to prevent searching through all frames

    // Public variables
    this.name = null;                           // Animation name
    this.target = target;                       // Target object to tween
    this.property = property;                   // Property to tween
    this.frames = frames;                       // Key frame data (array of key frame values)
    this.times = times;                         // Key frame times (array of key frame times)
    this.easing = easing;                       // Key frame easing functions (array of Tween functions)
    this.repeat = repeat;                       // Total number of times to repeat animation (0 for forever)
    this.destroy = true;                        // If true then animation will be destroyed when it finishes playing (default is true)
    this.actions = [];                          // Array of action functions (called when frame is reached)
    this.time_scale = 1.0;                      // Amount to scale time (default is 1.0)
    this.tween = true;                          // if true then frames will be tweened
};

/**
 * Animation is playing
 * @type {number}
 */
b5.Animation.AS_playing = 0;
/**
 * Animation is paused
 * @type {number}
 */
b5.Animation.AS_paused = 1;

/**
 * Pause animation playback
 */
b5.Animation.prototype.pause = function()
{
    this.state = b5.Animation.AS_paused;
};

/**
 * Play animation
 */
b5.Animation.prototype.play = function()
{
    this.state = b5.Animation.AS_playing;
};

/**
 * Restart the animation from the beginning
 */
b5.Animation.prototype.restart = function()
{
    this.state = b5.Animation.AS_playing;
    this.time = -0.000001;
    this.index = -1;
    this.repeats_left = this.repeat;
};

/**
 * Per frame update of the animation, carries out tweening, automatically called by the timeline that manages it
 * @param dt {number} Time that has passed since this animation was last updated in seconds
 */
b5.Animation.prototype.update = function(dt)
{
    if (this.state !== b5.Animation.AS_playing)
        return;
    dt *= this.time_scale;

    // Update time
    var time = this.time + dt;

    // Calculate tweened frame data
    var times = this.times;
    var frames = this.frames;
    var count = times.length;
    var start = this.index;
    if (count <= 1)
        return;
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
                if (this.index !== start)
                {
                    var action = this.actions[this.index - 1];
                    if (action !== undefined)
                        action();
                }
                var t2 = times[t - 1];
                var fstart = frames[t - 1];
                var ddt = time - t2;
                if (ddt !== 0) {
                    if (this.tween)
                    {
                        var dtime = t1 - t2;
                        var dframe = frames[t] - fstart;
                        if (this.easing !== undefined)
                            this.target[this.property] = fstart + dframe * b5.Ease.easingFuncs[this.easing[t - 1]](ddt / dtime);
                        else
                            this.target[this.property] = fstart + (dframe * ddt) / dtime;
                    }
                    else
                        this.target[this.property] = fstart;
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
        if (this.repeat === 0 || this.repeats_left > 0)
        {
            while (time >= duration)
                time -= duration;

            if (this.onRepeat !== undefined)
                this.onRepeat(this);

            // Reset target property to frame 0 data
            this.target[this.property] = frames[0];
        }
        else
        {
            this.target[this.property] = frames[times.length - 1];
            this.state = b5.Animation.AS_paused;
            if (this.onEnd !== undefined)
                this.onEnd(this);
            if (this.destroy)
                this.timeline.remove(this); // Destroy timeline
        }
        this.index = -1;
    }
    this.time = time;
};

/**
 * Set the current time of the animation
 * @param time {number} Time in seconds
 */
b5.Animation.prototype.setTime = function(time)
{
    this.time = time;
    this.index = -1;
    this.update(0);
};

/**
 * Sets a function to be caled when the animation reaches the specified frame
 * @param index {number} Index of frame
 * @param action_function {function} A function to call
 */
b5.Animation.prototype.setAction = function(index, action_function)
{
    this.actions[index] = action_function;
};

