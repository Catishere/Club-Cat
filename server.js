var express = require('express');
var path 	= require('path');
var app 	= express();
var http	= require('http').Server(app);
var io		= require('socket.io')(http);
var port	= process.env.PORT || 3000;
var conn = "postgres://postgres:root@localhost:5432/catclub";

process.setMaxListeners(0);

app.use("/", express.static(__dirname));

var knex = require('knex')({
  client: 'pg',
  connection:  process.env.DATABASE_URL || conn,
  searchPath: 'knex,public'
});

knex.schema.createTableIfNotExists('user', function (table) {
  table.increments();
  table.string('name');
  table.string('password');
  table.integer('points').defaultTo(0);
  table.date("joined");
}).then();

var bookshelf = require('bookshelf')(knex);

var User = bookshelf.Model.extend({
  tableName: 'user'
});

var playercount = 0;

io.sockets.on('connection', function(socket){

	var socketid;
	var name;
	
	console.log("spam");
	
	socket.on('playermove', function(x,y,name){
		io.emit('playermove', x, y, name);
    });
	
	socket.on('chosenname', function(name, password){
		socketid = 0;
		
		new User({'name': name})
		.fetch()
		.then(function(model) {
			if (model == null) {
				new User({'name': name, 'password': password, 'joined': new Date()}).save().then(function(mdl) {
					socketid = mdl.get('id');
					socket.emit('login');
				});
			}
			else {
				if (model.get('password') == password) {
					socketid = model.get('id');
					socket.emit('login');
				}
				else {
					socket.emit('errors', 'Wrong password!');
					playercount = playercount - 1;
				}
			}
			playercount = playercount + 1;
		});
    });
	
	socket.on('chat message', function(name, msg, control) {
		if (msg == "!points")
		{
			new User({'name': name})
			.fetch()
			.then(function(model) {
				io.emit('chat message',null,'' + name + ' has ' + model.get('points') + ' points.', null);
			});
		}
		io.emit('chat message', name, msg, control);
	});
	
	socket.on('reqspawn', function(target, name, x, y) {
		io.emit('spawn', target, name, x, y);
	});
	
	socket.on('disconnect', function() {

		new User({'id': socketid})
		.fetch()
		.then(function(model) {
			var name = model.get('name').replace(/`/g , "");
			io.emit('chat message', name,'' + name + ' disconnected.', 'disconnect');
			playercount = playercount - 1;
		});
		
	});
});


http.listen(port, function(){
  console.log('listening on *:' + port);
});
