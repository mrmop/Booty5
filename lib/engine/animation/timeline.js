/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * Animation is accomplished using timelines, a Timeline manages a collection of {@link b5.Animation}'s. A timeline is
 * a collection of animations with each animation targeting a specific property of a specific object. Multiple frames
 * of animation can be attached to the same animation.
 *
 * Once an animation has been created it should be added to either an actor / scene {@link b5.TimelineManager} or the
 * global app {@link b5.TimelineManager} in order for it to be processed. This enables fone control of animation on an
 * actor / scene basis.
 *
 * <b>Examples</b>
 *
 * Example of creating a simple fire and forget timeline with 4 key frames
 *
 *      timeline = new b5.Timeline(my_object, "x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [b5.Ease.quartin, b5.Ease.quartin, b5.Ease.quartin]);
 *
 * The above creates a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and
 * using QuarticIn easing to ease between each frame
 *
 * Example of creating a more complex timeline animation:
 *
 *      var timeline = new b5.Timeline();
 *      var anim = timeline.add(this, "x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [b5.Ease.quartin, b5.Ease.quartin, b5.Ease.quartin]);
 *      anim.setAction(0,function() { console.log("Hit frame 0"); });
 *      anim.setAction(1,function() { console.log("Hit frame 1"); });
 *      anim.setAction(2,function() { console.log("Hit frame 2"); });
 *      anim.onEnd = function() { console.log("Animation ended"); };
 *      anim.onRepeat = function() { console.log("Animation repeated"); };
 *
 * The above creates a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and using
 * QurticIn easing to ease between each frame. A callback function will be called each time the timeline hits a specific
 * frame, callbacks functions will also be called when the animation ends and repeats

 * For a complete overview of Animation see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/animation-lets-dance/ Booty5 Animation Overview}
 *
 * @class b5.Timeline
 * @constructor
 * @returns {b5.Timeline}                   The created timline
 * @param target {object}                   The target object that will have its properties animated
 * @param property {string}                 The name of the property that will be animated
 * @param frames {object[]}                 An array of key frame values that represent the value of the property at each time slot
 * @param times {number[]}                  An array of time values that represent the time at which each key frame should be used
 * @param repeat {number}                   The total number of times that the animation should repeat (0 for forever)
 * @param easing {number[]}                 An array of easing values (optional) (see {@link b5.Ease})
 *
 * @property {b5.Animation[]}       anims                                   - Array of animations (internal)
 * @property {b5.TimelineManager}   manager                                 - Parent timeline manager that manages this timeline
 * @property {string}               name                                    - Name of timeline
 */
b5.Timeline = function(target, property, frames, times, repeat, easing)
{
    // Public variables
    this.anims = [];                    // Animations
    this.manager = null;                // Parent timeline manager
    this.name = null;					// Name of timeline

    if (target !== undefined)
        this.add(target, property, frames, times, repeat, easing);
};

/**
 * Changes all animations in this timeline between relative and absolute animation
 * @param enable {boolean}                  Set to true to make frames relative animation, false for absolute
 */
b5.Timeline.prototype.setRelative = function(enable)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        anims[t].setRelative(enable);
    }
};

/**
 * Changes the repeat count of all animations within the timeline
 * @param repeats {number}                  Number of repeats
 */
b5.Timeline.prototype.setRepeats = function(repeats)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        anims[t].repeat = repeats;
        anims[t].repeats_left = repeats;
    }
};

/**
 * Creates and adds an animation to the timeline
 * @param target {object}                   The target object that will have its properties animated
 * @param property {string}                 The name of the property that will be animated
 * @param frames {object[]}                 An array of key frame values that represent the value of the property at each time slot
 * @param times {number[]}                  An array of time values that represent the time at which each key frame should be used
 * @param repeat {number}                   The total number of times that the animation should repeat (0 for forever)
 * @param easing {number[]}                 An array of easing values (optional) (see {@link b5.Ease})
 * @returns {b5.Animation}                  The created animation
 */
b5.Timeline.prototype.add = function(target, property, frames, times, repeat, easing)
{
    if (arguments.length == 1)  // Single parameter version classes target as an animation
    {
        target.timeline = this;
        this.anims.push(target);
        return target;
    }
    var anim = new b5.Animation(this, target, property, frames, times, repeat, easing);
    this.anims.push(anim);
    return anim;
};

/**
 * Removes the specified animation from the timeline
 * @param animation {b5.Animation}  The animation to remove
 */
b5.Timeline.prototype.remove = function(animation)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        if (anims[t] === animation)
        {
            anims.splice(t, 1);
            return;
        }
    }
};

/**
 * Changes the timeline target
 * @param target {object} The new target
 */
b5.Timeline.prototype.changeTarget = function(target)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        anims[t].target = target; 
    }
};

/**
 * Searches the timeline for the named animation
 * @param name {string} The name of the animation to find
 * @returns {b5.Animation} The animation ot null if not found
 */
b5.Timeline.prototype.find = function(name)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        if (anims[t].name === name)
            return anims[t];
    }
    return null;
};

/**
 * Sets the amount of time in seconds to delay all animations in the timeline
 * @param delay {number} Number of seconds to delay animations
 */
b5.Timeline.prototype.setDelay = function(delay)
{
    var anims = this.anims;
    var count = anims.length;
    for (var t = 0; t < count; t++)
    {
        anims[t].delay = -delay;
        anims[t].time = -delay;
    }
};

/**
 * Pauses playback of the timeline and all of its contained animations
 */
b5.Timeline.prototype.pause = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].pause();
};

/**
 * Sets the timeline playing the timeline playing all contained animations, if timeline is paused then it will be un-paused
 */
b5.Timeline.prototype.play = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].play();
};

/**
 * Restarts the timeline restarting all animations contained within the it from their beginning
 */
b5.Timeline.prototype.restart = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].restart();
};

/**
 * Prints out the timeline (debugging)
 * @private
 */
b5.Timeline.prototype.print = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
    {
        console.log(this.anims[t]);
    }
};

/**
 * Updates all animations that are managed by this timeline, automatically called by the timeline manager that manages it.
 * If the timeline has no animations left then it will remove itself ftrom its parent manager.
 * @param dt {number} Time that has passed since this timeline was last updated in seconds
 */
b5.Timeline.prototype.update = function(dt)
{
    // Remove timeline from manager if no animations left to update
    var count = this.anims.length;
    if (count === 0 && this.manager !== undefined)
    {
        this.manager.remove(this);
        return true;
    }

    // Update animations
    var updated = false;
    for (var t = count - 1; t >= 0; t--)
    {
        if (this.anims[t].update(dt))
            updated = true;
    }
    return updated;
};

