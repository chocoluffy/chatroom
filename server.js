var http = require('http');
	socketIO = require('socket.io');
	fs = require('fs');

// if using express framework, we can define router easier!
var server = http.createServer(function(req, res){
	fs.readFile(__dirname + '/index.html', function(err, data){
		res.writeHead(200);
		res.end(data);
	});
});

var port = process.env.PORT || 3000;
server.listen(port);
console.log('listen on ' + port);

var io = socketIO(server);
var sockets = [];
var ID2user = {}; // username 

io.on('connection', function(socket){
	sockets.push(socket);
	
	var updateUserNum = function(skt){
		var people = sockets.length === 1 ? 'person' : 'people';
		skt.emit('greeting-from-server', {
			greeting: 'Welcome! ' + sockets.length + ' ' + people + ' online now!'
		});
	};

	updateUserNum(socket);

	// boardcast?!
	socket.on('message', function(message){
		var userlistChanged = false;
		if(!ID2user[socket.id]){ // if new user comes in.
			var profile = {
				username: message.username,
				avatar: message.avatar
			};
			ID2user[socket.id] = profile;
			userlistChanged = true;
		}
		for(var i=0; i < sockets.length; i++){
			sockets[i].emit('message', message);
			if(userlistChanged){ // update userlist when new user comes in.
				console.log(ID2user[socket.id].username + '(id: ' + socket.id + ' )' + 'joins!');
				sockets[i].emit('userlist', ID2user);
				updateUserNum(sockets[i]);
			}
		}
	});

	socket.on('disconnect', function(){
		for(var i=0; i<sockets.length; i++){
			if(sockets[i].id === socket.id){
				sockets.splice(i, 1);
			}
		}
		var usernameOut = ID2user[socket.id].username;
		delete ID2user[socket.id]; // remove user from online users.
		// send to client an updated userlist.
		for(var i=0; i < sockets.length; i++){
			console.log(usernameOut + '(id: ' + socket.id + ' )' + 'leaves...');
			sockets[i].emit('userlist', ID2user);
			updateUserNum(sockets[i]);
		}
		console.log("There are " + sockets.length + " active sockets remaining.");
	});
});

// the following is the express version:
// 
// var express = require('express'),
//     app = express(),
//     http = require('http'),
//     socketIO = require('socket.io'),
//     server, io;
// app.get('/', function (req, res) {
// res.sendFile(__dirname + '/index.html');
// });
// server = http.Server(app);
// server.listen(5000);
// io = socketIO(server);
// io.on('connection', function (socket) {
//   socket.emit('greeting-from-server', {
//       greeting: 'Hello Client'
//   });
//   socket.on('greeting-from-client', function (message) {
//     console.log(message);
// }); });