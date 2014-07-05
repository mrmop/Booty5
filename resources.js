"use strict";

// This class contains all of the games resources
function Resources()
{
	this.reelImage = null;
	this.reelAtlas = new SpriteAtlas()
	
	this.load = function()
	{
		this.reelImage = new Image();
		this.reelImage.src = "images/reelspin.png";
		this.reelAtlas = new SpriteAtlas();
		this.reelAtlas.width = 120;
		this.reelAtlas.height = 120;
		this.reelAtlas.image = this.reelImage;
		this.reelAtlas.addFrame(0,0,60,60);
		this.reelAtlas.addFrame(60,0,60,60);
		this.reelAtlas.addFrame(0,60,60,60);
		this.reelAtlas.addFrame(60,60,60,60);
	}
}
