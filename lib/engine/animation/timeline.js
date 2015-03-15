/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

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
// timeline = new Timeline(my_object, "x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [b5.Ease.quartin, b5.Ease.quartin, b5.Ease.quartin]);
//
// Example of creating a more complex timeline animation:
//
// Create a timeline that targets the x property of my_object with 4 key frames spaced out every 5 seconds and using
// QurticIn easing to ease between each frame. A callback function will be called each time the timeline hits a specific
// frame, callbacks functions will also be called when the animation ends and repeats
// timeline = new b5.Timeline();
// var anim = this.timeline.add(this, "x", [0, 100, 300, 400], [0, 5, 10, 15], 0, [b5.Ease.quartin, b5.Ease.quartin, b5.Ease.quartin]);
// anim.setAction(0,function() { console.log("Hit frame 0"); });
// anim.setAction(1,function() { console.log("Hit frame 1"); });
// anim.setAction(2,function() { console.log("Hit frame 2"); });
// anim.onEnd = function() { console.log("Animation ended"); };
// anim.onRepeat = function() { console.log("Animation repeated"); };
//
b5.Timeline = function(target, property, frames, times, repeat, easing)
{
    // Public variables
    this.anims = [];                    // Animations
    this.manager = null;                // Parent timeline manager
    this.name = null;					// Name of timeline

    if (target !== undefined)
        this.add(target, property, frames, times, repeat, easing);
};

b5.Timeline.prototype.add = function(target, property, frames, times, repeat, easing)
{
    var anim = new b5.Animation(this, target, property, frames, times, repeat, easing);
    this.anims.push(anim);
    return anim;
};

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

b5.Timeline.prototype.pause = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].pause();
};

b5.Timeline.prototype.play = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].play();
};

b5.Timeline.prototype.restart = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
        this.anims[t].restart();
};

b5.Timeline.prototype.print = function()
{
    var count = this.anims.length;
    for (var t = 0; t < count; t++)
    {
        console.log(this.anims[t]);
    }
};

b5.Timeline.prototype.update = function(dt)
{
    // Remove timeline from manager if no animations left to update
    var count = this.anims.length;
    if (count === 0 && this.manager !== undefined)
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
b5.TimelineManager = function()
{
    // Public variables
    this.timelines = [];                  // Array of timelines
};

b5.TimelineManager.prototype.add = function(timeline)
{
    this.timelines.push(timeline);
    timeline.manager = this;
    return timeline;
};

b5.TimelineManager.prototype.remove = function(timeline)
{
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        if (timelines[t] === timeline)
        {
            timelines.splice(t, 1);
            return;
        }
    }
};

b5.TimelineManager.prototype.find = function(name)
{
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        if (timelines[t].name === name)
            return timelines[t];
    }
    return null;
};

b5.TimelineManager.prototype.pause = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].pause();
};

b5.TimelineManager.prototype.play = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].play();
};

b5.TimelineManager.prototype.restart = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].restart();
};

b5.TimelineManager.prototype.print = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        console.log(this.timelines[t]);
};

b5.TimelineManager.prototype.update = function(dt)
{
    // Update timelines
    var count = this.timelines.length;
    for (var t = count - 1; t >= 0; t--)
    {
        this.timelines[t].update(dt);
    }
};

