/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * The ActionsRegister contains a list of all available actions. new action creators are added to this register.
 *
 * The ActionsRegister is used by the Xoml system to instantiate actions lists from JSON.
 *
 * Below is an example that shows how to register an action that can be used from the Xoml system:
 *
 *      b5.ActionsRegister.register("ChangeActions", function(p) { return new b5.A_ChangeActions(p[1], p[2]); });
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.ActionsRegister
 *
 */
b5.ActionsRegister =
{
    creators: [],                                   // Array of actions creator functions
    /**
     * Registers a new action creator
     * @param action_name {string}      The action name, e.g. A_Sound
     * @param creator_func {function}   Function that creates an instance of the action
     */
    register: function(action_name, creator_func)
    {
        b5.ActionsRegister.creators[action_name] = creator_func;
    },
    /**
     * Creates an action from the supplied name and parameters
     * @param action_name {string}      The action name, e.g. A_Sound
     * @param params {any[]}            Array of parameters to pass to creation function
     * @returns {object}                Created action
     */
    create: function(action_name, params)
    {
        return b5.ActionsRegister.creators[action_name](params);
    }
};

/**
 * An action is a single unit of functionality that can be applied to an object.
 * Generally actions are chained together and added to a {@link b5.Actor} or {@link b5.Scene} to modify their behaviour
 * Each action has a set of initial parameters which are supplied externally as well as the following event handlers:
 *
 * - onInit - Called when the action is first initialised, usually when the action is added to an object
 * - onTick - Called when the action is updated (each game frame)
 *
 * If the onTick handler is not supplied then the action system will assume that it instantly exits and moves to the
 * next action in the actions list
 *
 * An ActionsList contains a list of actions that are executed in sequence. Each action must fully complete (return
 * false from its onTick method) before the next action can be executed. An action list can be executed a finite
 * number of times or indefinitely.
 *
 * Each time an actions list is repeated, all actions within the list will be re-initialised.
 *
 * Example showing how to add two sequential actions to an actor:
 *
 *      var actions_list = new b5.ActionsList("moveme", 0);
 *      actions_list.add(new b5.ActionMoveTo(actor,100,100,2,b5.Ease.sin,b5.Ease.sin));
 *      actions_list.add(new b5.ActionMoveTo(actor,0,0,2,b5.Ease.sin,b5.Ease.sin));
 *      actor.actions.add(actions_list).play();
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.ActionsList
 * @constructor
 * @returns {b5.ActionsList}                The created actions list
 * @param name {string}                     Name of actions list
 * @param repeat {boolean}                  Number of times that the actions list should repeat (0 for forever)
 *
 * @property {number}                   repeats_left    - Number of repeats left before action list ends (interval)
 * @property {b5.ActionsListManager}    manager         - Parent actions list manager
 * @property {string}                   name            - Name of this actions list
 * @property {boolean}                  repeat          - Number of times the actions list should repeat
 * @property {object[]}                 actions         - List of actions to sequentially execute
 * @property {number}                   current         - Current executing action index
 * @property {boolean}                  destroy         - If true then actions list will be destroyed when it finishes playing (default is true)
 * @property {boolean}                  playing         - Playing state (default is false)
 */
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

/**
 * Add the specified action to the actions list
 * @param action {object}   Action to add
 * @returns {object}        The added action
 */
b5.ActionsList.prototype.add = function(action)
{
    this.actions.push(action);
    action.parent = this;
    return action;
};

/**
 * Removes the specified action from the actions list
 * @param action {object}  The action to remove
 */
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

/**
 * Executes this actions list, automatically called by the actions list manager
 * @returns {boolean} True if the action is still processing, false if it has stopped
 */
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

/**
 * Pauses playback of the actions list
 */
b5.ActionsList.prototype.pause = function()
{
    this.playing = false;
};

/**
 * Sets the actions list playing, if actions list is paused then it will be un-paused
 */
b5.ActionsList.prototype.play = function()
{
    this.playing = true;
};

/**
 * Restarts the actions list restarting all actions contained within it
 */
b5.ActionsList.prototype.restart = function()
{
    var actions = this.actions;
    var count = actions.length;
    for (var t = 0; t < count; t++)
        actions[t].initialised = false;
    this.repeats_left = this.repeat;
    this.play();
};

/**
 * An ActionsListManager manages a collection of {@link b5.ActionsList}'s. The App and each Actor / Scene has its own ActionsListManager
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.ActionsListManager
 * @constructor
 * @returns {b5.ActionsListManager}             The created actions list manager
 *
 * @property {b5.ActionsList[]} actions         - Array of action lists that are managed by this manager
 */
b5.ActionsListManager = function()
{
    // Public variables
    this.actions = [];                  // Array of action lists
};


/**
 * Adds the supplied actions list to the manager
 * @param actionlist {b5.ActionsList} The actions list to add
 * @returns {b5.ActionsList} The added actions list
 */
b5.ActionsListManager.prototype.add = function(actionlist)
{
    this.actions.push(actionlist);
    actionlist.manager = this;
    return actionlist;
};

/**
 * Removes the supplied actions list from the manager
 * @param actionlist {b5.ActionsList} The actions list to remove
 */
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

/**
 * Searches the actions list manager for the named actions list
 * @param name {string} Name of actions list to find
 * @returns {b5.ActionsList} Found actions list or null if not found
 */
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

/**
 * Executes all actions within this actions list, automatically called by parent app, actor or scene
 */
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

