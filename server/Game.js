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
    this.io = socket.server;
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

    this.jackPlayer = null;
    this.detectivePlayer = null;

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
    this.assignPlayerRoles();

    this.round = 1;

    this.updateGameInfo();
  }

  updateGameInfo() {
    const data = this.normalize();

    // console.log('updating', data);

    this.io.in(this.id).emit("gameData", data);
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
      // suspects: this.suspects,
      actionTokens: this.actionTokens,
      activePlayer: this.activePlayer,
      turn: this.turn
    };
  }

  setJack() {
    this.jack = Object.keys(CHARACTERS)[Math.floor(Math.random() * 9)];
    console.log(this.jack);
  }

  assignPlayerRoles() {
    let players = Object.keys(this.characterSelection);
    let jack = [];
    let detective = [];
    let random = [];

    for (let pId in this.characterSelection) {
      let role = this.characterSelection[pId];

      if (role === TURN.JACK) {
        jack.push(pId);
      } else if (role === TURN.DETECTIVE) {
        detective.push(pId);
      } else {
        random.push(pId);
      }
    }

    if (jack.length === 2 || detective.length === 2 || random.length === 2) {
      players.sort(_ => Math.random() - 0.5);

      this.jackPlayer = players.pop();
      this.detectivePlayer = players.pop()
    } else if (random.length) {
      if (jack.length) {
        this.jackPlayer = jack.pop();
        this.detectivePlayer = random.pop()
      } else {
        this.jackPlayer = random.pop();
        this.detectivePlayer = detective.pop()
      }
    } else {
      this.jackPlayer = jack.pop();
      this.detectivePlayer = detective.pop()
    }
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

  get activePlayer() {
    return this.turn === TURN.JACK ? this.jackPlayer : this.detectivePlayer;
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
  }

  showAlibi() {
    const char = this.suspects.pop();

    this.io.in(this.id).emit("showAlibi", char);

    setTimeout(function(){
      const tile = this.tiles.find(t => t.character === char);
      if (tile && tile.suspect) {
        tile.suspect = false;
      }

      if (this.isJackTurn) {
        this.jackCards.push(char);
      }

      this.endAction();
    }.bind(this), 3000);
  }

  moveDetective(action, name, steps){
    console.log(action, name, steps);
    const detective = this.detectives.find(d => d.name === name);

    if (detective) {
      let { x, y } = this.move(detective, steps);

      detective.x = x;
      detective.y = y;

      this.endAction();
    }
  }

  swapTiles(ch1, ch2) {
    let t1, t2;

    this.forEachTile((...params) => {
      let t = params[0];
      if (t.character === ch1) t1 = params;
      if (t.character === ch2) t2 = params;
    });

    let [tile1, x1, y1] = t1;
    let [tile2, x2, y2] = t2;
    this.grid[y1][x1] = Object.assign({}, tile2);
    this.grid[y2][x2] = Object.assign({}, tile1);

    this.endAction();
  }

  move({ x, y }, steps = 1) {
    let dx = x;
    let dy = y;

    switch (this.facing({ x, y })) {
      case DIRECTIONS.UP:
        dy--;
        if (dy === -1) dx++;
        break;
      case DIRECTIONS.DOWN:
        dy++;
        if (dy === 3) dx--;
        break;
      case DIRECTIONS.LEFT:
        dx--;
        if (dx === -1) dy--;
        break;
      case DIRECTIONS.RIGHT:
        dx++;
        if (dx === 3) dy++;
        break;
      default:
        break;
    }

    if (steps - 1 > 0) {
      return this.move({ x: dx, y: dy }, steps - 1);
    } else {
      return { x: dx, y: dy };
    }
  }


  endAction() {
    console.log('end action', this.round);
    let results = null;

    if ([4, 0].indexOf(this.round % 8) !== -1) {
      results = this.inspect();

      this.tiles.forEach(t => (t.rotated = false));
    }

    this.tiles.forEach(t => (t.selected = false));

    this.detectives.forEach(d => (d.selected = false));

    console.log(results);

    if (results && results.gameover && results.jack) {
      this.io.in(this.id).emit('gameover', results.jack)
      console.log('gameover', results.jack)
      return;
    };

    this.round++;
    console.log('round', this.round);

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

    this.updateGameInfo();
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
      this.io.in(this.id).emit('highlight', result.notInSight.map(t => t.character));
    }

    let visibleSuspects = result.inSight.filter(t => t.suspect);
    let notVisibleSuspects = result.notInSight.filter(t => t.suspect);

    if (result.jackInSight) {
      setTimeout(() => {
        notVisibleSuspects.forEach(t => {
          t.suspect = false;
        });
        this.updateGameInfo();
      }, 1000);

      if (visibleSuspects.length === 1 && this.jackTotalTime < 6) {
        result.gameover = true;
        let jack = visibleSuspects[0].character;
        result.jack = jack;

        setTimeout(() => {
          console.log(`GOTCHA! ${jack} is Jack!`);
          
        }, 2000);
      }
    } else {
      setTimeout(() => {
        visibleSuspects.forEach(t => {
          t.suspect = false;
        });

        this.jackTime += 1;

        if (this.jackTotalTime >= 6) {
          console.log("JACK WON, he was", this.jack);
          result.gameover = true;
        }

        this.updateGameInfo();
      }, 1000);

      if (notVisibleSuspects.length === 1 && this.jackTotalTime < 6) {
        result.gameover = true;
        let jack = notVisibleSuspects[0].character;
        result.jack = jack;

        setTimeout(() => {
          console.log(`GOTCHA! ${jack} is Jack!`);
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
