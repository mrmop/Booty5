/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Animation actions are actions that deal with changing animation
//
// A_ChangeTimeline - Changes the named timeline

/**
 * Action that changes the state of an animation timeline then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ChangeTimeline
 * @constructor
 * @returns {b5.A_ChangeTimeline} The created action
 * @param timeline {string|b5.Timeline}     Path to timeline or instance of timeline to change
 * @param action {string}                   Action to perform on the timeline (play, pause or restart)
 *
 */
b5.A_ChangeTimeline = function(timeline, action)
{
    this.timeline = timeline;
    this.action = action;
};
b5.A_ChangeTimeline.prototype.onInit = function()
{
    this.timeline = b5.Utils.resolveObject(this.timeline, "timeline");
    var timeline = this.timeline;
    if (timeline !== null)
    {
        var action = this.action;
        if (action === "play")
            timeline.play();
        else if (action === "pause")
            timeline.pause();
        else if (action === "restart")
            timeline.restart();
    }
};
b5.ActionsRegister.register("ChangeTimeline", function(p) { return new b5.A_ChangeTimeline(p[1],p[2]); });

