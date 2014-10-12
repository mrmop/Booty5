/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://www.gojieditor.com
 */
"use strict";
//
// Display is the display abstraction layer
//
function Display(canvas)
{
    // Internal variables
    this.canvas = canvas;                       // The HTML5 canvas object
    this.context = canvas.getContext("2d");     // The canvas context

    // Set defaults
    this.context.lineWidth = 1;
    this.context.strokeStyle = "black";
    this.context.fillStyle = "black";
    this.context.globalAlpha = 1.0;
    this.context.lineJoin = "round";
    this.context.lineCap = "round";

}

Display.prototype.getCanvasPoint = function(x_pos, y_pos)
{
    var app = window.app;
    var scale = app.canvas_scale;
    return {
        x: (x_pos - this.canvas.offsetLeft - app.canvas_cx) / scale,
        y: (y_pos - this.canvas.offsetTop - app.canvas_cy) / scale
    };
};

Display.prototype.clear = function(transparent)
{
    var app = window.app;
    var context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, app.display_width, app.display_height);
/*	if (transparent)
    {
        this.context.fillStyle = "transparent";
        this.context.fillRect(0, 0, this.canvas_width, this.canvas_height);
    }*/
};

Display.prototype.drawPolygon = function(x, y, points, fill)
{
    var context = this.context;
    var count = points.length;
    context.beginPath();
    context.moveTo(points[0] + x, points[1] + y);
    for (var i = 2; i < count; i += 2)
        context.lineTo(points[i] + x, points[i + 1] + y);
    if (fill)
        context.fill();
    else
        context.stroke();
    return this;
};

Display.prototype.drawLine = function(x1, y1, x2, y2)
{
    var context = this.context;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
    return this;
};

Display.prototype.drawRect = function(x, y, w, h, fill)
{
    var context = this.context;
    if (fill)
        context.fillRect(x, y, w, h);
    else
        context.strokeRect(x, y, w, h);
    return this;
};

Display.prototype.drawArc = function(x, y, radius, start_angle, end_angle, fill)
{
    var context = this.context;
    context.beginPath();
    context.arc(x, y, radius, start_angle, end_angle);
//  context.arc(x, y, 100, 0, 2 * Math.PI);
    if (fill)
        context.fill();
    else
        context.stroke();
    return this;
};

Display.prototype.drawAtlasImage = function(image, src_x, src_y, src_w, src_h, x, y, w, h)
{
    this.context.drawImage(image, src_x, src_y, src_w, src_h, x, y, w, h);
};

Display.prototype.drawImage = function(image, x, y, w, h)
{
    this.context.drawImage(image, x, y, w, h);
};
