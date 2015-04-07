var quotes = [
	"Take each day as it comes",
	"Give more than you planned to",
	"Hang on to your dreams",
	"Believe in yourself", 
	"Don't give up and don't give in",
	"Love yourself",
	"Make it happen",
	"Stop procrastinating",
	"Practice makes perfect",
	"Take control of your destiny",
	"When you lose don't lose the lesson",
	"You are unique nothing can replace you",
	"Keep trying no matter how hard it seems",
];
var time = 0;
var index = 0;

function createQuote()
{
	var scene = b5.app.findScene("gamescene");
	var label = new b5.LabelActor();
	label.font = "32pt Calibri";
	label.text_align = "center";
	label.text_baseline = "middle";
	label.fill_style = "#ffffff";
	label.text = quotes[index];
	label.opacity = 0;
	label.x = (Math.random() - 0.5) * 1000;
	label.y = (Math.random() - 0.5) * 1000;
	label.depth = 10;
	scene.addActor(label);
	label.onTick = function(dt)
	{
		label.depth -= 1 * dt;
		if (label.depth > 7)
			label.opacity = (10 - label.depth) * 0.33;
		else
		if (label.depth < 1)
		{
			label.opacity = label.depth;
			if (label.depth <= 0.2)
				label.destroy();
		}
	};
	index++;
	if (index >= quotes.length)
		index = 0;
}

function sceneTick(scene, dt)
{
	time -= dt;
	if (time < 0)
	{
		time = 2;
		createQuote();
	}
}
