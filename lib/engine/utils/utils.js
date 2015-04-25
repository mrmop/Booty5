/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * Generic utility functionality
 *
 *
 * @class b5.Utils
 *
 */
b5.Utils = function()
{
};

/**
 * Loads a JSON file
 * @param filename      {string}    File name
 * @param blocking      {boolean}   If true then file will be loaded synchronously, otherwise asynchronously
 * @param callback      (function)  Callback that will be called when the file has been downloaded
 * @param binary        (boolean)   If true then data is returned as binary
 * @returns {boolean}               true if success, false if error
 */
b5.Utils.loadJSON = function(filename, blocking, callback, binary)
{
    var req = new XMLHttpRequest();
    req.open("GET", filename, !blocking);
    if (binary)
        req.responseType = "arraybuffer";
    if (!blocking)
    {
        req.onreadystatechange = function()
        {
            if (req.readyState === 4)
            {
                if (req.status === 200)
                {
                    if (binary)
                        callback(req.response);
                    else
                        callback(req.responseText);
                }
                else
                    callback(null);
            }
        };
    }
    try
    {
        req.send();
    }
    catch(e)
    {
        return false;
    }

    if (blocking)
    {
        if (req.status === 200)
        {
            if (binary)
                callback(req.response);
            else
                callback(req.responseText);
        }
        else
            callback(null);
    }

    return true;
};

/**
 * Adds a JavaScript file to the head of the document
 * @param filename {string} File name
 */
b5.Utils.loadJS = function(filename)
{
    var fileref = document.createElement('script');
    fileref.setAttribute("type","text/javascript");
    fileref.setAttribute("src", filename);

    if (typeof fileref !== "undefined")
        document.getElementsByTagName("head")[0].appendChild(fileref);
};

/**
 * Finds an actor, scene, timeline or actions list object from a path of the form scene_name.actor_name....
 * @param path {string}     Path to object,, such as scene1.actor1.timeline1
 * @param type {string}     Type of resource (can be timeline, actions, or undefined for scene or actor)
 * @returns {object}        The found object or null if not found
 */
b5.Utils.findObjectFromPath = function(path, type)
{
    var objs = path.split(".");
    var count = objs.length;
    if (count === 0)
        return null;
    var parent = b5.app.findScene(objs[0]);
    if (count === 1 && type === undefined)
        return parent;
    if (count > 1)
    {
        if (type === undefined)
        {
            for (var t = 1; t < count; t++)
                parent = parent.findActor(objs[t]);
            return parent;
        }
        var c = type.charAt(0);
        if (c == 't' && type === "timeline")
        {
            for (var t = 1; t < count - 1; t++)
                parent = parent.findActor(objs[t]);
            if (parent === null) return null;
            return parent.timelines.find(objs[count - 1]);
        }
        if (c == 'a' && type === "actions")
        {
            for (var t = 1; t < count - 1; t++)
                parent = parent.findActor(objs[t]);
            if (parent === null) return null;
            return parent.actions.find(objs[count - 1]);
        }
    }

    if (b5.app.debug)
        console.log("Warning: Could not resolve object for path '" + path + "'");

    return null;
};

/**
 * Finds a resource object from a path of the form scene_name.resource_name
 * @param path {string} Path to resource, for example scene1.shape1
 * @param type {string} Type of resource (brush, sound, shape, material, bitmap)
 * @returns {object}    The found resource or null if not found
 */
b5.Utils.findResourceFromPath = function(path, type)
{
    var objs = path.split(".");
    var count = objs.length;
    if (count === 0)
        return null;
    var parent = b5.app;
    if (count > 1)
        parent = b5.app.findScene(path);

    var res = parent.findResource(objs[count - 1], type);
    if (res !== null)
        return res;

    if (b5.app.debug)
        console.log("Warning: Could not resolve resource for path '" + path + "'");

    return null;
};

/**
 * Takes an object or an object path and returns the found object
 * @param obj_or_path {object|string}   Instance of object or path to object
 * @param type {string}                 Type of resource (can be timeline, actions, or undefined for scene or actor)
 * @returns {object}                    The found object or null
 */
b5.Utils.resolveObject = function(obj_or_path, type)
{
    if (obj_or_path === undefined)
        return null;
    if (typeof obj_or_path === "string")
        return b5.Utils.findObjectFromPath(obj_or_path, type);
    else
        return obj_or_path;
};

/**
 *
 * @param res_or_path {string}  Instance of resource or path to resource, for example scene1.shape1
 * @param type {string}         Type of resource (brush, sound, shape, material, bitmap)
 * @returns {object}            The found resource or null if not found
 */
b5.Utils.resolveResource = function(res_or_path, type)
{
    if (res_or_path === undefined)
        return null;
    if (typeof res_or_path === "string")
        return b5.Utils.findResourceFromPath(res_or_path, type);
    else
        return res_or_path;
};

//
/**
 * Returns the correct resource buffer based on resourced type
 * @param parent {object}   Parent resource container
 * @param type {string}     The type of resource
 * @returns {object}        The resource buffer or null if not found
 */
b5.Utils.getResFromType = function(parent, type)
{
    var c = type.charAt(0);
    if (c == 'b')
    {
        if (type === "brush")
            return parent.brushes;
        else if (type === "bitmap")
            return parent.bitmaps;
    }
    else if (c == 's')
    {
        if (type === "sound")
            return parent.sounds;
        else if (type === "shape")
            return parent.shapes;
    }
    else if (c == 'm' && type === "material")
        return parent.materials;
    return null;
};

/**
 * Used by actors and scenes to sort their children into layers
 * @param objs {object} Actor or scene array
 */
b5.Utils.sortLayers = function(objs)
{
    var cnt = objs.length;
    var s, t;
    for (t = 0; t < cnt; t++)
    {
        for (s = t + 1; s < cnt; s++)
        {
            if (objs[t].layer > objs[s].layer)
            {
                var obj = objs[t];
                objs[t] = objs[s];
                objs[s] = obj;
            }
        }
    }
};

