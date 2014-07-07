"use strict";

// This class contains all of the games resources
function Resources()
{
	this.reel_image;
	this.reel_atlas;
	this.background_image;
	this.background_atlas;
	this.floor_image;
	this.floor_atlas;
	this.total_resources = 0;
	
	this.load = function()
	{
		this.reel_image = new Image();
		this.reel_image.src = "images/sheep.png";
		this.reel_atlas = new ImageAtlas();
		this.reel_atlas.width = 86;
		this.reel_atlas.height = 89;
		this.reel_atlas.image = this.reel_image;
		this.reel_atlas.addFrame(0,0,86,89);
		this.reel_atlas.addFrame(86,0,86,89);

		this.background_image = new Image();
		this.background_image.src = "images/background.jpg";
		this.background_atlas = new ImageAtlas();
		this.background_atlas.width = 120;
		this.background_atlas.height = 120;
		this.background_atlas.image = this.background_image;
		this.background_atlas.addFrame(0,0,800,600);

		this.floor_image = new Image();
		this.floor_image.src = "images/hbar.png";
		this.floor_atlas = new ImageAtlas();
		this.floor_atlas.width = 800;
		this.floor_atlas.height = 57;
		this.floor_atlas.image = this.floor_image;
		this.floor_atlas.addFrame(0,0,800,57);
	}
}
