"use strict";

var fs = require('fs');
var http = require('http');
var https = require('https');
var express = require('express');

class Server
{
	constructor()
	{
		var that = this;
		this.port = 8080;
		//this.port = 7999;	// Live
		this.ip = "localhost";
		
		var options = {
			key: fs.readFileSync('./ssl/key.pem'),
			cert: fs.readFileSync('./ssl/cert.pem'),
		};
		
		this.app = express();
		this.server = https.createServer(options, this.app).listen(that.port, that.ip, function()
		{
			console.log("Server listening on port " + that.port);
		});
		this.app.use(express.static('public'));
	}

}

module.exports.Server = Server;
