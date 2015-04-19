/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// General actions are actions that are generic in nature
//
// A_Wait           - waits for a specified time then exits
// A_SetProps       - sets a property or group of properties of an object to specified values
// A_AddProps       - adds the specified value or array of values onto the specified properties
// A_TweenProps     - Tweens the array of property values over time then exits
// A_Call           - Calls a function with parameters then exits
// A_Create         - Creates an object from a xoml template then exits
// A_Destroy        - Destroys an object then exits
// A_FocusScene     - Sets the current focus scene

/**
 * Action that waits for a specified time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Wait
 * @constructor
 * @returns {b5.A_Wait}                 The created action
 * @param duration {number}             Amount of time to wait in seconds
 *
 */
b5.A_Wait = function(duration)
{
    this.duration = duration;
};
b5.A_Wait.prototype.onInit = function()
{
    this.time = Date.now();
};
b5.A_Wait.prototype.onTick = function()
{
    return ((Date.now() - this.time) < (this.duration * 1000))
};
b5.ActionsRegister.register("Wait", function(p) { return new b5.A_Wait(p[1]); });

/**
 * Action that sets a group of properties of an object to specified values then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_SetProps
 * @constructor
 * @returns {b5.A_SetProps}             The created action
 * @param target {string|object}        Path to or instance of target object to change properties of
 * @param properties {object}           Property / value pairs that will be set (e.g. {"vx":0,"vy":0})
 *
 */
b5.A_SetProps = function(target, properties)
{
    this.target = target;
    this.properties = properties;
};
b5.A_SetProps.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    var props = this.properties;
    for (var prop in props)
        target[prop] = props[prop];
};
b5.ActionsRegister.register("SetProps", function(p) { return new b5.A_SetProps(p[1],p[2]); });

/**
 * Action that adds the specified values onto the specified properties then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_AddProps
 * @constructor
 * @returns {b5.A_AddProps}             The created action
 * @param target {string|object}        Path to or instance of target object to change properties of
 * @param properties {object}           Property / value pairs that will be updated (e.g. {"vx":0,"vy":0})
 *
 */
b5.A_AddProps = function(target, properties)
{
    this.target = target;
    this.properties = properties;
};
b5.A_AddProps.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    var props = this.properties;
    for (var prop in props)
        target[prop] += props[prop];
};
b5.ActionsRegister.register("AddProps", function(p) { return new b5.A_AddProps(p[1],p[2]); });

/**
 * Action that tweens the specified property values over time then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_TweenProps
 * @constructor
 * @returns {b5.A_TweenProps}           The created action
 * @param target {string|object}        Path to or instance of target object to change properties of
 * @param properties {string[]}         Array of property names to tween (e.g. ["x", "y"])
 * @param start {number[]}              Array of start values
 * @param end {number[]}                Array of end values
 * @param duration {number}             Amount of time to tween over in seconds
 * @param ease {number[]}               Array of easing functions to apply to tweens (see {@link b5.Ease})
 *
 */
b5.A_TweenProps = function(target, properties, start, end, duration, ease)
{
    this.target = target;
    this.props = properties;
    this.start = start;
    this.end = end;
    this.duration = duration;
    this.ease = ease;
};
b5.A_TweenProps.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.time = Date.now();
    var target = this.target;
    var props = this.props;
    var start = this.start;
    var count = props.length;
    for (var t = 0; t < count; t++)
        target[props[t]] = start[t];
};
b5.A_TweenProps.prototype.onTick = function()
{
    var dt = Date.now() - this.time;
    var dur = this.duration;
    if (dur !== 0)
    {
        var props = this.props;
        var start = this.start;
        var end = this.end;
        var count = props.length;
        var target = this.target;
        var ease = this.ease;
        var d = dt / (dur * 1000);
        if (d > 1) d = 1;
        for (var t = 0; t < count; t++)
            target[props[t]] = start[t] + (end[t] - start[t]) * b5.Ease.easingFuncs[ease[t]](d);
    }

    return (dt < (dur * 1000));
};
b5.ActionsRegister.register("TweenProps", function(p) { return new b5.A_TweenProps(p[1],p[2],p[3],p[4],p[5],p[6]); });

/**
 * Action that calls a function then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Call
 * @constructor
 * @returns {b5.A_Call}                 The created action
 * @param func {string}                 Function to call
 * @param params {object}               Parameter or pass to the function
 *
 */
b5.A_Call = function(func, params)
{
    this.func = func;
    this.params = params;
};
b5.A_Call.prototype.onInit = function()
{
    window[this.func](this.params);
};
b5.ActionsRegister.register("Call", function(p) { return new b5.A_Call(p[1],p[2]); });

/**
 * Action that creates an object from a xoml template then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Create
 * @constructor
 * @returns {b5.A_Create}               The created action
 * @param objects {object[]}            Collection of objects in XOML JSON format (as exported from Booty5 editor) that contains the template
 * @param scene {string|b5.Scene}       Path to or instance of scene that contains the template and its resources
 * @param template {string}             The name of the object template
 * @param type {string}                 The type of object (e.g. icon, label, scene etc)
 * @param properties {object}           Object that contains property / value pairs that will be set to created object (e.g. {"vx":0,"vy":0})
 *
 */
b5.A_Create = function(objects, scene, template, type, properties)
{
    this.objects = objects;
    this.temp_name = template;
    this.type = type;
    this.scene = scene;
    this.properties = properties;
};
b5.A_Create.prototype.onInit = function()
{
    if (typeof this.objects === "string")
        this.objects = window[this.objects];
    this.scene = b5.Utils.resolveObject(this.scene);
    var template = b5.Xoml.findResource(this.objects, this.temp_name, this.type);
    var xoml = new b5.Xoml(b5.app);
    xoml.current_scene = this.scene;
    var obj = xoml.parseResource(this.scene, template);
    var props = this.properties;
    for (var prop in props)
        obj[prop] = props[prop];
};
b5.ActionsRegister.register("Create", function(p) { return new b5.A_Create(p[1],p[2],p[3],p[4],p[5]); });

/**
 * Action that destroys an object then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_Destroy
 * @constructor
 * @returns {b5.A_Destroy}              The created action
 * @param target {string|object}        Path to or instance of object to destroy
 *
 */
b5.A_Destroy = function(target)
{
    this.target = target;
};
b5.A_Destroy.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    this.target.destroy();
};
b5.ActionsRegister.register("Destroy", function(p) { return new b5.A_Destroy(p[1]); });

/**
 * Action that sets the current focus scene then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_FocusScene
 * @constructor
 * @returns {b5.A_FocusScene}           The created action
 * @param target {string|b5.Scene}      Path to or instance of scene to set as focus
 & @param focus2 {boolean}              Set as secondary focus instead if true
 *
 */
b5.A_FocusScene = function(target, focus2)
{
    this.target = target;
    this.focus2 = focus2;
};
b5.A_FocusScene.prototype.onInit = function()
{
    this.target = b5.Utils.resolveObject(this.target);
    var target = this.target;
    if (this.focus2 === true)
        b5.app.focus_scene2 = target;
    else
        b5.app.focus_scene = target;
};
b5.ActionsRegister.register("FocusScene", function(p) { return new b5.A_FocusScene(p[1],p[2]); });