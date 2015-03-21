/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Generic utility functionality
//
b5.Utils = function()
{
};

// Finds an actor, scene, timeline or actions list object from a path of the form scene_name.actor_name....
// - path - Path to object
// - type - Type of object (timeline, actions, or undefined for actor or scene)
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

// Finds a resource object from a path of the form scene_name.resource_name
// - path - Path to resource
// - type - Type of resource (brush, sound, shape, material, bitmap)
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

// Takes an object or an object path and returns the found object
// - obj_or_path - An instance of an object or path to the object
// - type - Type of object (timeline, actions, or undefined for actor or scene)
b5.Utils.resolveObject = function(obj_or_path, type)
{
    if (obj_or_path === undefined)
        return null;
    if (typeof obj_or_path === "string")
        return b5.Utils.findObjectFromPath(obj_or_path, type);
    else
        return obj_or_path;
};

// Takes a resource or a resource path and returns the found resource
// - res_or_path - An instance of a resource or path to the resource
// - type - Type of resource (brush, sound, shape, material, bitmap)
b5.Utils.resolveResource = function(res_or_path, type)
{
    if (res_or_path === undefined)
        return null;
    if (typeof res_or_path === "string")
        return b5.Utils.findResourceFromPath(res_or_path, type);
    else
        return res_or_path;
};

// Returns the correct resource buffer based on resourced type
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

// Sorts an array of objects by layer
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

