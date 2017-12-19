var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var GameManager = require('./GameManager')(io);

io.on('connection', function (socket) {
  GameManager.updateGameList();
  
  socket.on('playerId', (playerId) => {
    socket.playerId = playerId;
    GameManager.connected(socket);
  })
  
  socket.on('createGame', () => {
    GameManager.createGame(socket);
  })

  socket.on('joinGame', (gameId) => {
    GameManager.joinGame(gameId, socket);
  })

  socket.on('leaveGame', (gameId) => {
    console.log('leave', gameId);
    GameManager.leaveGame(gameId, socket);
  })

  socket.on('disconnect', () => {
    GameManager.disconnected(socket);
  })

});

server.listen(1234);