/**
 * author       Mat Hopwood
 * copyright    2014 Mat Hopwood
 * More info    http://booty5.com
 */
"use strict";
//
// Display is the display abstraction layer
//
b5.Display = function(canvas)
{
    // Internal variables
    this.canvas = canvas;                       // The HTML5 canvas object
    this.cache_ctx = null;                      // Current cached object context
    this.context = canvas.getContext("2d");     // The canvas context

    // Set defaults
    this.context.lineWidth = 1;
    this.context.strokeStyle = "black";
    this.context.fillStyle = "black";
    this.context.globalAlpha = 1.0;
    this.context.lineJoin = "round";
    this.context.lineCap = "round";

    // Pixel ratio for mobile devices
    var device_pr = b5.Utils.GetDevicePixelRatio();
    var backstore_pr =  b5.Utils.GetBackingStorePixelRatio(this.context);
    var ratio = device_pr / backstore_pr;
    if (device_pr !== backstore_pr)
    {
        b5.app.pixel_ratio = ratio;
    }

};

b5.Display.getWidth = function()
{
//	return window.innerWidth;
	return document.documentElement.clientWidth;
}

b5.Display.getHeight = function()
{
//	return window.innerHeight;
	return document.documentElement.clientHeight;
}

b5.Display.prototype.getCanvasPoint = function(x_pos, y_pos)
{
    var app = b5.app;
    var scale = app.canvas_scale;
    return {
        x: (x_pos - this.canvas.offsetLeft - app.canvas_cx) / scale,
        y: (y_pos - this.canvas.offsetTop - app.canvas_cy) / scale
    };
};

b5.Display.prototype.clear = function(transparent)
{
    var app = b5.app;
    var ctx = this.context;
	var pr = b5.app.pixel_ratio;
    ctx.setTransform(1 * pr, 0, 0, 1 * pr, 0, 0);
    ctx.clearRect(0, 0, app.display_width, app.display_height);
/*	if (transparent)
    {
        this.ctx.fillStyle = "transparent";
        this.ctx.fillRect(0, 0, this.design_width, this.design_height);
    }*/
};

b5.Display.prototype.drawPolygon = function(x, y, points, fill)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
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

b5.Display.prototype.drawLine = function(x1, y1, x2, y2)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    return this;
};

b5.Display.prototype.drawRect = function(x, y, w, h, fill)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    if (fill)
        ctx.fillRect(x, y, w, h);
    else
        ctx.strokeRect(x, y, w, h);
    return this;
};

b5.Display.prototype.drawRoundRect = function(x, y, w, h, radius, fill)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
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

b5.Display.prototype.drawArc = function(x, y, radius, start_angle, end_angle, fill)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.arc(x, y, radius, start_angle, end_angle);
//  ctx.arc(x, y, 100, 0, 2 * Math.PI);
    if (fill)
        ctx.fill();
    else
        ctx.stroke();
    return this;
};

b5.Display.prototype.drawAtlasImage = function(image, src_x, src_y, src_w, src_h, x, y, w, h)
{
    if (image.width <= 0 || image.height <= 0)
        return;
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.drawImage(image, src_x, src_y, src_w, src_h, x, y, w, h);
};

b5.Display.prototype.drawImage = function(image, x, y, w, h)
{
    if (image.width <= 0 || image.height <= 0)
        return;
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    if (w !== undefined)
        ctx.drawImage(image, x, y, w, h);
    else
        ctx.drawImage(image, x, y);
};

b5.Display.prototype.drawText = function(text, x, y, line_height, filled)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    text = "" + text;
    var lines = text.split("\n");
    for (var t = 0; t < lines.length; t++)
    {
        if (filled)
            ctx.fillText(lines[t], x, y);
        else
            ctx.strokeText(lines[t], x, y);
        y += line_height;
    }
};

b5.Display.prototype.meaureText = function(text)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    return ctx.measureText(text);
};

b5.Display.prototype.setTransform = function(m11, m12, m21, m22, dx, dy)
{
	var pr = b5.app.pixel_ratio;
    m11 *= pr;
    m12 *= pr;
    m21 *= pr;
    m22 *= pr;
    dx *= pr;
    dy *= pr;
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.setTransform(m11, m12, m21, m22, dx, dy);
};

b5.Display.prototype.clipRect = function(x, y, w, h)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
};

b5.Display.prototype.clipArc = function(x, y, radius, start, end)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    ctx.arc(x,y, radius, start, end);
    ctx.clip();
};

b5.Display.prototype.clipPolygon = function(points)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.beginPath();
    var count = points.length;
    ctx.moveTo(points[0], points[1]);
    for (var i = 2; i < count; i += 2)
        ctx.lineTo(points[i], points[i + 1]);
    ctx.closePath();
    ctx.clip();
};

b5.Display.prototype.saveContext = function()
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.save();
};

b5.Display.prototype.restoreContext = function()
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.restore();
};

b5.Display.prototype.createCache = function()
{
    return document.createElement("canvas");
};

b5.Display.prototype.createCacheWithSize = function(width, height)
{
    var cache = document.createElement("canvas");
    cache.width = width;
    cache.height = height;
    return cache;
};

b5.Display.prototype.setGlobalAlpha = function(alpha)
{
    this.context.globalAlpha = alpha;
};

b5.Display.prototype.setGlobalCompositeOp = function(op)
{
    this.context.globalCompositeOperation = op;
};

b5.Display.prototype.setShadow = function(x, y, colour, blur)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.shadowOffsetX = x;
    ctx.shadowOffsetY = y;
    ctx.shadowColor = colour;
    ctx.shadowBlur = blur;
};

b5.Display.prototype.setShadowOff = function()
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.shadowColor = "transparent";
};

b5.Display.prototype.setFillStyle = function(style)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.fillStyle = style;
};

b5.Display.prototype.setStrokeStyle = function(style)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.strokeStyle = style;
};

b5.Display.prototype.setLineWidth = function(width)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.lineWidth = width;
};

b5.Display.prototype.setFont = function(font)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.font = font;
};

b5.Display.prototype.setTextAlign = function(align)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.textAlign = align;
};

b5.Display.prototype.setTextBaseline = function(baseline)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.textBaseline = baseline;
};

b5.Display.prototype.setSmoothing = function(enable)
{
    var ctx = this.context;
    if (this.cache_ctx !== null)
        ctx = this.cache_ctx;
    ctx.imageSmoothingEnabled = enable;
    ctx.mozImageSmoothingEnabled = enable;
    ctx.oImageSmoothingEnabled = enable;
    ctx.imageSmoothingEnabled = enable;
    ctx.msImageSmoothingEnabled = enable;
};

b5.Display.prototype.setCache = function(cache)
{
    if (cache === null)
        this.cache_ctx = null;
    else
        this.cache_ctx = cache.getContext("2d");
};
