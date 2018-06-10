var modal = document.getElementById('myModal');
var theend = document.getElementById('roundEnd');
var paintings = document.getElementById('paintings');
var btn = document.getElementById("myBtn");
var players = 0;
var sock = io();
var yourname;
var screen = new Image(500, 1000);

btn.onclick = function() {
	if ($('#username').val() != '')
	{
	    modal.style.display = "none"
	    sock.emit('chosenname', $('#username').val())
	    yourname = $('#username').val();
	}
}

var socket = io();

$('form').submit(function(){
  if ($('#username').val() != '')
  {
	socket.emit('chat message',null, '' + $('#username').val() + ' joined.');
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

function setTextColor(picker) {
	curColor = '#' + picker.toString()
}

function KeyPress(e) {
  var evtobj = window.event? event : e
  if (evtobj.keyCode == 90 && evtobj.ctrlKey) {
	var img = new Image();
	undoHistory.pop();
	newCanvas();
	img.scr = undoHistory[undoHistory.length - 1];
	context.drawImage(img, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
  }
}

document.onkeydown = KeyPress;

socket.on('updateTimer', function(timerseconds, word){
	document.getElementById("themeword").innerHTML = "Draw "+ word +"!";
	if (timerseconds <= 60)
		document.getElementById("timerShow").innerHTML = timerseconds;
	else
		document.getElementById("timerShow").innerHTML = "The round ended!";
	if (timerseconds == 1)
	{
		var platno = document.getElementById('canvas');
		
		socket.emit('queuedrawing', platno.toDataURL(), yourname);
		if (yourname != null)
			theend.style.display = "flex";
	}
	if (timerseconds == 61)
	{
		$('#paintings').empty();
		newCanvas();
		undoHistory = [];
		theend.style.display = "none";
	}
});

socket.on('queuedrawing', function(imageurl, name){
	if (name != null)
	{
		var image = new Image((canvas.width/2)-100, (canvas.height/2)-50);
		image.id = "pic"
		image.name = name;
		if (yourname != name)
			image.onclick = function () { socket.emit('winner',yourname, name); theend.style.display = "none"; };
		else
			image.onclick = function () {alert("Cannot vote for yourself!");};
		image.src = imageurl;
		document.getElementById('paintings').appendChild(image);
	}
});

socket.on('chat message', function(name, msg){
  if (name == null)
  {
	players++;
	$('#messages').append($('<li>').text(msg));
  }
  else
  {
	$('#messages').append($('<li>').text('' + name + ': ' + msg));

  }
  var element = document.getElementById("messages");
  element.scrollTop = element.scrollHeight;
});
