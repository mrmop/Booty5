"use strict";

function Canvas2D($canvas)
{
    // Private variables
    var pageOffset = $canvas.offset();
	
	// Public variables
    this.context = $canvas[0].getContext("2d");
    this.width = $canvas[0].width,
    this.height = $canvas[0].height,

    // Set defaults
    this.context.lineWidth = 1;
    this.context.strokeStyle = "black";
    this.context.fillStyle = "black";
    this.context.globalAlpha = 1.0;
    this.context.lineJoin = "round";
    this.context.lineCap = "round";
    
    $(window).resize(function()
	{
		pageOffset = $canvas.offset();
	});
    
    this.getCanvasPoint = function(pageX, pageY)
    {
        // Returns canvas point given page coordinates
        return {
            x: pageX - pageOffset.left,
            y: pageY - pageOffset.top
        }
    };
    
    this.clear = function()
    {
        this.context.clearRect(0, 0, this.width, this.height);
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
