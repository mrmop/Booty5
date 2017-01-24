/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";

/**
 * A Task is a function that is ran every game update that can be paused, played and stopped.
 *
 * @class b5.Task
 * @constructor
 * @returns {b5.Task}               - The created task
 *
 * @property {string} name          - The name of the task
 * @property {function} func        - The function to call each update
 * @property {object} data          - User supplied data which is passed back
 * @property {number} state         - Current state of the task
 * @property {number} running_time  - The amount of time the task has been running in seconds
 * @property {number} delay         - Amount of time in seconds to wait before running, pass -1 to not start at all
 * @property {number} loops         - The number of times the task has been ran
 * @property {number} repeat        - Number of times to run task, pass 0 to run forever, note that the task will be removed from the list when it runs out
 * @property {number} last_time     - The amount of time that has passed since the last time the task was ran 
 * @property {number} wait          - The amount of time to wait before calling this task again 
 */
b5.Task = function(name, delay, repeat, func, data)
{
    this.name = name;
    this.func = func;
    this.data = data;
    this.state = b5.Task.Stopped;
    this.running_time = 0;
    this.delay = delay;
    this.loops = 0;
    this.repeat = repeat;
    this.last_time = 0;
    this.wait = 0;

    this.pause = function()
    {
        this.state = b5.Task.Paused;
    };
    this.play = function()
    {
        this.state = b5.Task.Running;
    };
    this.stop = function()
    {
        this.state = b5.Task.Stopped;
    };

    if (delay === 0)
        this.play();
    else
    if (delay > 0)
        this.state = b5.Task.Dormant;
};

/**
 * The task is in a dormant state (waiting to be ran)
 * @constant
 */
b5.Task.Dormant = 0;
/**
 * The task is in a running state
 * @constant
 */
b5.Task.Running = 1;
/**
 * The task is in a paused state
 * @constant
 */
b5.Task.Paused = 2;
/**
 * The task is in astopped state
 * @constant
 */
b5.Task.Stopped = 3;

/**
 * A TasksManager manages a collection of Tasks. The App and each Actor / Scene has its own TasksManager
 *
 *      // An example showing how to create a task that starts after 3 seconds and runs 10 times
 *      var app = b5.app;
 *      var task = app.tasks.add("task1", 3, 10, function(task)
 *      {
 *          console.log("Task ran");
 *          console.log(task);
 *      }, this);
 *
 *      // An example showing how to create a task that starts after 3 seconds and runs 10 times every 2 seconds
 *      var app = b5.app;
 *      app.tasks.add("task1", 3, 10, function(task)
 *      {
 *          console.log("Task ran");
 *          console.log(task);
 *      }, this).wait = 2;
 *
 * @class b5.TasksManager
 * @constructor
 * @returns {b5.TasksManager}               - The created tasks manager
 *
 * @property {b5.Task[]} tasks              - Array of tasks that are managed by this manager
 */
b5.TasksManager = function()
{
    // Public variables
    this.tasks = [];                  // Array of tasks
};

/**
 * Adds the named task to the manager
 * @param task_name {string}        The name of the task
 * @param delay_start {number}      Amount of time to wait before starting the task
 * @param repeats {number}          Number of times to repeat the task before destroying it, pass -1 to run forever
 * @param task_function {function}  The task function to call
 * @param task_data {object}        Data that is passed to the task function when called
 * @returns {b5.Task}               The added task
 */
b5.TasksManager.prototype.add = function(task_name, delay_start, repeats, task_function, task_data)
{
    var task = new b5.Task(task_name, delay_start, repeats, task_function, task_data);
    this.tasks.push(task);
    return task;
};

/**
 * Removes the named task from the manager
 * @param task_name {string}        The name of the task
 */
b5.TasksManager.prototype.remove = function(task_name)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t].name === task_name)
        {
            tasks.splice(t, 1);
            return;
        }
    }
};

/**
 * Removes the task from the manager
 * @param task {string}             The task to remove
 */
b5.TasksManager.prototype.removeTask = function(task)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t] === task)
        {
            tasks.splice(t, 1);
            return;
        }
    }
};

/**
 * Finds the named task
 * @param task_name {string}        The name of the task
 * @returns {b5.Task}               The found task or null if not found
 */
b5.TasksManager.prototype.find = function(task_name)
{
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        if (tasks[t].name === task_name)
        {
            return tasks[t];
        }
    }
    return null;
};

/**
 * Removes all tasks from the manager
 */
b5.TasksManager.prototype.clear = function()
{
    this.tasks = [];
};

/**
 * Executes all running tasks within this tasks manager, automatically called by parent app or scene
 */
b5.TasksManager.prototype.execute = function()
{
    var removals = [];
    var dt = b5.app.dt;
    var tasks = this.tasks;
    var count = tasks.length;
    for (var t = 0; t < count; t++)
    {
        var task = tasks[t]; 
        if (task.state === b5.Task.Dormant)
        {
            task.running_time += dt;
            if (task.running_time >= task.delay)
			{
                task.play();
				task.running_time -= dt;
			}
        }
        if (task.state === b5.Task.Running)
        {
            var run = true;
            if (task.wait !== 0)
            {
                task.last_time += dt;
                if (task.last_time >= task.wait)
                    task.last_time -= task.wait;
                else
                    run = false;
            }
            if (run === true)
            {
                task.func(task);
                task.running_time += dt;
                if (task.repeat > 0)
                {
                    task.loops++;
                    if (task.loops >= task.repeat)
                    {
                        removals.push(task);
                        task.stop();
                    }
                }
            }
        }
    }
    // Remove destroyed tasks
    for (var t = 0; t < removals.length; t++)
        this.removeTask(removals[t]);
};

