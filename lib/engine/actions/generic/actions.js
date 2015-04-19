/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Action List actions are actions that modify action lists
//
// A_ChangeActions      - Changes the named actions list

//
// The A_ChangeActions action changes the state of an actions list then exits
// - actions - Path to actions list or instance of actions list
// - action - Action to perform on the actions list (play, pause or restart)
//

/**
 * Action that changes the state of an actions list then exits
 *
 * Created actions should be added to an actor or scenes actions list to be processed
 *
 * For a complete overview of Actions see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actions-building-with-blocks/ Booty5 Actions Overview}
 *
 * @class b5.A_ChangeActions
 * @constructor
 * @returns {b5.A_ChangeActions} The created action
 * @param actions {object} Actions list
 * @param action {string} Action to perform on the actions list (play, pause or restart)
 *
 */
b5.A_ChangeActions = function(actions, action)
{
    this.actions = actions;
    this.action = action;
};
b5.A_ChangeActions.prototype.onInit = function()
{
    this.actions = b5.Utils.resolveObject(this.actions, "actions");
    var actions = this.actions;
    if (actions !== null)
    {
        var action = this.action;
        if (action === "play")
            actions.play();
        else if (action === "pause")
            actions.pause();
        else if (action === "restart")
            actions.restart();
    }
};
b5.ActionsRegister.register("ChangeActions", function(p) { return new b5.A_ChangeActions(p[1], p[2]); });

