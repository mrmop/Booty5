var compressor = require('node-minify');

compressor.minify({
	compressor: "babel-minify",
	input: [
		"../test/public/game.js",
		"../test/public/main.js",
		"../test/public/globals.js",
		"../test/public/utils.js",
		"../test/public/board.js",
		"../test/public/shufflematchgame.js",
		"../test/public/menu.js",
		"../test/public/spinner.js",
		"../test/public/guessarea.js",
		"../test/public/viewarea.js",
		"../test/public/gameover.js",
		"../test/public/mainmenu.js",
		"../test/public/leaderboard.js",
	],
	output: "game_min.js",
	options: {
	},
	callback: function (err, min)
	{
		console.log(err);
	}
});
 
