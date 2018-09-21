/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A TimelineManager manages a collection of {@link b5.Timeline}'s. The app and each actor / scene has its own timeline manager that have lifetime scope
 * tied to the lifetime of those objects. This allows you to for example add a number of animations to an actor then when the actor is destroyed those
 * animations will be cleaned up.
 *
 * For a complete overview of Animation see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/animation-lets-dance/ Booty5 Animation Overview}
 *
 * @class b5.TimelineManager
 * @constructor
 * @returns {b5.TimelineManager}            The created timeline manager
 * @param timelines {b5.Timeline[]}         Array of timelines that are managed by this manager
 *
 * @property {b5.Timeline[]}    timelines                       - Array of timelines that are managed by this manager
 * @property {boolean}          playing                         - True if playing
*/
b5.TimelineManager = function()
{
    // Public variables
    this.timelines = [];                  // Array of timelines (internal)
    this.playing = false;
};

/**
 * Adds the supplied timeline to the manager
 * @param timeline {b5.Timeline} The timeline to add
 * @returns {b5.Timeline} The added timeline
 */
b5.TimelineManager.prototype.add = function(timeline)
{
    this.timelines.push(timeline);
    timeline.manager = this;
    return timeline;
};

/**
 * Removes the supplied timeline from the manager
 * @param timeline {b5.Timeline} The timeline to remove, ommit to remove all timelines
 */
b5.TimelineManager.prototype.remove = function(timeline)
{
    if (timeline === undefined)
    {
        this.timelines = [];
        return;
    }
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

/**
 * Changes all timelines target
 * @param target {object} The new target
 */
b5.TimelineManager.prototype.changeTarget = function(target)
{
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        timelines[t].changeTarget(target); 
    }
};


/**
 * Searches the timeline manager for the named timeline
 * @param name {string} Name of timeline to find
 * @returns {b5.Timeline} Found timeline or null if not found
 */
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

/**
 * Changes the repeat count of all timelines within the timeline manager
 * @param repeats {number}                  Number of repeats
 */
b5.TimelineManager.prototype.setRepeats = function(repeats)
{
    var timelines = this.timelines;
    var count = timelines.length;
    for (var t = 0; t < count; t++)
    {
        timelines[t].setRepeats(repeats);
    }
};

/**
 * Pauses playback of the timeline manager and all of its contained timelines
 */
b5.TimelineManager.prototype.pause = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].pause();
};

/**
 * Sets the timeline manager playing the timeline playing all contained timelines, if timeline manager is paused then it will be un-paused
 */
b5.TimelineManager.prototype.play = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].play();
};

/**
 * Restarts the timeline manager restarting all timlines contained within the manager from their beginning
 */
b5.TimelineManager.prototype.restart = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        this.timelines[t].restart();
};

/**
 * Prints out the timeline manager (debugging)
 * @private
 */
b5.TimelineManager.prototype.print = function()
{
    var count = this.timelines.length;
    for (var t = 0; t < count; t++)
        console.log(this.timelines[t]);
};

/**
 * Updates all timelines that are managed by this manager, automatically called by the app, scene or actor that manages it
 * @param dt {number} Time that has passed since this timeline manager was last updated in seconds
 */
b5.TimelineManager.prototype.update = function(dt)
{
    // Update timelines
    var count = this.timelines.length;
    if (count === 0)
        return false;
    this.playing = false;
    for (var t = count - 1; t >= 0; t--)
    {
        if (this.timelines[t].update(dt))
            this.playing = true;
    }
    return this.playing;
};

