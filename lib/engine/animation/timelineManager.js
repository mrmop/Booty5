/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

//
// A TimelineManager manages a collection of timelines. The App and each Actor / Scene has its own TimelineManager
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

