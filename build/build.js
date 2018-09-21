var concat = require('concat');
var compressor = require('node-minify');

var sources = [
	"../source/src/b5.js",
	"../source/src/animation/ease.js",
	"../source/src/animation/animation.js",
	"../source/src/animation/timeline.js",
	"../source/src/animation/timelineManager.js",
	"../source/src/core/actions.js",
	"../source/src/core/events.js",
	"../source/src/core/tasks.js",
	"../source/src/actor/actor.js",
	"../source/src/actor/arcActor.js",
	"../source/src/actor/labelActor.js",
	"../source/src/actor/particleActor.js",
	"../source/src/actor/polygonActor.js",
	"../source/src/actor/rectActor.js",
	"../source/src/actor/mapActor.js",
	"../source/src/core/app.js",
	"../source/src/core/scene.js",
	"../source/src/core/xoml.js",
	"../source/src/math/maths.js",
	"../source/src/rendering/display.js",
	"../source/src/resource/raw.js",
	"../source/src/resource/font.js",
	"../source/src/resource/bitmap.js",
	"../source/src/resource/gradient.js",
	"../source/src/resource/imageAtlas.js",
	"../source/src/resource/material.js",
	"../source/src/resource/shape.js",
	"../source/src/resource/sound.js",
	"../source/src/utils/utils.js",
	"../source/src/utils/instants.js",
	"../source/src/actions/generic/actions.js",
	"../source/src/actions/generic/actors.js",
	"../source/src/actions/generic/attractor.js",
	"../source/src/actions/generic/audio.js",
	"../source/src/actions/generic/animation.js",
	"../source/src/actions/generic/general.js",
	"../source/src/actions/generic/movement.js",
	"../source/src/actions/generic/camera.js",
	"../source/src/actions/generic/physics.js"
];

concat(sources, "booty5_debug.js").then(function()
{
	compressor.minify({
		compressor: "babel-minify",
		input: [
			"booty5_debug.js",
		],
		output: "booty5_min.js",
		options: {
		},
		callback: function (err, min)
		{
			console.log(err);
		}
	});
});

