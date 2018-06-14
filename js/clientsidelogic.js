var modal = document.getElementById('myModal');
var btn = document.getElementById("myBtn");
var socket = io();
var yourname;
var objects;

prepareRoom("mars");

btn.onclick = function() {
	var username = $('#username').val();
	var password = $('#password').val();
	
	if (username != '' && password != '')
	{
		if (username.indexOf(" ") === -1)
			socket.emit('chosenname', username, password);
		else
			displayError("You cant have spaces in your username!");
	} else {
		displayError("Enter username and password!");
	}
}

$('#game-container').click(function() {
	var offset = $('.game').offset();
	var x = event.clientX - offset.left;
	var y = event.clientY - offset.top;

	if (yourname != null && $('#'+yourname) != null) {
		var ratio = (y * 1.0) / 768;
		if (ratio < 0.95 && ratio > 0.3 && x + y != 0)
			socket.emit('playermove', x, y, yourname, null);
	}	 
});

function displayError(message) {
	var div = document.createElement("div");
	div.innerHTML = message;
	div.className = "error";
	$(".game").append(div);
	setTimeout(function(){ div.remove(); }, 6000);
}

function prepareRoom(room) {
	
	switch(room) { // needs separate object creation for easier object addition
    case "mars":
		createObject("teleport_left", "teleport.png", true, "0%", "40%");
        createObject("teleport_right", "teleport.png", true, "85%", "40%");
        break;
    case "earth":
        break;
    default:
        console.log("unknown room");
	}
	
	do {
		objects = $(".object");
	} while (objects.length < 2);
		
}

function createObject(name, decal, type, x, y) { /*x, y - string N% Npx etc.*/
	var object = document.createElement("img");
	object.id = name;
	object.className = (type) ? "object object-below-player" : "object object-above-player";  //true - under, false - above;
	object.src = "images/" + decal;
	object.style.left = x;
	object.style.top = y;
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

function checkAction(name, x, y) {
	var objectTrigger = playerObjectCollision(x, y);
	var object = $('#' + objectTrigger);
	var objPos = object.position();
	
	if (yourname == name) {
		
		if (objectTrigger == "teleport_right") {
			var destPos = $("#teleport_left").position();
			socket.emit('playermove', destPos.left + 100, destPos.top + 100, yourname, "instant");
		}
	} else {
		//Do stuff for other players' actions
	}
}

function spawnPlayer(name, x, y) {
	var fig = document.createElement("figure");
	var player = document.createElement("img");
	var nametext = document.createElement("figcaption");
	var size = y * 0.266 - 46.402;
	fig.id = name;
	player.src = "images/cat2.png";
	player.style.height = "100px";
	player.style.width = "100px";
	fig.className = "player";
	nametext.innerHTML = name;
	if (x != null ) {
		fig.style.left = x + 'px';
		fig.style.top = y + 'px';
		player.style.height = size + 'px';
		player.style.width = size + 'px';
	}
	fig.appendChild(player);
	fig.appendChild(nametext);
	$(".game").append(fig);
}

function displayChat(name, message) {
	var div = document.createElement("div");
	var player = $("#" + name);
	div.innerHTML = message + "\n\n";
	div.className = "chat-bubble";
	if (player.find('.chat-bubble').length)
		player.find('.chat-bubble').remove();
	player.prepend(div);
	setTimeout(function(){ div.remove();}, 8000);
}

$('form').submit(function(){
  if ($('#username').val() != '')
  {

  }
  else 
  {
	if ($('#m').val() != '')
	  socket.emit('chat message', yourname, $('#m').val());
	$('#m').val('');
  }
	  return false;
});

socket.on('spawn', function(target, name, x, y){
	if (yourname != null) {
		if (yourname == target) {
			spawnPlayer(name, x, y);
		} else if (target == 'A L L') {
			spawnPlayer(name, x, y);
			if (name != yourname) {
				var catplayer = $('#' + yourname);
				socket.emit('reqspawn', name, yourname, catplayer.position().left, catplayer.position().top);
			}
		}
	}
});

socket.on('chat message', function(name, msg, control){
  
  if (control == 'disconnect') {
	  console.log("disappear please");
	  $('#'+name).remove();
  }
  if (name == null || control != null)
  {
	$('#messages').append($('<li>').text(msg));
  }
  else
  {
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
	modal.style.display = "none"
	yourname = $('#username').val();
	socket.emit('reqspawn', 'A L L', yourname, null, null);
	$('#username').val('');
});

socket.on('playermove', function(x, y, name, control){
	if (name == null) {
		console.log("Error, player is not found");
	} else {
		

	var speed = 2.85;
	var size = y * 0.238 - 41.32;
	x = x - size/2;
	y = y - size/2;
	var catplayer = $("#" + name);
	var img = catplayer.find('img');

	catplayer.stop();
	img.stop();
	
	var xpos = parseInt(catplayer.css("left"));
	var ypos = parseInt(catplayer.css("top"));
	var xMove = x - xpos;
	var yMove = y - ypos;
	var absXMove = Math.abs(xMove);
	var absYMove = Math.abs(yMove);
	var xyMove = Math.sqrt(absXMove*absXMove + absYMove*absYMove);
	var flip = (xMove < 0) ? 1:-1;
	img.css("transform", "scaleX("+ flip +")");
	
	if (xMove >= 0) xMove = "+=" + xMove;
	else xMove = "-=" + -xMove;
	
	if (yMove >= 0) yMove = "+=" + yMove;
	else yMove = "-=" + -yMove;
	
	var realSpeed = (control == "instant") ? 0 : Math.round(xyMove * speed);
	
	catplayer.animate({
			left: xMove,
			top: yMove
		}, realSpeed, "linear", function() {
			checkAction(name, x, y);
	});
	
	img.animate({
		height: size,
		width: size
	}, realSpeed, "linear");
  }
  var element = document.getElementById("messages");
  element.scrollTop = element.scrollHeight;
});

