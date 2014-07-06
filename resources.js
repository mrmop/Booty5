"use strict";

// This class contains all of the games resources
function Resources()
{
	this.reelImage = new Image();
	this.reelAtlas = new ImageAtlas()
	this.backgroundImage = new Image();
	this.backgroundAtlas = new ImageAtlas()
	this.floorImage = new Image();
	this.floorAtlas = new ImageAtlas()
	
	this.load = function()
	{
		this.reelImage.src = "images/sheep.png";
		this.reelAtlas.width = 86;
		this.reelAtlas.height = 89;
		this.reelAtlas.image = this.reelImage;
		this.reelAtlas.addFrame(0,0,86,89);
		this.reelAtlas.addFrame(86,0,86,89);

		this.backgroundImage.src = "images/background.jpg";
		this.backgroundAtlas.width = 120;
		this.backgroundAtlas.height = 120;
		this.backgroundAtlas.image = this.backgroundImage;
		this.backgroundAtlas.addFrame(0,0,800,600);

		this.floorImage.src = "images/hbar.png";
		this.floorAtlas.width = 800;
		this.floorAtlas.height = 57;
		this.floorAtlas.image = this.floorImage;
		this.floorAtlas.addFrame(0,0,800,57);
	}
}
