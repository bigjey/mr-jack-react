import {
  PHASE,
  CHARACTERS,
  DIRECTIONS,
  ACTIONS,
  ACTION_PAIRS,
  randomDirection,
  TURN
} from "./constants";

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

    this.jack = null;

    this.round = 0;

    this.games = [];

    this.gameId = null;

    this.playerId = null;

    this.jackTime = 0;

    this.jackCards = [];

    this.timeouts = {
      ready: null,
      reconnecting: {}
    };
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

    this.socket.emit("gameData", data);
    this.socket.to(this.id).emit("gameData", data);
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
      actionTokens: this.actionTokens
    };
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
    this.detectives = [
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

  get jackTotalTime() {
    return this.jackTime + this.jackCardsTime;
  }

  get isJackTurn() {
    return this.turn === TURN.JACK;
  }

  get isDetectiveTurn() {
    return this.turn === TURN.DETECTIVE;
  }

  get jackCardsTime() {
    return this.jackCards.reduce((total, char) => {
      return total + CHARACTERS[char].time;
    }, 0);
  }

  get tiles() {
    let tiles = [];
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        tiles.push(this.grid[y][x]);
      }
    }
    return tiles;
  }

  rotateTile(x, y, rotations) {
    this.grid[y][x].wall += rotations;
    this.endAction();

    console.log("rotate", x, y, rotations);

    this.updateGameInfo();
  }

  endAction() {
    return;
    let gameover = false;

    if ([4, 0].indexOf(this.round % 8) !== -1) {
      gameover = this.inspect().gameover;

      this.tiles.forEach(t => (t.rotated = false));
    }

    this.tiles.forEach(t => (t.selected = false));

    this.detectives.forEach(d => (d.selected = false));

    if (gameover) return;

    this.round++;

    this.actionTokens.forEach(a => {
      if (a.selected) {
        a.selected = false;
        a.used = true;
      }
    });

    if (this.round % 8 === 1) {
      this.randomizeActions();
    } else if (this.round % 8 === 5) {
      this.actionTokens.forEach(t => {
        t.flipped = !t.flipped;
        t.used = false;
      });
    }

    if ([1, 4, 6, 7].indexOf(this.round % 8) !== -1) {
      this.turn = TURN.DETECTIVE;
    } else {
      this.turn = TURN.JACK;
    }

    if (this.jackTotalTime === 6) {
      console.log("JACK WON, he was", this.jack);
    }
  }

  inspect() {
    let result = {
      inSight: [],
      notInSight: [],
      jackInSight: false,
      gameover: false
    };

    this.detectives.forEach(detective => {
      switch (this.lookingAt(detective)) {
        case DIRECTIONS.UP:
          for (let y = 2; y >= 0; y--) {
            const tile = this.grid[y][detective.x];
            const wall = (tile.wall - 1) % 4 + 1;

            if (wall === DIRECTIONS.DOWN) break;

            result.inSight.push(tile);
            if (tile.character === this.jack) result.jackInSight = true;

            if (wall === DIRECTIONS.UP) break;
          }
          break;

        case DIRECTIONS.RIGHT:
          for (let x = 0; x < 3; x++) {
            const tile = this.grid[detective.y][x];
            const wall = (tile.wall - 1) % 4 + 1;

            if (wall === DIRECTIONS.LEFT) break;

            result.inSight.push(tile);
            if (tile.character === this.jack) result.jackInSight = true;

            if (wall === DIRECTIONS.RIGHT) break;
          }
          break;

        case DIRECTIONS.DOWN:
          for (let y = 0; y < 3; y++) {
            const tile = this.grid[y][detective.x];
            const wall = (tile.wall - 1) % 4 + 1;

            if (wall === DIRECTIONS.UP) break;

            result.inSight.push(tile);
            if (tile.character === this.jack) result.jackInSight = true;

            if (wall === DIRECTIONS.DOWN) break;
          }
          break;

        case DIRECTIONS.LEFT:
          for (let x = 2; x >= 0; x--) {
            const tile = this.grid[detective.y][x];
            const wall = (tile.wall - 1) % 4 + 1;

            if (wall === DIRECTIONS.RIGHT) break;

            result.inSight.push(tile);
            if (tile.character === this.jack) result.jackInSight = true;

            if (wall === DIRECTIONS.LEFT) break;
          }
          break;
        default:
          break;
      }
    });

    this.forEachTile((tile, x, y) => {
      if (result.inSight.indexOf(tile) === -1) {
        result.notInSight.push(tile);
      }
    });

    if (result.notInSight.length) {
      console.log("highlight");
      // this.highlightVisibleTiles(result.notInSight.map(t => t.character));
    }

    let visibleSuspects = result.inSight.filter(t => t.suspect);
    let notVisibleSuspects = result.notInSight.filter(t => t.suspect);

    if (result.jackInSight) {
      setTimeout(() => {
        notVisibleSuspects.forEach(t => {
          t.suspect = false;
        });
      }, 1000);

      if (visibleSuspects.length === 1 && this.jackTotalTime < 6) {
        result.gameover = true;

        setTimeout(() => {
          alert(`GOTCHA! ${visibleSuspects[0].character} is Jack!`);
        }, 2000);
      }
    } else {
      setTimeout(() => {
        visibleSuspects.forEach(t => {
          t.suspect = false;
        });

        this.jackTime += 1;

        if (this.jackTotalTime >= 6) {
          alert("JACK WON, he was", this.jack);
          result.gameover = true;
        }
      }, 1000);

      if (notVisibleSuspects.length === 1 && this.jackTotalTime < 6) {
        result.gameover = true;

        setTimeout(() => {
          alert(`GOTCHA! ${notVisibleSuspects[0].character} is Jack!`);
        }, 2000);
      }
    }

    return result;
  }

  forEachTile(fn) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        fn(this.grid[y][x], x, y);
      }
    }
  }

  facing({ x, y }) {
    if (x === -1) return DIRECTIONS.UP;
    if (x === 3) return DIRECTIONS.DOWN;
    if (y === -1) return DIRECTIONS.RIGHT;
    if (y === 3) return DIRECTIONS.LEFT;
  }

  lookingAt({ x, y }) {
    if (x === -1) return DIRECTIONS.RIGHT;
    if (x === 3) return DIRECTIONS.LEFT;
    if (y === -1) return DIRECTIONS.DOWN;
    if (y === 3) return DIRECTIONS.UP;
  }
}

module.exports = Game;
