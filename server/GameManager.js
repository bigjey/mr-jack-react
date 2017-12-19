var Game = require('./Game');

class GameManager {
  constructor(io) {
    this.io = io;
    this.games = [];
    this.gameById = {}
  }

  createGame(socket) {
    var game = new Game(socket);

    this.games.push(game);
    this.gameById[game.id] = game;

    this.joinGame(game.id, socket);
  }

  removeGame(gameId) {
    this.games = this.games.filter(g => g.id !== gameId);
    delete this.gameById[gameId];

    this.updateGameList();
  }

  joinGame(gameId, socket) {
    this.gameById[gameId].players.push(socket);
    socket.emit('joinedGame', gameId);
    socket.join(gameId);

    this.updateGameList();
  }

  leaveGame(gameId, socket) {
    var game = this.gameById[gameId];

    if (game) {
      game.players = game.players.filter(p => p.playerId !== socket.playerId);
      game.pending = game.pending.filter(p => p.playerId !== socket.playerId);
      socket.leave(gameId);

      if (game.players.length === 0) {
        this.removeGame(game.id);
      }
    }

    this.updateGameList();
  }

  connected(socket) {
    var game = this.findGameWithPlayer(socket.playerId);

    if (game) {
      var pending = game.pending.find(p => p.playerId === socket.playerId);
      if (pending) {
        clearTimeout(pending.timeout);
        game.pending = game.pending.filter(p => p.playerId !== socket.playerId);

        socket.emit('joinedGame', game.id);
        socket.join(game.id);

        this.updateGameList();
      }
    }
  }

  disconnected(socket) {
    var game = this.findGameWithPlayer(socket.playerId);

    if (game) {
      game.pending.push({
        playerId: socket.playerId,
        timeout: setTimeout(() => {
          this.leaveGame(game.id, socket);
        }, 3000)
      });

      this.updateGameList();
    }
  }

  findGameWithPlayer(playerId) {
    return this.games.find(g => g.players.some(p => p.playerId === playerId));
  }

  updateGameList() {
    console.log('updating game list');
    this.io.emit('gameList', this.games.map(this.normalizeGame));
  }

  normalizeGame(game) {
    return {
      id: game.id,
      players: game.players.map(p => p.playerId),
      waiting: game.pending.map(p => p.playerId)
    }
  }
}

module.exports = (io) => new GameManager(io);