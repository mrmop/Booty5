/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// An ImageAtlas object (also known as an Image Brush) represents bitmap and a collection of sub images within that
// bitmap. Generally an ImageAtlas should be added to either a scene or the global app's resources so that it can be
// managed by them. Image atlases are used by Actors to create frame based bitmap animations.
//
//// Adding bitmap animation to an actor
// actor.atlas = new ImageAtlas("sheep", new Bitmap("sheep", "images/sheep.png", true));
// actor.atlas.addFrame(0,0,86,89);     // Add frame 1 to the atlas
// actor.atlas.addFrame(86,0,86,89);    // Add frame 2 to the atlas
// actor.frame = 0;                     // Set initial animation frame
// actor.frame_speed = 0.5;             // Set animation playback speed
//
//// Automatically generating frames
// var atlas = new ImageAtlas("car_anim", new Bitmap("car_anims", "images/car_anims.png", true));
// atlas.generate(0, 0, 64, 32, 10, 2);

function ImageAtlas(name, bitmap, x, y, w, h)
{
    // Internal variables
    this.frames = [];                   // Array of atlas frame objects in the form {x, y, w, h}

    // Public variables
    this.parent = null;                 // Parent container
    this.name = name;					// Atlas name
    this.bitmap = bitmap;				// The bitmap object that images will be used asa source for sub images

    if (x !== undefined && y !== undefined && w !== undefined && h !== undefined)
        this.addFrame(x, y, w, h);
}

ImageAtlas.prototype.addFrame = function(sx, sy, sw, sh)
{
    this.frames.push({x: sx, y: sy, w: sw, h: sh});
};

ImageAtlas.prototype.getFrame = function(index)
{
    return this.frames[index];
};

ImageAtlas.prototype.getMaxFrames = function()
{
    return this.frames.length;
};

ImageAtlas.prototype.generate = function(start_x, start_y, frame_w, frame_h, count_x, count_y, total)
{
    if (total !== undefined)
        total = count_x * count_y;
    var fy = start_y;
    for (var y = 0; y < count_y; y++)
    {
        var fx = start_x;
        for (var x = 0; x < count_x; x++)
        {
            this.addFrame(fx, fy, frame_w, frame_h);
            fx += frame_w;
            total--;
            if (total <= 0)
                return;
        }
        fy += frame_h;
    }
};

ImageAtlas.prototype.destroy = function()
{
    if (this.parent != null)
        this.parent.removeResource(this, "brush");
};

