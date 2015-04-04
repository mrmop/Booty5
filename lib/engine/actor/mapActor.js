/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// A MapActor is derived from an Actor that displays a Tiled Map. MapActor inherits all properties, functions and so
// forth from its parent. A MapActor should be added to a Scene or another Actor once created.
//
//// Example showing how to create a MapActor
// var map = new b5.MapActor();
// map.map_width = 100;
// map.map_height = 100;
// map.display_width = 16;
// map.display_height = 16;
// map.generateTiles(32, 64, 64, 256);
// map.bitmap = new b5.Bitmap("tiles", "testmap.png", true);
// for (var t = 0; t < map.map_width * map.map_height; t++)
//     map.map.push((Math.random() * 36) << 0);
// scene.addActor(map);          // Add actor to scene for processing and drawing

b5.MapActor = function()
{
    // Public variables
    this.tiles = [];                        // Array of tiles (tiles contain x,y offsets of each tile in source bitmap)
    this.map = [];                          // Array of tile indices
    this.collision_map = [];                // Array of collision tile indices
    this.tile_width = 32;                   // Width of each tile
    this.tile_height = 32;                  // Height of each tiles
    this.map_width = 0;                     // Width of map in tiles
    this.map_height = 0;                    // Height of map in tiles
    this.display_width = 8;                 // Map display width in tiles
    this.display_height = 8;                // Map display height in tiles

    // Call constructor
    b5.Actor.call(this);

    this.type = b5.Actor.Type_Rect;    // Type of actor
};
b5.MapActor.prototype = new b5.Actor();
b5.MapActor.prototype.constructor = b5.MapActor;
b5.MapActor.prototype.parent = b5.Actor.prototype;

b5.MapActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

b5.MapActor.prototype.generateTiles = function(count, tile_w, tile_h, bitmap_w)
{
    var px = 0.5;
    var py = 0.5;
    for (var t = 0; t < count; t++)
    {
        this.tiles[t] = {x: px, y:py};
        px += tile_w;
        if (px >= bitmap_w)
        {
            px = 0.5;
            py += tile_h;
        }
    }
    this.tile_width = tile_w;
    this.tile_height = tile_h;
};

b5.MapActor.prototype.setTile = function(x, y, tile, collision)
{
    var mapw = this.map_width;
    var maph = this.map_height;
    if (x < 0 || x >= mapw)
        return;
    if (y < 0 || y >= maph)
        return;

    if (collision !== undefined && collision)
        this.collision_map[y * mapw + x] = tile;
    else
        this.map[y * mapw + x] = tile;
};

b5.MapActor.prototype.getTile = function(x, y, collision)
{
    var mapw = this.map_width;
    var maph = this.map_height;
    if (x < 0 || x >= mapw)
        return -1;
    if (y < 0 || y >= maph)
        return -1;

    if (collision !== undefined && collision)
        return this.collision_map[y * mapw + x];

    return this.map[y * mapw + x];
};

b5.MapActor.prototype.getTileXY = function(x, y)
{
    var mapw = this.map_width;
    var maph = this.map_height;
    var tilew = this.tile_width;
    var tileh = this.tile_height;

    return {
        x: Math.round((x - tilew / 2) / tilew) + (mapw >> 1),
        y: Math.round((y - tileh / 2) / tileh) + (maph >> 1)
    };
};

b5.MapActor.prototype.getTilePosition = function(x, y, position)
{
    var tilew = this.tile_width;
    var tileh = this.tile_height;
    var xy = this.getTileXY(x, y);
    xy.x -= this.map_width >> 1;
    xy.y -= this.map_height >> 1;
    xy.x *= tilew;
    xy.y *= tileh;

    if (position === "m")
        xy.y += tileh / 2;
    else if (position === "b")
        xy.y += tileh;
    else if (position === "c")
        xy.x += tilew / 2;
    else if (position === "r")
        xy.x += tilew;

    return xy;
};

b5.MapActor.prototype.getTileFromPosition = function(x, y, collision)
{
    var xy = this.getTileXY(x, y);
    return this.getTile(xy.x, xy.y, collision);
};

b5.MapActor.prototype.draw = function()
{
    if (!this.visible)
        return;

    var scene = this.scene;
    var app = scene.app;
    var dscale = app.canvas_scale;
    var disp = app.display;
    this.preDraw();

    var mx = app.canvas_cx + scene.x * dscale;
    var my = app.canvas_cy + scene.y * dscale;

    if (!this.ignore_camera && (this.depth === 0 || this.depth === 1))
    {
        mx -= scene.camera_x * dscale;
        my -= scene.camera_y * dscale;
    }
    this.updateTransform();
    var trans = this.transform;
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, trans[4] * dscale + mx, trans[5] * dscale + my);

    var x, y, ti, tile;
    var mapw = this.map_width;
    var maph = this.map_height;
    var tilew = this.tile_width;
    var tileh = this.tile_height;
    var map = this.map;
    var tiles = this.tiles;
    var bitmap;
    if (this.bitmap !== null)
        bitmap = this.bitmap;
    else
    if (this.atlas !== null)
        bitmap = this.atlas.bitmap;
    var image = bitmap.image;

    var dx = this.display_width;
    var dy = this.display_height;

    // Calculate tile at top left hand corner of visible map area
    if (dx !== mapw)
        mx = (((scene.camera_x - this.x) / tilew) - (dx >> 1)) << 0;
    else
        mx = -dx >> 1;
    var omx = mx;
    if (dy !== maph)
        my = (((scene.camera_y - this.y) / tileh) - (dy >> 1)) << 0;
    else
        my = -dy >> 1;

    // Calculate offset in scene
    var sx = mx * tilew;
    var osx = sx;
    var sy = my * tileh;

    // Centre map
    mx += mapw >> 1;
    omx = mx;
    my += maph >> 1;

    // Draw tiles
    for (y = 0; y < dy; y++)
    {
        if (my >= 0 && my < maph)
        {
            mx = omx;
            sx = osx;
            for (x = 0; x < dx; x++)
            {
                if (mx >= 0)
                {
                    ti = map[my * mapw + mx];
                    tile = tiles[ti];
                    disp.drawAtlasImage(image, tile.x, tile.y, tilew - 1, tileh - 1, sx, sy, tilew + 1, tileh + 1);
                }
                sx += tilew;
                mx++;
                if (mx >= mapw)
                    break;
            }
        }
        sy += tileh;
        my++;
        if (my >= maph)
            break;
    }

    this.postDraw();

    // Draw child actors
    var count = this.actors.length;
    if (count > 0)
    {
        var acts = this.actors;
        for (var t = 0; t < count; t++)
            acts[t].draw();
    }
};

