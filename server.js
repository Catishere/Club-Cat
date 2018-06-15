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

var hardcode_users = [];

var playercount = 0;

io.sockets.on('connection', function(socket){

	var socketid;
	var name;
	
	socket.on('playermove', function(x,y,name, control){
		io.emit('playermove', x, y, name, control);
    });
	
	socket.on('attemptlogin', function(name, password, register){
		if (hardcode_users.indexOf(name) > -1)
			socket.emit('errors', 'User already logged in!');
		else if (!name.match(/^[0-9a-zA-Z]{1,16}$/)){
			socket.emit('errors', 'Dont cheat cunt!');
		} else {
			new User({'name': name})
			.fetch()
			.then(function(model) {
				if (model == null) {
					if (register)
						new User({'name': name, 'password': password, 'joined': new Date()}).save().then(function(mdl) {
							socketid = mdl.get('id');
							hardcode_users.push(name);
							playercount = playercount + 1;
							socket.emit('login');
						});
					else
						socket.emit('errors', 'Account doesnt exist!');
				}
				else if (!register) {
					if (model.get('password') == password) {
						socketid = model.get('id');
						hardcode_users.push(name);
						socket.emit('login');
						playercount = playercount + 1;
					}
					else {
						socket.emit('errors', 'Wrong password!');
					}
				}
				else {
					socket.emit('errors', 'Account already exists!');
				}
			});
		}
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
		
		if (socketid != null)
			new User({'id': socketid})
			.fetch()
			.then(function(model) {
				var name = model.get('name').replace(/`/g , "");
				io.emit('chat message', name,'' + name + ' disconnected.', 'disconnect');
				hardcode_users.splice(hardcode_users.indexOf(name), 1);
				playercount = playercount - 1;
			});
		
	});
});


http.listen(port, function(){
  console.log('listening on *:' + port);
});
