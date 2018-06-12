var modal = document.getElementById('myModal');
var btn = document.getElementById("myBtn");
var socket = io();
var yourname;

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


document.onclick = function() {
	if (yourname != null && $('#'+yourname) != null) {
		var ratio = (event.clientY * 1.0) / window.screen.height;
		var ratio2 = 150 * (event.clientY/1014.0);
		if (ratio < 0.89 && ratio > 0.3 && event.clientX + event.clientY != 0)
			socket.emit('playermove', (event.clientX - ratio2 >= 0) ? event.clientX - ratio2 : 0, (event.clientY - ratio2 >= 0) ? event.clientY - ratio2 : 0, yourname);
	}
}

function displayError(message) {
	var div = document.createElement("div");
	div.innerHTML = message;
	div.className = "error";
	document.body.appendChild(div);
	setTimeout(function(){ div.remove(); }, 6000);
}

function spawnPlayer(name, x, y) {
	var fig = document.createElement("figure");
	var player = document.createElement("img");
	var nametext = document.createElement("figcaption");
	fig.id = name;
	player.src = "images/cat.png";
	fig.className = "player";
	nametext.innerHTML = name;
	if (x != null ) {
		fig.style.left = x + 'px';
		fig.style.top = y + 'px';
		player.style.height = 200 * (y/1014.0) + 'px';
		player.style.width = 200 * (y/1014.0) + 'px';
	}
	fig.appendChild(player);
	fig.appendChild(nametext);
	document.body.appendChild(fig);
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
	if (yourname == target && target != name) spawnPlayer(name, x, y);
});

socket.on('chat message', function(name, msg, control){
  
  if (control == 'join') {
	spawnPlayer(name, null, null);
	var catplayer = $('#' + yourname);
	socket.emit('reqspawn', name, yourname, parseInt(catplayer.css("left")), parseInt(catplayer.css("top")));
  }
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
	socket.emit('chat message', yourname, '' + yourname + ' joined.', 'join');
	$('#username').val('');
});

socket.on('playermove', function(x, y, name){
  if (name == null) {
	console.log("Error, player is not found");
  } else {

	var catplayer = $("#" + name);
	var img = catplayer.find('img');
	catplayer.stop();
	img.stop();
	var xpos = parseInt(catplayer.css("left"));
	var ypos = parseInt(catplayer.css("top"));
	var xMove = x - xpos;
	var yMove = y - ypos;
	
	if (xMove >= 0) xMove = "+=" + xMove;
	else xMove = "-=" + -xMove;
	
	if (yMove >= 0) yMove = "+=" + yMove;
	else yMove = "-=" + -yMove;
	
	
	$( "#" + name ).animate({
			left: xMove,
			top: yMove
		}, "slow" );
	
	img.animate({
		height: 200 * (y/1014.0),
		width: 200 * (y/1014.0)
	}, "slow");
  }
  var element = document.getElementById("messages");
  element.scrollTop = element.scrollHeight;
});

