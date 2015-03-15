/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// An action is a single unit of functionality that can be applied to an object
// Generally actions are chained together and added to an Actor or Scene to modify their behaviour
// Each action has a set of initial parameters which are supplied externally as well as the following event handlers:
// - onInit - Called when the action is first initialised, usually when the action is added to an object
// - onTick - Called when the action is updated (each game frame)
// If the onTick handler is not supplied then the action system will assume that it instantly exits and moves to the
// next action in the actions list
//
// Example showing how to add two sequential actions to an actor:
//
// var actions_list = new b5.ActionsList("moveme", 0);
// actions_list.add(new b5.ActionMoveTo(actor,100,100,2,b5.Ease.sin,b5.Ease.sin));
// actions_list.add(new b5.ActionMoveTo(actor,0,0,2,b5.Ease.sin,b5.Ease.sin));
// actor.actions.add(actions_list).play();

//
// The ActionsRegister contains a list of all available actions. new action creators are added to this register.
// The ActionsRegister is used by the Xoml system to instantiate actions lists from JSON.
//
b5.ActionsRegister =
{
    creators: [],                                   // Array of actions creator functions
    register: function(action_name, creator_func)   // Registers a new action creator
    {
        b5.ActionsRegister.creators[action_name] = creator_func;
    },
    create: function(action_name, params)           // Creates an action from the supplied name and parameters
    {
        return b5.ActionsRegister.creators[action_name](params);
    }
};

//
// An ActionsList contains a list of actions that are executed in sequence. Each action must fully complete (return
// false from its onTick method) before the next action can be executed. An action list can be executed a finite
// number of times or indefinitely.
// Each time an actions list is repeated, all actions within the list will be re-initialised.
//
b5.ActionsList = function(name, repeat)
{
    // Internal variables
    this.repeats_left = repeat;     // Number of repeats left to play

    // Public variables
    this.manager = null;            // Parent container
    this.name = name;               // Name of actions list
    this.repeat = repeat;           // Number of times to repeat this actions list (0 for forever)
    this.actions = [];		        // List of actions to sequentially execute
    this.current = 0;               // Current executing action index
    this.destroy = true;            // If true then actions list will be destroyed when it finishes playing (default is true)
    this.playing = false;           // Playing state
};

b5.ActionsList.prototype.add = function(action)
{
    this.actions.push(action);
    action.parent = this;
    return action;
};

b5.ActionsList.prototype.remove = function(action)
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        if (actions[t] === action)
        {
            actions.splice(t, 1);
            return;
        }
    }
};

b5.ActionsList.prototype.execute = function()
{
    if (!this.playing)
        return true;
    var actions = this.actions;
    var count = actions.length;
    if (count === 0)
        return false;

    var action = actions[this.current];
    // Initialise action if not already initialised
    if (action.initialised !== true)
    {
        if (action.onInit !== undefined)
            action.onInit();
        action.initialised = true;
    }
    // Execute actions per frame update tick handler
    if (action.onTick === undefined || !action.onTick())
    {
        action.initialised = false;
        this.current++;
        if (this.current >= count)
        {
            this.current = 0;
            if (this.repeat !== 0)
            {
                this.repeats_left--;
                if (this.repeats_left <= 0)
                {
                    this.playing = false;
                    this.repeats_left = this.repeat;
                    return false;
                }
            }
        }
    }

    return true;
};

b5.ActionsList.prototype.pause = function()
{
    this.playing = false;
};

b5.ActionsList.prototype.play = function()
{
    this.playing = true;
};

b5.ActionsList.prototype.restart = function()
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
        actions[t].initialised = false;
    this.repeats_left = this.repeat;
    this.play();
};

//
// An ActionsListManager manages a collection of ActionLists. The App and each Actor / Scene has its own ActionsListManager
//
b5.ActionsListManager = function()
{
    // Public variables
    this.actions = [];                  // Array of action lists
};

b5.ActionsListManager.prototype.add = function(actionlist)
{
    this.actions.push(actionlist);
    actionlist.manager = this;
    return actionlist;
};

b5.ActionsListManager.prototype.remove = function(actionlist)
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        if (actions[t] === actionlist)
        {
            actions.splice(t, 1);
            return;
        }
    }
};

b5.ActionsListManager.prototype.find = function(name)
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        if (actions[t].name === name)
            return actions[t];
    }
    return null;
};

b5.ActionsListManager.prototype.execute = function()
{
    // Update action lists
    var removals = [];
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
    {
        if (!actions[t].execute())
        {
            if (actions[t].destroy)
                removals.push(actions[t]);
        }
    }
    // Remove destroyed action lists
    for (var t = 0; t < removals.length; t++)
        this.remove(removals[t]);
};

