class Game {
  constructor(socketId) {
    this.id = Math.floor(Math.random() * 1000000);
    this.owner = socketId;
    this.players = [];
    this.pending = [];
  }

  isFull() {
    return this.players.length === 2;
  }
}

module.exports = Game;