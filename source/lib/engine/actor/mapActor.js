/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
/**
 * A MapActor is derived from a {@link b5.Actor} that displays tiled map game objects instead of a single image and
 * inherits all properties, methods and so forth from its parent. A MapActor should be added to a {@link b5.Scene}
 * or another {@link b5.Actor} that is part of a scene hierarchy
 *
 * <b>Examples</b>
 *
 * Example showing how to create a MapActor:
 *
 *      var map = new b5.MapActor();         // Create instance of actor
 *      map.map_width = 100;                 // Set map width in cells
 *      map.map_height = 100;                // Set map height in cells
 *      map.display_width = 16;              // Set how many cells to display on x axis
 *      map.display_height = 16;             // Set how many cells to display on y axis
 *      map.generateTiles(32, 64, 64, 256);  // Generate the tile set
 *      map.bitmap = new b5.Bitmap("tiles", "testmap.png", true);   // Set tile set bitmap
 *      for (var t = 0; t &lt; map.map_width * map.map_height; t++) // Generate a random map
 *      map.map.push((Math.random() * 32) &lt;&lt; 0);
 *      scene.addActor(map);                  // Add to scene for processing and drawing
 *
 * For a complete overview of the Actor class see {@link http://booty5.com/html5-game-engine/booty5-html5-game-engine-introduction/actors/ Booty5 Actor Overview}
 *
 * @class b5.MapActor
 * @augments b5.Actor
 * @constructor
 * @returns {b5.MapActor} The created MapActor
 *
 * @property {object[]}                 tiles                               - Array of tiles (tiles contain x,y offsets of each tile in source bitmap)
 * @property {number[]}                 map                                 - Array of tile indices, each index is an index into the tile set
 * @property {number[]}                 collision_map                       - Array of collision tile indices
 * @property {number}                   tile_width                          - Width of each tile
 * @property {number}                   tile_height                         - Height of each tiles
 * @property {number}                   map_width                           - Width of map in tiles
 * @property {number}                   map_height                          - Height of map in tiles
 * @property {number}                   display_width                       - Map display width in tiles
 * @property {number}                   display_height                      - Map display height in tiles
 *
 */

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

    this.type = b5.Actor.Type_Map;    // Type of actor
};
b5.MapActor.prototype = new b5.Actor();
b5.MapActor.prototype.constructor = b5.MapActor;
b5.MapActor.prototype.parent = b5.Actor.prototype;

b5.MapActor.prototype.update = function(dt)
{
    return this.baseUpdate(dt);
};

/**
 * Generates a group of tiles (a tile set) from the supplied parameters
 * @param count {number}    Total number of tiles to generate
 * @param tile_w {number}   Width of each tile
 * @param tile_h {number}   Height of each tile
 * @param bitmap_w {number} Width of tile set bitmap
 */
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

/**
 * Sets the tile at map cell x,y
 * @param x {number} Map horizontal cell coordinate
 * @param y {number} Map vertical cell coordinate
 * @param tile {number} Tile number to set to cell
 * @param collision {boolean} If true then tile in the collision map will be written instead of visual map
 */
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

/**
 * Gets the tile index at map cell x,y
 * @param x {number} Map horizontal cell coordinate
 * @param y {number} Map vertical cell coordinate
 * @param collision {boolean} If true then returned tile will be taken from collision map instead of visual map
 * @returns {number} The tile index
 */
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

/**
 * Converts the supplied scene coordinate to a map cell coordinate
 * @param x {number} x-axis coordinate in scene space
 * @param y {number} y-axis coordinate in scene space
 * @returns {{x: number, y: number}} Map cell coordinate {x, y}
 */
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

/**
 * Calculates the scene coordinate for the specified edge of a tile. The supplied position can be one of the following:
 *
 * @param x {number} x-axis coordinate in scene space
 * @param y {number} y-axis coordinate in scene space
 * @param position {string} Can be one of the following strings:
 *
 * - "t" - Returns coordinate of top edge of tile
 * - "m" - Returns coordinate of middle of tile
 * - "b" - Returns coordinate of bottom edge of tile
 * - "l" - Returns coordinate of left edge of tile
 * - "c" - Returns coordinate of centre of tile
 * - "r" - Returns coordinate of right edge of tile
 *
 * @returns {{x: number, y: number}} The tiles coordinate {x, y}
 */
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

/**
 * Gets the map tile at cell position x, y
 * @param {number} x Scene coordinate on x-axis
 * @param {number} y Scene coordinate on y-axis
 * @param collision {boolean} If true then returned tile will be taken from collision map instead of visual map
 * @returns {number|*}
 */
b5.MapActor.prototype.getTileFromPosition = function(x, y, collision)
{
    var xy = this.getTileXY(x, y);
    return this.getTile(xy.x, xy.y, collision);
};

/**
 * Overrides the base {@link b5.Actor}.draw() method to draw a tiled map instead of an image
 */
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
    var tx = trans[4] * dscale + mx;
    var ty = trans[5] * dscale + my;
    if (this.round_pixels)
    {
        tx = (tx + 0.5) | 0;
        ty = (ty + 0.5) | 0;
    }
    disp.setTransform(trans[0] * dscale, trans[1] * dscale, trans[2] * dscale, trans[3] * dscale, tx, ty);

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
        mx = ((((scene.camera_x - this.x) / tilew) - (dx >> 1)) + 0.5) | 0;
    else
        mx = -dx >> 1;
    var omx = mx;
    if (dy !== maph)
        my = ((((scene.camera_y - this.y) / tileh) - (dy >> 1)) + 0.5) | 0;
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

