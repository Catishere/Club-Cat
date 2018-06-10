var express = require('express');
var path 	= require('path');
var app 	= express();
var http	= require('http').Server(app);
var io		= require('socket.io')(http);
var port	= process.env.PORT || 3000;
var words	= [];

process.setMaxListeners(0);

app.use("/", express.static(__dirname));

var knex = require('knex')({
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING || process.env.DATABASE_URL,
  searchPath: 'knex,public'
});

knex.schema.createTableIfNotExists('doodlera_table', function (table) {
  table.increments();
  table.string('name');
  table.integer('points').defaultTo(0);
  table.date("joined");
}).then();

var bookshelf = require('bookshelf')(knex);

var User = bookshelf.Model.extend({
  tableName: 'doodlera_table'
});

io.sockets.on('connection', function(socket){

	var socketid;
	var name;
	
	socket.on('chosenname', function(name){
		socketid = 0;
		
		new User({'name': name})
		.fetch()
		.then(function(model) {
			if (model == null) {
				new User({'name': name}).save().then(function(mdl) {
					socketid = mdl.get('id');
				});
			}
			else {
				socketid = model.get('id');
			}
			playercount = playercount + 1;
		});
    });
	
	socket.on('chat message', function(name, msg) {
		if (msg == "!points")
		{
			new User({'name': name})
			.fetch()
			.then(function(model) {
				io.emit('chat message',null,'' + name + ' has ' + model.get('points') + ' points.');
			});
		}
		io.emit('chat message', name, msg);
	});
	
	socket.on('disconnect', function() {

		new User({'id': socketid})
		.fetch()
		.then(function(model) {
			io.emit('chat message',null,'' + model.get('name').replace(/`/g , "") + ' disconnected.');
			playercount = playercount - 1;
		});
	});
});


http.listen(port, function(){
  console.log('listening on *:' + port);
});
