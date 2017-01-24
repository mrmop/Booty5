/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * An ImageAtlas object (also known as an Image Brush) represents a {@link b5.Bitmap} and a collection of sub images
 * within that bitmap. Generally an ImageAtlas should be added to either a {@link b5.Scene} or the global {@link b5.App}'s
 * resources so that it can be managed by them. Image atlases are used by {@link b5.Actor}'s to create frame based
 * bitmap animations.
 *
 * Example showing how to create a bitmap animation and attach it to an Actor
 *
 *      actor.atlas = new ImageAtlas("sheep", new Bitmap("sheep", "images/sheep.png", true));
 *      actor.atlas.addFrame(0,0,86,89,0,0);    // Add frame 1 to the atlas
 *      actor.atlas.addFrame(86,0,86,89,0,0);   // Add frame 2 to the atlas
 *      actor.frame = 0;                        // Set initial animation frame
 *      actor.frame_speed = 0.5;                // Set animation playback speed
 *
 * Example showing how to automatically generate animation frames
 *
 *      var atlas = new ImageAtlas("car_anim", new Bitmap("car_anims", "images/car_anims.png", true));
 *      atlas.generate(0, 0, 64, 32, 10, 2);
 * 
 * You can also add collection of animations to a brush which can be played back on an actor that uses the brush, e.g.:
 * 
 *      actor.atlas = new ImageAtlas("sheep", new Bitmap("sheep", "images/sheep.png", true));
 *      actor.atlas.addFrame(0,0,32,32,0,0);    // Add frame 1 to the atlas
 *      actor.atlas.addFrame(32,0,32,32,0,0);   // Add frame 2 to the atlas
 *      actor.atlas.addFrame(64,0,32,32,0,0);   // Add frame 3 to the atlas
 *      actor.atlas.addFrame(96,0,32,32,0,0);   // Add frame 4 to the atlas
 *      actor.atlas.addFrame(128,0,32,32,0,0);   // Add frame 5 to the atlas
 *      actor.atlas.addFrame(160,0,32,32,0,0);   // Add frame 6 to the atlas
 *      actor.atlas.addAnim("walk", [0, 1, 2, 3], 10);
 *      actor.atlas.addAnim("idle", [4, 5], 10);
 *      actor.playAnim("walk");
 * 
 *
 * For a complete overview of Resources see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/resources-the-stuff-that-games-are-made-of/ Booty5 Resources Overview}
 *
 * @class b5.ImageAtlas
 * @constructor
 * @returns {b5.ImageAtlas}                 The created ImageAtlas
 * @param name {string}                     Name of image atlas resource
 * @param bitmap {b5.Bitmap}                Bitmap that contains frames
 * @param x {number}                        X pixel coordinate of top left hand corner of frame to add
 * @param y {number}                        Y pixel coordinate of top left hand corner of frame to add
 * @param w {number}                        Width of frame in pixels
 * @param h {number}                        Height of frame in pixels
 * @param ox {number}                       Offset of the frame on the x-axis
 * @param oy {number}                       Offset of the frame on the y-axis
 *
 * @property {object[]}                 frames          - Array of atlas frame objects in the form {x, y, w, h} (internal)
 * @property {b5.App|b5.Scene}          parent          - Parent resource manager (internal)
 * @property {string}                   name            - Name of this image atlas resource
 * @property {b5.Bitmap}                bitmap          - The bitmap object that images will be used asa source for sub images
 */
b5.ImageAtlas = function(name, bitmap, x, y, w, h, ox, oy)
{
    // Internal variables
    this.frames = [];                   // Array of atlas frame objects in the form {x, y, w, h}
    this.anims = [];                    // Array of brush animations {indices, speed} (name of animation, brush frame indices, speed of playback in fps), anim name is array index
    this.parent = null;                 // Parent container

    // Public variables
    this.name = name;					// Atlas name
    this.bitmap = bitmap;				// The bitmap object that images will be used asa source for sub images

    if (x !== undefined && y !== undefined && w !== undefined && h !== undefined)
        this.addFrame(x, y, w, h, ox, oy);
};

/**
 * Adds the specified atlas frame
 * @param sx {number} X pixel coordinate of top left hand corner of frame to add
 * @param sy {number} Y pixel coordinate of top left hand corner of frame to add
 * @param sw {number} Width of frame in pixels
 * @param sh {number} Height of frame in pixels
 * @param ox {number} Offset of the frame on the x-axis
 * @param oy {number} Offset of the frame on the y-axis
 */
b5.ImageAtlas.prototype.addFrame = function(sx, sy, sw, sh, ox, oy)
{
    if (ox === undefined)
        ox = 0;
    if (oy === undefined)
        oy = 0;
    this.frames.push({ x: sx, y: sy, w: sw, h: sh, ox: ox, oy: oy });
};

/**
 * Returns the atlas frame at the specified index
 * @param index {number} Atlas frame index
 * @returns {Object} The atlas frame
 */
b5.ImageAtlas.prototype.getFrame = function(index)
{
    return this.frames[index];
};

/**
 * Returns total number of atlas frames int this atlas image
 * @returns {Number} Total number of frames in the atlas image
 */
b5.ImageAtlas.prototype.getMaxFrames = function()
{
    return this.frames.length;
};


/**
 * Adds the specified animation to the atlas
 * @param name {string} Name of the animation to add
 * @param indices {array} Array of frame indices
 * @param speed {number} Speed at which to play the animation in frames per second
 */
b5.ImageAtlas.prototype.addAnim = function(name, indices, speed)
{
    this.anims[name] = { indices: indices, speed: speed };
};

/**
 * Returns the specified animation
 * @param index {numer} Atlas frame index
 * @returns {Object} The atlas frame
 */
b5.ImageAtlas.prototype.getAnim = function(name)
{
    return this.anims[name];
};

/**
 * Generates multiple atlas frames, working from left to right, top to bottom
 * @param start_x {number} X pixel coordinate of top left hand corner of start point
 * @param start_y {number} Y pixel coordinate of top left hand corner of start point
 * @param frame_w {number} Width of each frame in pixels
 * @param frame_h {number} Height of each frame in pixels
 * @param count_x {number} Total frames to generate across the image
 * @param count_y {number} Total frames to generate down the image
 * @param total {number} Optional parameter that can be used to limit total number of generated frames
 */
b5.ImageAtlas.prototype.generate = function(start_x, start_y, frame_w, frame_h, count_x, count_y, total)
{
    if (total !== undefined)
        total = count_x * count_y;
    var fy = start_y;
    for (var y = 0; y < count_y; y++)
    {
        var fx = start_x;
        for (var x = 0; x < count_x; x++)
        {
            this.addFrame(fx, fy, frame_w, frame_h, 0, 0);
            fx += frame_w;
            total--;
            if (total <= 0)
                return;
        }
        fy += frame_h;
    }
};

/**
 * Removes the atlas from the scene / app and destroys it
 */
b5.ImageAtlas.prototype.destroy = function()
{
    if (this.parent !== null)
        this.parent.removeResource(this, "brush");
};

