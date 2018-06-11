var modal = document.getElementById('myModal');
var btn = document.getElementById("myBtn");
var socket = io();
var yourname;

btn.onclick = function() {
	if ($('#username').val() != '')
	{
	    modal.style.display = "none"
	    socket.emit('chosenname', $('#username').val())
	    yourname = $('#username').val();
	}
}

document.onclick = function() {
	if (yourname != null && $('#'+yourname) != null) {
		socket.emit('playermove', (event.clientX - 50 >= 0) ? event.clientX - 50 : 0, (event.clientY - 50 >= 0) ? event.clientY - 50 : 0, yourname);
	}
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
	}
	fig.appendChild(player);
	fig.appendChild(nametext);
	document.body.appendChild(fig);
}

$('form').submit(function(){
  if ($('#username').val() != '')
  {
	socket.emit('chat message',$('#username').val(), '' + $('#username').val() + ' joined.', 'join');
	$('#username').val('');
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

  }
  var element = document.getElementById("messages");
  element.scrollTop = element.scrollHeight;
});

socket.on('playermove', function(x, y, name){
  if (name == null) {
	console.log("ebi si maikata");
  } else {

	var catplayer = $("#" + name);
	catplayer.stop();
	var xMove = x - parseInt(catplayer.css("left"));
	var yMove = y - parseInt(catplayer.css("top"));
	
	if (xMove >= 0) xMove = "+=" + xMove;
	else xMove = "-=" + -xMove;
	
	if (yMove >= 0) yMove = "+=" + yMove;
	else yMove = "-=" + -yMove;
	
	
	$( "#" + name ).animate({
			left: xMove,
			top: yMove
		}, "slow" );
  }
  var element = document.getElementById("messages");
  element.scrollTop = element.scrollHeight;
});

