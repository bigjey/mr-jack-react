import Game from './Game';

import {
  PHASE,
  CHARACTERS,
  DIRECTIONS,
  ACTIONS,
  ACTION_PAIRS,
  randomDirection,
  TURN
} from './constants';

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
    const game = this.gameById[gameId];

    if (game) {
      game.players.push(socket);

      socket.emit('joinedGame', gameId);
      socket.join(gameId);

      if (game.players.length === 2) {
        game.setPhase(PHASE.CHARACTER_SELECTION);
      }

      this.updateGameInfo(gameId);
      this.updateGameList();
    }

  }

  leaveGame(gameId, socket) {
    var game = this.gameById[gameId];

    if (game) {
      game.players = game.players.filter(p => p.playerId !== socket.playerId);
      game.pending = game.pending.filter(p => p.playerId !== socket.playerId);
      socket.leave(gameId);

      if (game.players.length === 0) {
        this.removeGame(game.id);
      } else {
        game.setPhase(PHASE.LOBBY);
        this.updateGameInfo(gameId);
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

        this.updateGameInfo(game.id);
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

      if (game.timeouts.ready) {
        game.ready = game.ready.filter(p => p !== socket.playerId);
        clearTimeout(game.timeouts.ready);
        this.io.to(game.id).emit('cancelReadyCountdown');
      }

      this.updateGameInfo(game.id);
      this.updateGameList();
    }
  }

  selectCharacter(socket, gameId, character) {
    const game = this.gameById[gameId];

    if (game) {
      game.characterSelection[socket.playerId] = character;

      this.updateGameInfo(gameId);
    }
  }

  toggleReady(socket, gameId) {
    const game = this.gameById[gameId];

    if (game) {
      if (game.ready.indexOf(socket.playerId) !== -1) {
        game.ready = game.ready.filter(pId => pId !== socket.playerId)
      } else {
        game.ready.push(socket.playerId)
      }

      if (game.ready.length === 2) {
        game.timeouts.ready = setTimeout(() => {
          game.setPhase(PHASE.PLAY);
          game.newGame();
          this.updateGameInfo(gameId);
          this.io.to(gameId).emit('cancelReadyCountdown');
        }, 5000);
        this.io.to(gameId).emit('startReadyCountdown');
      } else {
        clearTimeout(game.timeouts.ready);
        this.io.to(gameId).emit('cancelReadyCountdown');
      }

      this.updateGameInfo(gameId);
    }
  }

  findGameWithPlayer(playerId) {
    return this.games.find(g => g.players.some(p => p.playerId === playerId));
  }

  updateGameList() {
    // console.log('updating game list');
    this.io.emit('gameList', this.games.map(this.normalizeGame));
  }

  updateGameInfo(gameId) {
    const game = this.gameById[gameId];

    if (game) {
      // console.log('updating game info');
      game.updateGameInfo();
    }
  }

  normalizeGame(game) {
    return {
      id: game.id,
      phase: game.phase,
      players: game.players.map(p => p.playerId),
      waiting: game.pending.map(p => p.playerId),
      selection: game.characterSelection,
      ready: game.ready
    }
  }
}

module.exports = (io) => new GameManager(io);