var compressor = require('node-minify');

compressor.minify({
	compressor: "babel-minify",
	input: [
		"dragonBones.js",
	],
	output: "dragonBones_min.js",
	options: {
		//language: "ECMASCRIPT6",
		/*warnings: true,
		mangle: true,
		compress: true*/
	},
	callback: function (err, min)
	{
		console.log(err);
	}
});
 
