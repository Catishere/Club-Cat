var express = require('express');
var path    = require('path');
var app     = express();
var server    = require('http').createServer(app);
var io      = require('socket.io')(server);
var port    = process.env.PORT || 3000;
var favicon = require('serve-favicon');

process.setMaxListeners(0);

app.use("/", express.static(__dirname));
app.use(favicon(path.join(__dirname,'images','favicon.ico')));

var conn = "postgres://postgres:root@localhost:5432/catclub";

const knex = require('knex')({
    client: 'pg',
    connection:  process.env.DATABASE_URL || conn,
    searchPath: ['knex','public']
    });

const bookshelf = require('bookshelf')(knex);

if (!knex.schema.hasTable('user'))
    knex.schema.createTable('user', function (table) {
        table.increments('id');
        table.string('name');
        table.string('password');
        table.integer('points').defaultTo(0);
        table.date("joined");
    }).then();


var User = bookshelf.model('User', {
    tableName: 'user'
});

var hardcode_users = {};

var playercount = 0;

io.on('connection', function(socket){

    console.log("kur");
    var socketid;
    var name;
    
    socket.join("mars");
    
    socket.on('playermove', function(x,y,name, control){
        io.emit('playermove', x, y, name, control);
    });
    
    socket.on('joinroom', function(room, name) {
        hardcode_users[name] = room;
        socket.join(room);
    });
    
    socket.on('leaveroom', function(room, name) {
        io.to(room).emit("playerleftroom", name);
        socket.leave(room);
    });
    
    socket.on('attemptlogin', function(name, password, register){
        if (hardcode_users.name != null)
            socket.emit('errors', 'User already logged in!');
        else if (!name.match(/^[0-9a-zA-Z]{1,16}$/)){
            socket.emit('errors', 'Dont cheat cunt!');
        } else {
            new User({'name': name})
            .fetch({ require: false })
            .then(function(model) {
                if (model === null) {
                    if (register)
                        new User({'name': name, 'password': password, 'joined': new Date()}).save().then(function(mdl) {
                            socketid = mdl.get('id');
                            hardcode_users[name] = 'mars';
                            playercount = playercount + 1;
                            socket.emit('login');
                            
                            io.to('mars').emit('chat message', null, name + " joined.", null);
                        }).catch(function(error){
                            console.error(error)
                        });
                    else
                        socket.emit('errors', 'Account doesnt exist!');
                }
                else if (!register) {
                    if (model.get('password') === password) {
                        socketid = model.get('id');
                        hardcode_users[name] = 'mars';
                        socket.emit('login');
                        io.to('mars').emit('chat message', null, name + " joined.", null);
                        playercount = playercount + 1;
                    }
                    else {
                        socket.emit('errors', 'Wrong password!');
                    }
                }
                else {
                    socket.emit('errors', 'Account already exists!');
                }
            }).catch(function(error) {
                console.error(error)
            });
        }
    });
    
    socket.on('chat message', function(name, msg, control) {
        
        
        if (msg === "!points")
        {
            new User({'name': name})
            .fetch()
            .then(function(model) {
                io.to(control).emit('chat message',null,'' + name + ' has ' + model.get('points') + ' points.', null);
            });
        }
        io.to(control).emit('chat message', name, msg, null);
    });
    
    socket.on('reqspawn', function(target, name, x, y) {
        if (target.startsWith(' ')) {
            io.to(target.substr(1)).emit('spawn', 'A L L', name, x, y);
        } else
            io.emit('spawn', target, name, x, y);
    });
    
    socket.on('disconnect', function() {
        
        if (socketid !== null)
            new User({'id': socketid})
            .fetch()
            .then(function(model) {
                var name = model.get('name').replace(/`/g , "");
                io.emit('chat message', name,'' + name + ' disconnected.', 'disconnect');
                delete hardcode_users[name];
                playercount = playercount - 1;
            });
        
    });
});


server.listen(port, function(){
    console.log('listening on *:' + port);
});
