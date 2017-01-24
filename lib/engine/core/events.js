/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * An events manager can be attached to an object and used to handle named user event subscription and notification. 
 *
 * Example showing how to subscribe and raise events:
 *
 *      var app = b5.app;
 *      app.events.on("Hello", function(event)
 *      {
 *          console.log("Hello event was raised by app");
 *          console.log(event);
 *      }, this);
 *	
 *      app.events.dispatch("Hello");
 *	
 *      var scene = b5.Utils.findObjectFromPath("gamescene");
 *      scene.events.on("Hello", function(event)
 *      {
 *          console.log("Hello event was raised by scene");
 *          console.log(event);
 *      }, this);
 *
 *      scene.events.dispatch("Hello");
 *
 * @class b5.EventManager
 * @constructor
 * @returns {b5.EventManager}               The created events manager
 *
 * @property {object[]}                 events          - Evenst list
 */
b5.EventsManager = function()
{
    // Internal variables
    this.events = [];               // Events
};

/**
 * Add the specified named event and function pair to the events manager
 * @param event_name {string}           Name of event to listen to
 * @param event_function {function}     Function to call when this event is raised
 * @param event_data {object}           Data to pass to the function   
 */
b5.EventsManager.prototype.on = function(event_name, event_function, event_data)
{
    this.events.push({ name:event_name, func:event_function, data:event_data });
};

/**
 * Removes the specified event from the events manager
 * @param event_name {string}   Name of event to remove
 */
b5.EventsManager.prototype.remove = function(event_name)
{
    var events = this.events;
    var count = events.length;
    this.events = array.filter(function(element)
    {
        return element.name !== event_name;
    });
};

/**
 * Removes all events from the manager
 */
b5.EventsManager.prototype.clear = function()
{
    this.events = [];
};

/**
 * Dispatches the specified event calling the attached functions
 * @param event_name {string}   Name of event to dispatch
 */
b5.EventsManager.prototype.dispatch = function(event_name)
{
    var events = this.events;
    var count = events.length;
    for (var t = 0; t < count; t++)
    {
        if (events[t].name === event_name)
        {
            events[t].func(events[t]);
            return;
        }
    }
};


