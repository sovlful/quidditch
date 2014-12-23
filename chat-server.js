// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";
process.title = 'node-chat';
 
var webSocketsServerPort = 8000;
var webSocketServer = require('websocket').server;
var http = require('http');
var url = require("url");
var st = require('node-static');

var fileServer = new st.Server('./');
 
var history = [ ];
var clients = [ ];
var users = [ ];

function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
 
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
colors.sort(function(a,b) { return Math.random() > 0.5; } );
 
var server = http.createServer(function(request, response) {
	request.addListener('end', function () {
		fileServer.serve(request, response);
	}).resume();
}).listen(webSocketsServerPort);;


server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
 
/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    httpServer: server
});
 
wsServer.on('request', function(request) {
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
    var connection = request.accept(null, request.origin); 
    var index = clients.push(connection) - 1;
    var userName = false;
    var userAvatar = false;
    var userColor = false;
 	//console.log(connection);
    console.log((new Date()) + ' Connection accepted.');
 
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }
 
    connection.on('message', function(message) {
        if (message.type === 'utf8') { // solo text
            if (userName === false) { 

				var splitFirstMsg = htmlEntities(message.utf8Data).split(";");
                userName = splitFirstMsg[0];
				userAvatar = splitFirstMsg[1];

                userColor = colors.shift();
                connection.sendUTF(JSON.stringify({ type:'color', data: userColor }));
             //   console.log((new Date()) + ' User is known as: ' + userName + ' with ' + userColor + ' color.');
				var userobj = {
                    author: userName,
					avatar: userAvatar,
                    color: userColor
                };
                users.push(userobj);
			    for (var i=0; i < clients.length; i++) {
				clients[i].sendUTF(JSON.stringify({ type:'users', data: JSON.stringify(users) }));
				}
			//	console.log('users connected:'+JSON.stringify(users));

            } else {
				
				var splitMsgs = htmlEntities(message.utf8Data).split(";");
                var msg = splitMsgs[0];
				var timestamp0 = splitMsgs[1];
				

              //  console.log((new Date()) + ' Received Message from '+ userName + ': ' + message.utf8Data);
                
				var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities(message.utf8Data),
                    author: userName,
					avatar: userAvatar,
                    color: userColor
				                };
                history.push(obj);
                history = history.slice(-100);
 
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
                }
            }
        }
    });
 
    connection.on('close', function(code) {
 if (userName !== false && userColor !== false) {
            //console.log((new Date()) + " Peer " + connection.remoteAddress + " disconnected.");
            clients.splice(index, 1);
			
			users.splice(index, 1);
                var obj = {
                    time: (new Date()).getTime(),
                    text: htmlEntities("--Disconnected--"),
                    author: userName,
					avatar: userAvatar,
                    color: userColor
                };
                history.push(obj);
                history = history.slice(-100);
 
                var json = JSON.stringify({ type:'message', data: obj });
                for (var i=0; i < clients.length; i++) {
                    clients[i].sendUTF(json);
					clients[i].sendUTF(JSON.stringify({ type:'users', data: JSON.stringify(users) }));
                }
       colors.push(userColor);
        }
    });
 
});