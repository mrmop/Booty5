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
    req.overrideMimeType("application/json");
    if (binary)
        req.responseType = "arraybuffer";
    if (!blocking)
    {
        req.onreadystatechange = function()
        {
            if (req.readyState === 4)
            {
                if (req.status === 200 || req.status === 0) // 0 for node-webkit
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
 * Sends a get request over http
 * @param url {string} URL + data
 * @parm callback (function) Callback to call when complete
 */
b5.Utils.SendGetRequest = function(url, callback)
{
    var req = new XMLHttpRequest();
    req.onreadystatechange = function()
	{ 
        //if (callback != undefined && req.readyState == 4 && req.status == 200)
            //callback(req.responseText);
        if (callback != undefined)
        {
            callback(req);
        }
    }
    req.open("GET", url, true);
    req.send();
}

/**
 * Sends JSON using a post request over http
 * @param url {string} URL
 * @param json {string} JSON data
 * @parm callback (function) Callback to call when complete
 */
b5.Utils.SendPostJSONRequest = function(url, json, callback)
{
    var req = new XMLHttpRequest();
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.onreadystatechange = function()
	{ 
        //if (callback != undefined && req.readyState == 4 && req.status == 200)
            //callback(req.responseText);
        if (callback != undefined)
        {
            callback(req);
        }
    }
    req.send(JSON.stringify(json));
}

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
            if (parent === null)
            {
                if (b5.app.debug)
                    console.log("Warning: Could not resolve object with path '" + path + "'");
                return null;
            }
            return parent;
        }
        var c = type.charAt(0);
        if (c == 't' && type === "timeline")
        {
            for (var t = 1; t < count - 1; t++)
                parent = parent.findActor(objs[t]);
            if (parent === null)
            {
                if (b5.app.debug)
                    console.log("Warning: Could not resolve timeline with path '" + path + "'");
                return null;
            }
            return parent.timelines.find(objs[count - 1]);
        }
        if (c == 'a' && type === "actions")
        {
            for (var t = 1; t < count - 1; t++)
                parent = parent.findActor(objs[t]);
            if (parent === null)
            {
                if (b5.app.debug)
                    console.log("Warning: Could not resolve actions with path '" + path + "'");
                return null;
            }
            return parent.actions.find(objs[count - 1]);
        }
    }

    if (b5.app.debug)
        console.log("Warning: Could not resolve object with path '" + path + "'");

    return null;
};

/**
 * Finds a resource object from a path of the form scene_name.resource_name
 * @param path {string} Path to resource, for example scene1.shape1
 * @param type {string} Type of resource (brush, sound, shape, material, bitmap, font)
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
 * @param type {string}         Type of resource (brush, sound, shape, material, bitmap, font)
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
    else if (type === "raw")
        return parent.raw;
    else if (type === "font")
        return parent.fonts;
    
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

/**
 * Creates a HTML5 canvas and adds it to the document
 * @param id {string}       Canvas identifier
 * @param width {nunber}    Width of canvas
 * @param height {nunber}   Height of canvas
 * @param zindex {nunber}   Z-index of canvas
 * @returns {object}        The created canvas
 */
b5.Utils.CreateCanvas = function(id, width, height, zindex)
{
    var canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.width = width;
    canvas.style.width = width + "px";
    canvas.height = height;
    canvas.style.height = height + "px";
    canvas.style.zIndex = zindex;
    canvas.style.position = "fixed";
    canvas.style.display = "block";
    canvas.style.left =	0;
    canvas.style.top = 0;
    canvas.style.right =	0;
    canvas.style.bottom = 0;
    canvas.style.margin = "auto";
    canvas.style.pointerEvents = "auto";
    canvas.style.visibility = "visible";
    //canvas.style.background = "#80ff80";
    //parent.appendChild(canvas);
    document.body.appendChild(canvas);
    return canvas;
};

b5.Utils.GetDevicePixelRatio = function()
{
    if (window.devicePixelRatio !== undefined)
    {
        return window.devicePixelRatio;
    }
    var screen = window.screen;
    return (screen !== undefined && screen.systemXDPI !== undefined && screen.logicalXDPI !== undefined && screen.systemXDPI > screen.logicalXDPI) ? (screen.systemXDPI/screen.logicalXDPI) : 1;
};

b5.Utils.GetBackingStorePixelRatio = function(context)
{
    return context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio || 1;
};

b5.Utils.RunafterTime = function(delay, task_function, task_data)
{
    b5.app.addTask("", delay, 1, task_function, task_data);
};


b5.Utils.SetFullscreen = function(enable)
{
    if (!document.fullscreenEnabled)
    {
        return;
    }

    if (enable)
    {
        if (document.fullscreenElement == null)
        {
            b5.app.canvas.requestFullscreen();
        }
    }
    else
    {
        if (document.fullscreenElement != null)
        {
            document.exitFullscreen();
        }
    }
};

b5.Utils.IsMobile = function()
{
    var ua = navigator.userAgent;
    function IsAndroid() {
        return ua.match(/Android/i);
    }
    function IsBlackBerry() {
        return ua.match(/BlackBerry/i);
    }
    function IsiOS() {
        return ua.match(/iPhone|iPad|iPod/i);
    }
    function IsOpera() {
        return ua.match(/Opera Mini/i);
    }
    function IsWindows() {
        return ua.match(/IEMobile/i);
    }
    return (IsAndroid() || IsBlackBerry() || IsiOS() || IsOpera() || IsWindows());
};

b5.Utils.GetPlatform = function()
{
    var ua = navigator.userAgent;
    if (ua.match(/Android/i))
        return "ANDROID";
    if (ua.match(/BlackBerry/i))
        return "BLACKBERRY";
    if (ua.match(/iPhone|iPad|iPod/i))
        return "IOS";
    if (ua.match(/Opera Mini/i))
        return "OPERA";
    if (ua.match(/IEMobile/i))
        return "WINDOWS"
    return "WEB";
};
