function Tile(type)
{
	this.type = type;
	this.view_actor = new b5.Actor();
	this.guess_actor = new b5.Actor();
}

function Board(x_count, y_count)
{
	Board.MAX_TILE_TYPES = 9;

	var app = b5.app;
	this.x_count = x_count;     // Horizontal tile count
	this.y_count = y_count;     // Vertical tile count
	this.tiles = [];

	var view_area = app.findScene("viewarea");
	var guess_area = app.findScene("guessarea");
	var tile_size = (view_area.w * 0.9) / x_count;
	if (tile_size > 180) tile_size = 180;
	var empty_brush = app.findResource("empty", "brush");

	var ypos = -(y_count - 1) * tile_size / 2;
	for (y = 0; y < y_count; y++)
	{
		var xpos = -(x_count - 1) * tile_size / 2;
		for (x = 0; x < x_count; x++)
		{
			// Create a tile
			var tile = new Tile((Math.random() * Board.MAX_TILE_TYPES + 1) << 0);
			tile.view_actor.tag = "tile";
			tile.view_actor.x = xpos;
			tile.view_actor.y = ypos;
			tile.view_actor.w = tile_size;
			tile.view_actor.h = tile_size;
			tile.view_actor.atlas = app.findResource("d" + tile.type, "brush");
			view_area.addActor(tile.view_actor);
			tile.guess_actor.tag = "tile";
			tile.guess_actor.x = xpos;
			tile.guess_actor.y = ypos;
			tile.guess_actor.w = tile_size;
			tile.guess_actor.h = tile_size;
			tile.guess_actor.atlas = empty_brush;
			tile.guess_actor.sm_tile = tile;
			tile.guess_actor.touchable = true;
			tile.guess_actor.onTapped = function() {
				if (window.shuffle_match.allow_shuffle)
				{
					var sm_tile = this.sm_tile;
					var type = sm_tile.type;
					if (sm_tile.type >= 0)
					{
						if (type == window.shuffle_match.target_number)
							window.shuffle_match.correct(sm_tile);
						else
							window.shuffle_match.incorrect();
						sm_tile.guess_actor.scene.timelines.add(new b5.Timeline(sm_tile.guess_actor, "_scale", [1, 1.2, 1], [0, 0.25, 0.5], 1, [b5.Ease.quadout, b5.Ease.quadin]));
					}
				}
			};
			guess_area.addActor(tile.guess_actor);

			// Add tile to board
			this.tiles.push(tile);
			xpos += tile_size;
		}
		ypos += tile_size;
	}
}

Board.prototype.destroy = function()
{
	var app = b5.app;
	var view_area = app.findScene("viewarea");
	var guess_area = app.findScene("guessarea");
	view_area.removeActorsWithTag("tile");
	guess_area.removeActorsWithTag("tile");
	this.tiles = [];
};

Board.prototype.chooseRandomTile = function()
{
	// Build list of available tiles
	var available_tiles = [];
	var tiles = this.tiles;
	var count = tiles.length;
	for (var t = 0; t < count; t++)
	{
		if (tiles[t].type >= 0)
			available_tiles.push(tiles[t].type);
	}
	// Choose a random tile type
	return available_tiles[(Math.random() * available_tiles.length) << 0];
};

Board.prototype.countTilesOfType = function(type)
{
	var tiles = this.tiles;
	var count = tiles.length;
	var num = 0;
	for (var t = 0; t < count; t++)
	{
		if (tiles[t].type == type)
			num++;
	}
	return num;
};

Board.prototype.getPotentialScore = function()
{
	var tiles = this.tiles;
	var count = tiles.length;
	var num = 0;
	var counts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	var score = 0;

	for (var t = 0; t < count; t++)
		counts[tiles[t].type - 1]++;

	for (var t = 0; t < 9; t++)
	{
		for (var s = 0; s < counts[t]; s++)
			score += (s + 1) * 10;
	}

	return score;
};

