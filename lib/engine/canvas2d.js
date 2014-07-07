"use strict";

function Canvas2D($canvas)
{
    // Private variables
    var page_offs = $canvas.offset();
	
	// Public variables
    this.context = $canvas[0].getContext("2d");
    this.canvas_width = $canvas[0].width,
    this.canvas_height = $canvas[0].height,
	this.screen_width = window.innerWidth;
	this.screen_height = window.innerHeight;

    // Set defaults
    this.context.lineWidth = 1;
    this.context.strokeStyle = "black";
    this.context.fillStyle = "black";
    this.context.globalAlpha = 1.0;
    this.context.lineJoin = "round";
    this.context.lineCap = "round";
    
    $(window).resize(function()
	{
		page_offs = $canvas.offset();
	});
    
    this.getCanvasPoint = function(pageX, pageY)
    {
        // Returns canvas point given page coordinates
        return {
            x: pageX - page_offs.left,
            y: pageY - page_offs.top
        }
    };
    
    this.clear = function()
    {
		this.context.setTransform(1, 0, 0, 1, 0, 0);
        this.context.clearRect(0, 0, this.canvas_width, this.canvas_height);
        return this;
    };

    this.drawPoints = function(points)
    {
        this.context.beginPath();
        this.context.moveTo(points[0].x, points[0].y);
        for (var i = 1; i < points.length; i++)
        {
            this.context.lineTo(points[i].x, points[i].y);
        }
        this.context.stroke();
        return this;
    };
    
    this.drawLine = function(point1, point2)
    {
        this.context.beginPath();
        this.context.moveTo(point1.x, point1.y);
        this.context.lineTo(point2.x, point2.y);
        this.context.stroke();
        return this;
    };
    
    this.drawRect = function(point1, point2, fill)
    {
        var w = point2.x - point1.x,
            h = point2.y - point1.y;
        if (fill)
			this.context.fillRect(point1.x, point1.y, w, h);
        else
			this.context.strokeRect(point1.x, point1.y, w, h);
        return this;
    };

    this.drawCircle = function(center, radius, fill)
    {
        this.context.beginPath();
        this.context.arc(center.x, center.y, radius, 0, 2 * Math.PI, true)
        if (fill)
			this.context.fill();
        else
			this.context.stroke();
        return this;
    };
}
