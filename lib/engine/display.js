/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
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
    var ctx = this.context;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, app.display_width, app.display_height);
/*	if (transparent)
    {
        this.ctx.fillStyle = "transparent";
        this.ctx.fillRect(0, 0, this.canvas_width, this.canvas_height);
    }*/
};

Display.prototype.drawPolygon = function(x, y, points, fill)
{
    var ctx = this.context;
    var count = points.length;
    ctx.beginPath();
    ctx.moveTo(points[0] + x, points[1] + y);
    for (var i = 2; i < count; i += 2)
        ctx.lineTo(points[i] + x, points[i + 1] + y);
    if (fill)
        ctx.fill();
    else
    {
        ctx.lineTo(points[0] + x, points[1] + y);
        ctx.stroke();
    }
    return this;
};

Display.prototype.drawLine = function(x1, y1, x2, y2)
{
    var ctx = this.context;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return this;
};

Display.prototype.drawRect = function(x, y, w, h, fill)
{
    var ctx = this.context;
    if (fill)
        ctx.fillRect(x, y, w, h);
    else
        ctx.strokeRect(x, y, w, h);
    return this;
};

Display.prototype.drawRoundRect = function(x, y, w, h, radius, fill)
{
    var ctx = this.context;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill)
        ctx.fill();
    else
        ctx.stroke();
};

Display.prototype.drawArc = function(x, y, radius, start_angle, end_angle, fill)
{
    var ctx = this.context;
    ctx.beginPath();
    ctx.arc(x, y, radius, start_angle, end_angle);
//  ctx.arc(x, y, 100, 0, 2 * Math.PI);
    if (fill)
        ctx.fill();
    else
        ctx.stroke();
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

