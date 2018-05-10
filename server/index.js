import Express from 'express';
import Socket from 'socket.io';
import http from 'http';

const app = Express();
const server = http.Server(app);
const io = Socket(server);

import GameManager from './GameManager';

const gameManager = GameManager(io);

io.on('connection', function (socket) {
  // console.log('connection');
  gameManager.updateGameList();
  
  socket.on('playerId', (playerId) => {
    socket.playerId = playerId;
    gameManager.connected(socket);
  })
  
  socket.on('createGame', () => {
    gameManager.createGame(socket);
  })

  socket.on('joinGame', (gameId) => {
    // console.log('joining', gameId);
    gameManager.joinGame(gameId, socket);
  })

  socket.on('leaveGame', (gameId) => {
    // console.log('leave', gameId);
    gameManager.leaveGame(gameId, socket);
  })

  socket.on('disconnect', () => {
    gameManager.disconnected(socket);
  })

  socket.on('selectCharacter', ({gameId, character}) => {
    // console.log('selected character', gameId, character);
    gameManager.selectCharacter(socket, gameId, character);
  })

  socket.on('toggleReady', (gameId) => {
    gameManager.toggleReady(socket, gameId);
  })

});

server.listen(1234);