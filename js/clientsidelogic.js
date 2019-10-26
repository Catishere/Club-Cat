var socket = io();
var yourname;
var objects;
var allSolidObjects = {};
var allSolidObjectsWalls = {};
var messageSound;
var edit_mode = false;
var last_point = {};
var mute = false;
var currentRoom = null;
const SOLID = "object solid-object";
const OVER = "object object-above-player";
const UNDER = "object object-below-player";
const EDIT = "object-edit-temporary";

initPage();

$('#login').click(function() {
    loginHandle(false);
});

$('#register').click(function() {
    loginHandle(true);
});

$('#toggleChat').click(function() {
    $("#chatlog").toggle();
});

$('#toggleEdit').click(function() {
    edit_mode = !edit_mode;
});

function loginHandle(register) {
    var username = $('#username').val();
    var password = $('#password').val();
    
    if (username !== '' && password !== '')
    {
        if (username.match(/^[0-9a-zA-Z]{1,16}$/))
            socket.emit('attemptlogin', username, password, register);
        else
            displayError("Incorrect username!");
    } else {
        displayError("Enter username and password!");
    }
}

$('#game-container').click(function() {
    var offset = $('.game').offset();
    var x = event.clientX - offset.left - 2;
    var y = event.clientY - offset.top - 2;
    console.log("click");
    if (yourname !== null && $('#'+yourname) !== null) {

        var ratio = y / 768;
        if (ratio < 0.95 && ratio > 0.3 && x + y !== 0) {
            if (edit_mode) {
                createObject("p"+x+"x"+y, "dot.png", EDIT, currentRoom, x + "px", y + "px");
                allSolidObjectsWalls[currentRoom].push({x1: x, y1: y, x2: last_point.x, y2: last_point.y});
                last_point = {x: x, y: y};
                console.log(last_point);
            }
            else
                socket.emit('playermove', x, y, yourname, null);
        }

    }     
});

// function linedraw(x1, y1, x2, y2) {
//     if (x2 < x1) {
//         var tmp = x2;
//         x2 = x1;
//         x1 = tmp;
//         var tmp = y2;
//         y2 = y1;
//         y1 = tmp;
//     }
//
//     var lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
//     var m = (y2 - y1) / (x2 - x1)
//
//     var degree = Math.atan(m) * 180 / Math.PI
//
//     document.body.innerHTML += "<div class='line' style='transform-origin: top left; transform: rotate(" + degree + "deg); width: " + lineLength + "px; height: 3px; background: black; position: absolute; top: " + y1 + "px; left: " + x1 + "px;'></div>"
// }

function playAudio(audio) {
    if (!mute)
        audio.play();
}

function displayError(message) {
    var div = document.createElement("div");
    div.innerHTML = message;
    div.className = "error";
    $(".game").append(div);
    setTimeout(function(){ div.remove(); }, 6000);
}

function initPage() {
    
    messageSound = new Audio('sound/new_message_sound.mp3');
    
    $( "#muteButton" ).click( function() {
        if (mute) {
            $("#muteButton").attr('src', '/images/unmute.png');
            mute = false;
        }
        else {
            $("#muteButton").attr('src', '/images/mute.png');
            mute = true;
        }
    });
}

function spawnLocation(lastRoom) {
    var spawn = {};
    var pos;
    switch(currentRoom) {
        case "mars":
        if (lastRoom === "earth") {
            pos = $('#teleport_right').position();
            spawn.x = pos.left - 50;
            spawn.y = pos.top + 100;
        } else if (lastRoom === null) {
            pos = $("#teleport_left").position();
            spawn.x = pos.left + 250; 
            spawn.y = pos.top + 100;
        }
        break;
        
        case "earth":
            if (lastRoom === "mars") {
                pos = $("#teleport_left").position();
                spawn.x = pos.left + 250; 
                spawn.y = pos.top + 100;
            }
        break;
    }
    return spawn;
}

