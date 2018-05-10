import {
  PHASE,
  CHARACTERS,
  DIRECTIONS,
  ACTIONS,
  ACTION_PAIRS,
  randomDirection,
  TURN
} from './constants';

class Game {

  constructor(socket) {
    this.socket = socket;
    this.id = Math.floor(Math.random() * 1000000);
    this.players = [];
    this.pending = [];
    this.ready = [];
    this.characterSelection = {};

    this.grid = [];
    this.detectives = [];
    this.suspects = [];
    this.actionTokens = [];

    this.phase = PHASE.LOBBY;

    this.turn = TURN.DETECTIVE;

    this.timeouts = {
      ready: null,
      reconnecting: {},
    }
  }

  setPhase(phase) {
    this.phase = phase;
  }

  isFull() {
    return this.players.length === 2;
  }

  newGame() {
    this.setJack();

    this.setupGrid();
    this.resetDetectives();
    this.resetSuspects();
    this.randomizeActions();

    this.round = 1;

    this.updateGameInfo();
  }

  updateGameInfo() {
    const data = this.normalize();

    // console.log('updating', data);

    this.socket.emit('gameData', data);
    this.socket.to(this.id).emit('gameData', data);
  }

  normalize() {
    return {
      id: this.id,
      phase: this.phase,
      players: this.players.map(p => p.playerId),
      waiting: this.pending.map(p => p.playerId),
      selection: this.characterSelection,
      ready: this.ready,
      grid: this.grid,
      detectives: this.detectives,
      suspects: this.suspects,
      actionTokens: this.actionTokens,
    }
  }

  setJack() {
    this.jack = Object.keys(CHARACTERS)[Math.floor(Math.random() * 9)];
  }

  setupGrid() {
    let grid = Array(3);
    let suspectsLeft = Object.keys(CHARACTERS).sort(
      (a, b) => 0.5 - Math.random()
    );

    for (let y = 0; y < 3; y++) {
      let row = Array(3);

      for (let x = 0; x < 3; x++) {
        let wall;

        if (x === 0 && y === 0) {
          wall = DIRECTIONS.LEFT;
        } else if (x === 2 && y === 0) {
          wall = DIRECTIONS.RIGHT;
        } else if (x === 1 && y === 2) {
          wall = DIRECTIONS.DOWN;
        } else {
          wall = randomDirection();
        }

        let tile = {
          character: suspectsLeft.pop(),
          wall,
          showMenu: false,
          suspect: true,
          selected: false,
          rotated: false
        };

        row[x] = tile;
      }

      grid[y] = row;
    }

    this.grid = grid;
  }

  resetDetectives() {
    this.detectives =[
      {
        name: "Holmes",
        x: -1,
        y: 0,
        selected: false
      },
      {
        name: "Watson",
        x: 3,
        y: 0,
        selected: false
      },
      {
        name: "Toby",
        x: 1,
        y: 3,
        selected: false
      }
    ];
  }

  resetSuspects() {
    let suspectsLeft = Object.keys(CHARACTERS)
      .filter(s => s !== this.jack)
      .sort((a, b) => 0.5 - Math.random());
    this.suspects = suspectsLeft;
  }

  randomizeActions() {
    let pairs = ACTION_PAIRS.slice().sort(() => 0.5 - Math.random());

    this.actionTokens = Array(4)
      .fill(null)
      .map(a => ({
        flipped: Math.random() > 0.5,
        actions: pairs.pop(),
        used: false,
        selected: false
      }));
  }

  // normalize() {
  //   return {
  //     grid: this.grid,
  //     detectives: this.detectives,
  //     suspects: this.suspects,
  //     actionTokens: this.actionTokens,
  //   }
  // }

}

module.exports = Game;