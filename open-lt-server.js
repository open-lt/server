"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'open-lt-server';

// Port where we'll run the websocket server
var webSocketsServerPort = 80;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

// latest 1000 messages
var history = [];
// list of currently connected clients (users)
var clients = [];


/**
 * HTTP server
 */
var server = http.createServer(function (request, response) {
  // Not important for us. We're writing WebSocket server,
  // not HTTP server
});
server.listen(webSocketsServerPort, function () {
  console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});
server.on('connection', function (request) {
  console.log((new Date()) + ' Server: connection incomming from: ' + request.remoteAddress + '.');
});


/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
  // WebSocket server is tied to a HTTP server. WebSocket
  // request is just an enhanced HTTP request. For more info 
  // http://tools.ietf.org/html/rfc6455#page-6
  httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function (request) {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

  // accept connection - you should check 'request.origin' to
  // make sure that client is connecting from your website
  // (http://en.wikipedia.org/wiki/Same_origin_policy)
  var connection = request.accept(null, request.origin = null);
  // we need to know client index to remove them on 'close' event
  var index = clients.push(connection) - 1;
  var userName = false;
  var userColor = false;

  console.log((new Date()) + ' Connection accepted.');

  // send back chat history
  if (history.length > 0) {
    connection.sendUTF(
      JSON.stringify({ type: 'history', data: history }));
  }

  // user sent some message
  connection.on('message', function (message) {
    if (message.type === 'utf8') { // accept only text
      // first message sent by user is their name

      if (userName === false) {
        // remember user name
        userName = message.utf8Data;

        connection.sendUTF(
          JSON.stringify({ type: 'hello', data: userName }));
        console.log((new Date()) + ' User is known as: ' + userName);

      } else { // log and broadcast the message
        console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);

        // we want to keep history of all sent messages
        var obj = {
          time: (new Date()).getTime(),
          text: message.utf8Data,
          author: userName
        };
        history.push(obj);
        history = history.slice(-1000);

        // broadcast message to all connected clients
        var json = JSON.stringify({ type: 'message', data: obj });
        for (var i = 0; i < clients.length; i++) {
          clients[i].sendUTF(json);
        }
      }
    }
  });

  // user disconnected
  connection.on('close', function (connection) {
    if (userName !== false && userColor !== false) {
      console.log((new Date()) + " Peer "
        + connection.remoteAddress + " disconnected.");

      // remove user from the list of connected clients
      clients.splice(index, 1);
      // push back user's color to be reused by another user
      colors.push(userColor);
    }
  });
});