
"use strict";
  var startTime = null;

var content = $('#content');
var input = $('#inputchat');
var myColor = false;
var myName = false;

// usa le websocket incluse con il browser di mozilla, se l'utente lo utilizza
window.WebSocket = window.WebSocket || window.MozWebSocket;

// messaggio di errore se il client non supporta le websocket 
if (!window.WebSocket) {
  content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
							  + 'support WebSockets.'} ));
}

// apriamo la connessione
var connection = new WebSocket('ws://127.0.0.1:8000');

connection.onopen = function () { 

};

connection.onerror = function (error) {
  // just in there were some problems with conenction...
  content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
							  + 'connection or the server is down.' } ));
};

connection.onmessage = function (message) {
  try {
	  var json = JSON.parse(message.data);
  } catch (e) {
	  console.log('Something is wrong with the json: ', message.data);
	  return;
  }

  if (json.type === 'color') { 
	  myColor = json.data;
  } else if (json.type === 'history') { 
	  for (var i=0; i < json.data.length; i++) {
		  addMessage(json.data[i].author, json.data[i].avatar, json.data[i].text, json.data[i].color, new Date(json.data[i].time), '1');
	  }
  } else if (json.type === 'message') { 
	  input.removeAttr('disabled'); 
	  addMessage(json.data.author, json.data.avatar, json.data.text, json.data.color, new Date(json.data.time));
	  
	  if (startTime != null){
		  	 var latency = (new Date()).getTime() - startTime;
    console.log((new Date()).getTime() +"-"+ startTime +"="+ latency);
}
  } else if (json.type === 'users'){
	  var userslistx = JSON.parse(json.data);
	  $('#drawersub').html('');
	  $.each(userslistx, function( index, value ) {
	  addUser(value.author, value.avatar, value.color);
	  });
  
  } else {
	  console.log('Something is wrong with the json: ', json);
  }
  
};


function saveuserinfo(nomeuser, avataruser){
  var msg = nomeuser+';'+avataruser;
  connection.send(msg);
  connection.send("Just Connected!");	
  console.log("opened");
setInterval(function() {
  startTime = (new Date()).getTime();
  connection.send("Hello World!");
}, 2000);

}


input.keydown(function(e) {
  if (e.keyCode === 13) {
	  sendmsg();
  }
});



function sendmsg(){	 
  var msg =  ""+input.val()+";"+(new Date()).getTime();
  
    if (!msg) {
	 return;
  }
  connection.send(msg);
  input.val('');
  input.attr('disabled', 'disabled');
  input.focus();  
}




function addMessage(author, avatar, message, color, dt, ishistory) {		

  if (ishistory == '1') var opacity = 'class="alpha60"';
  else var opacity = '';
   
  content.append('<div '+opacity+'><div class="card"><paper-shadow z="0"><img src="bower_components/images/avatar-'+avatar+'.svg" class="avatar" style="position:absolute; top:-30px; left:-44px;" /><div style="position:absolute;top:3px; left:20px; font-size:12px; color:#ccc;">'+ (dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours()) + ':'+ (dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes())+'</div><span style="color:' + color + '">' + author + '</span><br>' + message + '</paper-shadow></div></div>');

   $("#content").stop().animate({
	  scrollTop: 100000
  });
}


function addUser(author, avatar, color){
  $('#drawersub').append('<div style="color:#eee; font-size:20px;"><img src="bower_components/images/avatar-'+avatar+'.svg" class="avatar" style="vertical-align:middle" /> '+author+' <div style="width:15px; height:15px; display:inline-block; vertical-align:middle; background:'+color+';" class="avatar"></div></div>');
}


setInterval(function() {
  if (connection.readyState !== 1) {
	  status.text('Error');
	  input.attr('disabled', 'disabled').val('Unable to comminucate '
										   + 'with the WebSocket server.');
  }
}, 3000);