function prepareRoom(room) {
    
    var objectlen = 0;

    if (currentRoom === room) {
        return true;
    }
    
    if (currentRoom !== null)
        socket.emit('leaveroom', currentRoom, yourname);
    
    var lastRoom = currentRoom;
    currentRoom = room;
    
    if (yourname !== null) socket.emit('joinroom', room, yourname);
    
    $('.object').remove();
    $('.player').remove();
    
    $('.game').css('background-image', 'url("/images/'+ room +'.jpg")');

    switch(room) { // needs separate object creation for easier object addition
    case "mars":
        createObject("teleport_left", "teleport.png", UNDER, "mars", "0%", "40%");
        createObject("teleport_right", "teleport.png", UNDER, "mars", "85%", "40%");
        createObject("wall", "wall.png", SOLID, "mars", "50%", "50%");
        objectlen = 3;

        break;
    case "earth":
        createObject("teleport_left", "teleport.png", UNDER, "earth", "0%", "40%");
        createObject("teleport_right", "teleport.png", UNDER, "earth", "85%", "40%");
        objectlen = 2;

        break;
    default:
        console.log("unknown room");
    }


    do {
        objects = $(".object");
    } while (objects.length < objectlen);

    allSolidObjects[room] = $(".solid-object");
    allSolidObjectsWalls[room] = [];
    allSolidObjects[room].each(function(i)
    {
        $(this).on('load', function(){
            console.log($(this).width());
            var obj = $(this);
            var pos = obj.position();
            allSolidObjectsWalls[room].push({x1: pos.left, y1: pos.top, x2: pos.left, y2: pos.top + obj.height()});
            allSolidObjectsWalls[room].push({x1: pos.left, y1: pos.top, x2: pos.left + obj.width(), y2: pos.top});
            allSolidObjectsWalls[room].push({x1: pos.left + obj.width(), y1: pos.top, x2: pos.left + obj.width(), y2: pos.top + obj.height()});
            allSolidObjectsWalls[room].push({x1: pos.left, y1: pos.top + obj.height(), x2: pos.left + obj.width(), y2: pos.top + obj.height()});
        });

    });


    
    var spawn = spawnLocation(lastRoom);
    socket.emit('reqspawn', ' ' + currentRoom, yourname, spawn.x , spawn.y);
}

function createObject(name, decal, type, room, x, y) { /*x, y - string N% Npx etc.*/
    var object = document.createElement("img");
    object.id = name;
    object.className = type;
    object.src = "images/" + decal;
    object.style.left = x;
    object.style.top = y;
    object.draggable = false;
    $(".game").append(object);
}

function playerObjectCollision(x, y) {
    var result = null;
    objects.each(function(i) {
        var pos = $(this).position();
        var objX = Number(pos.left);
        var objY = Number(pos.top);
        var objEndX = objX + Number($(this).width());
        var objEndY = objY + Number($(this).height());
        if (x > objX && y > objY && x < objEndX  && y < objEndY) {
            result = $(this).attr('id');
            return false;
        }
    });
    return result;
}

function executeObjectAction(name, objectTrigger) {
    
    //var object = $('#' + objectTrigger);
    //var objPos = object.position();
    var isYou = (name === yourname);
    switch (objectTrigger) {
        case "teleport_right":
            if (isYou) prepareRoom("earth");
            break;
        case "teleport_left":
            if (isYou) prepareRoom("mars");
            break;
        default:
    }
}

function get_line_intersection(p0_x, p0_y, p1_x, p1_y, 
                               p2_x, p2_y, p3_x, p3_y) {
                                   
    var intersect = {};

    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
        // Collision detected
        intersect.x = p0_x + (t * s1_x);
        intersect.y = p0_y + (t * s1_y);
        return intersect;
    }

    return false;
}

function checkAction(name, x, y) {
    executeObjectAction(name, playerObjectCollision(x, y));
}

function spawnPlayer(name, x, y) {
    var fig = document.createElement("figure");
    var player = document.createElement("img");
    var nametext = document.createElement("figcaption");
    var size = y * 0.266 - 46.402;
    fig.id = name;
    player.src = "images/cat2.png";
    player.style.height = "60px";
    player.draggable = false;
    player.style.width = "60px";
    fig.className = "player";
    nametext.innerHTML = name;
    if (x !== null ) {
        fig.style.left = x + 'px';
        fig.style.top = y + 'px';
        player.style.height = size + 'px';
        player.style.width = size + 'px';
    }
    fig.appendChild(player);
    fig.appendChild(nametext);
    $(".game").append(fig);
}

function getSize(y)
{
    return y * 0.238 - 41.32;
}

