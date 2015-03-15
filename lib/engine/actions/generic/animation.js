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

//
// The ActionChangeTimeline action changes the state of an animation timeline then exits
// - timeline - Path to timeline or instance of timeline to change
// - action - Action to perform on the timeline (play, pause or restart)
//
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

