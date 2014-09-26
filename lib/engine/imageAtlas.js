/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// An ImageAtlas object (also known as an Image Brush) represents bitmap and a collection of sub images within that
// bitmap. Generally an ImageAtlas should be added to either a scene or the global app's resources so that it can be
// managed by them. Image atlases are used by Actors to create frame based bitmap animations.
//
function ImageAtlas(name, bitmap, x, y, w, h)
{
    // Internal variables
    this.frames = [];                   // Array of atlas frame objects in the form {x, y, w, h}

    // Public variables
    this.name = name;					// Atlas name
    this.bitmap = bitmap;				// The bitmap object that images will be used asa source for sub images

    if (x != undefined && y != undefined && w != undefined && h != undefined)
        this.addFrame(x, y, w, h);
}

ImageAtlas.prototype.addFrame = function(sx, sy, sw, sh)
{
    this.frames.push({x: sx, y: sy, w: sw, h: sh});
};

ImageAtlas.prototype.getFrame = function(index)
{
    return this.frames[Math.floor(index)];
};

ImageAtlas.prototype.getMaxFrames = function()
{
    return this.frames.length;
};

ImageAtlas.prototype.generate = function(frame_w, frame_h, count_x, count_y)
{
    var fy = 0;
    for (var y = 0; y < count_y; y++)
    {
        var fx = 0;
        for (var x = 0; x < count_x; x++)
        {
            this.addFrame(fx, fy, frame_w, frame_h);
            fx += frame_w;
        }
        fy += frame_h;
    }
};