function displayChat(name, message) {
    var div = document.createElement("div");
    var player = $("#" + name);
    div.innerHTML = message + "\n\n";
    div.className = "chat-bubble tri-right btm-left-in";
    if (player.find('.chat-bubble').length)
        player.find('.chat-bubble').remove();
    var marginres = 50 + 25 * (message.length/10);
    div.style.marginTop = "-" + marginres + "px";
    player.prepend(div);
    if (name !== yourname) playAudio(messageSound);
    setTimeout(function(){ div.remove();}, 7950);
}

$('form').submit(function(){
    if ($('#username').val() === '') {
        var m = $('#m');
        if (m.val().match(/^[-!@#$%^&*()_+|~={}\[\]:;<>?,.\/0-9a-zA-Z ]{1,80}$/)) {
            socket.emit('chat message', yourname, m.val(), currentRoom);
            m.focus();
        } else 
            displayError("Invalid Message!");

        m.val('');
    }
    return false;
});

socket.on('spawn', function(target, name, x, y){
    if (yourname !== null) {
        if (yourname === target) {
            spawnPlayer(name, x, y);
        } else if (target === 'A L L') {
            spawnPlayer(name, x, y);
            if (name !== yourname) {
                var catplayer = $('#' + yourname);
                socket.emit('reqspawn', name, yourname, catplayer.position().left, catplayer.position().top);
            }
        }
    }
});

socket.on('playerleftroom', function (name) {
    $("#" + name).remove();
});

socket.on('chat message', function(name, msg, control){
  
    if (control === 'disconnect') {
        console.log("disappear please");
        $('#'+name).remove();
    }
    if (name === null || control !== null) {
        $('#messages').append($('<li>').text(msg));
    }
    else {
        $('#messages').append($('<li>').text('' + name + ': ' + msg));
        displayChat(name, msg);
    }
    
    var element = document.getElementById("messages");
    element.scrollTop = element.scrollHeight;
});

socket.on('errors', function(message){
    displayError(message);
});

socket.on('login', function(){
    $("#myModal").hide();
    var username_s = $('#username');
    yourname = username_s.val();
    prepareRoom("mars");
    username_s.val('');
});

socket.on('playermove', function(x, y, name, control){
    if (name === null) {
        console.log("Error, player is not found");
    } else {

        var catplayer = $("#" + name);
        var img = catplayer.find('img');

        catplayer.stop();
        img.stop();
        
        var xpos = parseInt(catplayer.css("left"));
        var ypos = parseInt(catplayer.css("top"));
        var destination_size = getSize(y);
        var current_size = getSize(ypos);
        $.each(allSolidObjectsWalls[currentRoom], function(i, p) {
            var intersect = get_line_intersection(xpos + current_size/2, ypos + current_size/2,
                                                    x + destination_size/2, y + destination_size/2,
                                                    p.x1, p.y1,
                                                    p.x2, p.y2);
            console.log(intersect);
            if (intersect) {
                var xadjust = 0;
                var yadjust = 0;
                var adjsut_value = 15;

                if (xpos > x ) xadjust = adjsut_value;
                else if (xpos < x) xadjust = -adjsut_value;
                if (ypos > y ) yadjust = adjsut_value;
                else if (ypos < y) yadjust = -adjsut_value;
                x = intersect.x + xadjust ;
                y = intersect.y + yadjust;
            }
        });
        
        var size = getSize(y);
        x = x - size/2;
        y = y - size/2;

        var xMove = x - xpos;
        var yMove = y - ypos;
        var absXMove = Math.abs(xMove);
        var absYMove = Math.abs(yMove);
        var xyMove = (absXMove + absYMove) * 2.5;
        var flip = (xMove < 0) ? 1:-1;
        img.css("transform", "scaleX("+ flip +")");

        if (xMove >= 0) xMove = "+=" + Math.round(xMove);
        else xMove = "-=" + Math.round(absXMove);
        
        if (yMove >= 0) yMove = "+=" + Math.round(yMove);
        else yMove = "-=" + Math.round(absYMove);
        
        var realSpeed = (control === "instant") ? 0 : Math.round(xyMove);

        catplayer.animate({
                left: xMove,
                top: yMove
            }, realSpeed, "linear", function() {
                checkAction(name, x, y);
        });
        
        var test = (absXMove + absYMove) / 1.42;
        
        img.animate({
            height: size,
            width: size
        }, realSpeed, "linear");
    }
    var element = document.getElementById("messages");
    element.scrollTop = element.scrollHeight;
});

