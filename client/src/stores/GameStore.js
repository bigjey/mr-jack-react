import { observable, computed, action } from "mobx";
import { TweenLite, TweenMax } from "gsap";
import io from "socket.io-client";

import { PHASE, CHARACTERS, DIRECTIONS, ACTIONS, TURN } from "../constants";

class GameStore {
  @observable grid = [];
  @observable detectives = [];
  @observable suspects = [];
  @observable actionTokens = [];
  @observable ready = [];
  @observable players = [];
  @observable waiting = [];
  @observable selection = {};

  @observable phase = PHASE.LOBBY;

  @observable turn = TURN.DETECTIVE;

  @observable animating = false;
  @observable readyCountdown = false;

  @observable hoverDetective = null;

  @observable jack = null;

  @observable round = 0;

  @observable games = [];

  @observable gameId = null;

  @observable playerId = null;

  @observable jackTime = 0;

  @observable jackCards = [];

  constructor() {
    this.ensurePlayerId();
    this.createSocket();
  }

  ensurePlayerId() {
    let playerId = localStorage.getItem("playerId");
    if (!playerId) {
      playerId = Math.floor(Math.random() * 1000000);
      localStorage.setItem("playerId", playerId);
    }
    this.playerId = playerId;
  }

  createSocket() {
    this.socket = io.connect("http://localhost:1234");

    this.socket.emit("playerId", this.playerId);

    this.socket.on("gameList", games => {
      this.games.replace(games);
    });

    this.socket.on("joinedGame", gameId => {
      this.gameId = gameId;
    });

    this.socket.on("startReadyCountdown", () => {
      this.readyCountdown = true;
    });

    this.socket.on("cancelReadyCountdown", () => {
      this.readyCountdown = false;
    });

    this.socket.on("123", () => {
      console.log("123");
    });

    this.socket.on(
      "gameData",
      ({
        phase,
        grid,
        suspects,
        detectives,
        actionTokens,
        selection,
        ready,
        waiting,
        players
      }) => {
        console.log(grid);

        this.phase = phase;
        this.grid.replace(grid);
        this.suspects.replace(suspects);
        this.detectives.replace(detectives);
        this.actionTokens.replace(actionTokens);
        this.selection = { ...selection };
        this.ready.replace(ready);
        this.waiting.replace(waiting);
        this.players.replace(players);
      }
    );
  }

  @action.bound
  createGame() {
    this.socket.emit("createGame");
  }

  @action.bound
  joinGame(gameId) {
    this.socket.emit("joinGame", gameId);
  }

  @action.bound
  leaveGame() {
    this.socket.emit("leaveGame", this.gameId);
    this.gameId = null;
  }

  @action.bound
  selectCharacter(character) {
    this.socket.emit("selectCharacter", { character, gameId: this.gameId });
  }

  @action.bound
  toggleReady() {
    this.socket.emit("toggleReady", this.gameId);
  }

  @computed
  get currentGame() {
    return this.games.find(g => g.id === this.gameId);
  }

  @computed
  get isJackTurn() {
    return this.turn === TURN.JACK;
  }

  @computed
  get isDetectiveTurn() {
    return this.turn === TURN.DETECTIVE;
  }

  @computed
  get jackTotalTime() {
    return this.jackTime + this.jackCardsTime;
  }

  @computed
  get jackCardsTime() {
    return this.jackCards.reduce((total, char) => {
      return total + CHARACTERS[char].time;
    }, 0);
  }

  @action.bound
  setHoverDetective(newDetective) {
    this.hoverDetective = newDetective;
  }

  @action.bound
  selectTile(character) {
    this.forEachTile(tile => {
      tile.selected = tile.character === character;
    });
  }

  @action.bound
  selectDetective(detective) {
    this.detectives.forEach(d => (d.selected = d.name === detective));
  }

  @computed
  get selectedDetective() {
    return this.detectives.find(d => d.selected);
  }

  @computed
  get selectedTile() {
    return this.tiles.find(t => t.selected);
  }

  @computed
  get rotatedTile() {
    return this.tiles.find(t => t.rotated);
  }

  @computed
  get tiles() {
    let tiles = [];
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        tiles.push(this.grid[y][x]);
      }
    }
    return tiles;
  }

  @action.bound
  selectAction(newActions = null) {
    this.actionTokens.forEach(a => {
      a.selected = a.actions === newActions;
      if (a.selected) {
        switch (this.currentAction) {
          case ACTIONS.Alibi:
            this.showAlibi();
            break;
          case ACTIONS.MoveToby:
            this.selectDetective("Toby");
            break;
          case ACTIONS.MoveWatson:
            this.selectDetective("Watson");
            break;
          case ACTIONS.MoveHolmes:
            this.selectDetective("Holmes");
            break;
          default:
            break;
        }
      }
    });
  }

  @computed
  get currentAction() {
    const token = this.actionTokens.find(a => a.selected);
    if (token) {
      return token.actions.split("|")[token.flipped ? 1 : 0];
    }
    return null;
  }

  @computed
  get hint() {
    switch (this.currentAction) {
      case "MoveAny":
        return "Select detective";

      case "Rotate":
        return "Select tile to rotate";

      case "Swap":
        if (this.selectedTile) {
          return "Click on selected tile to deselect. <br/>Click on another tile to swap them";
        } else {
          return "Select tile";
        }

      default:
        return "";
    }
  }

  @computed
  get overlaps() {
    let checked = 0;
    let overlaps = [];

    while (checked < this.detectives.length) {
      let d = this.detectives[checked];

      for (var i = checked + 1; i < this.detectives.length; i++) {
        let dd = this.detectives[i];

        if (d.x === dd.x && d.y === dd.y) {
          if (overlaps.indexOf(d.name) === -1) overlaps.push(d.name);
          if (overlaps.indexOf(dd.name) === -1) overlaps.push(dd.name);
        }
      }

      checked++;
    }

    return overlaps;
  }

  @action.bound
  setTileMenu(x, y, show) {
    this.grid[y][x].showMenu = show;

    this.forEachTile((tile, xx, yy) => {
      if (xx === x && yy === y) return;

      tile.showMenu = false;
    });
  }

  @action.bound
  forEachTile(fn) {
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        fn(this.grid[y][x], x, y);
      }
    }
  }

  @action.bound
  rotateTile(x, y, rotations) {
    this.emit(ACTIONS.Rotate, { x, y, rotations }, true);

    // this.grid[y][x].wall++;
  }

  @action.bound
  swapTiles(ch1, ch2) {
    let t1, t2;
    this.forEachTile((...params) => {
      let t = params[0];
      if (t.character === ch1) t1 = params;
      if (t.character === ch2) t2 = params;
    });

    let [tile1, x1, y1] = t1;
    let [tile2, x2, y2] = t2;
    this.grid[y1][x1] = { ...tile2 };
    this.grid[y2][x2] = { ...tile1 };

    this.endAction();
  }

  @action.bound
  flipTile(x, y) {
    this.grid[y][x].suspect = false;
  }

  @action.bound
  moveDetective(name, steps = 1) {
    let detective = this.detectives.find(d => d.name === name);

    let { x, y } = this.move(detective, steps);

    detective.x = x;
    detective.y = y;

    this.endAction();
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

  highlightVisibleTiles(characters) {
    this.animating = true;

    characters.forEach(character => {
      TweenLite.to(`#tile-${character}`, 0.2, {
        opacity: 0.6
      });
    });

    setTimeout(() => {
      characters.forEach(character => {
        TweenLite.to(`#tile-${character}`, 0.1, {
          opacity: 1
        });
      });
      this.animating = false;
    }, 1900);
  }

  @action.bound
  showAlibi() {
    let char = this.suspects[this.suspects.length - 1];

    const card = `#card-${char}`;
    const flipper = `${card} .Card--flipper`;

    const onComplete = () => {
      this.suspects = this.suspects.filter(s => s !== char);

      const tile = this.tiles.find(t => t.character === char);
      if (tile && tile.suspect) {
        tile.suspect = false;
      }

      if (this.isJackTurn) {
        this.jackCards.push(char);
      }

      this.endAction();
    };

    TweenMax.to(card, 0.5, {
      bottom: "50%",
      right: "50%",
      x: "50%",
      y: "50%",
      rotation: 0,
      scale: 2,
      onComplete: () => {
        TweenMax.to(flipper, 0.15, {
          rotationY: "360deg",
          onComplete: () => {
            setTimeout(() => {
              TweenMax.to(card, 0.15, {
                right: "120%",
                onComplete
              });
            }, 1000);
          }
        });
      }
    });
  }

  @action.bound
  endAction() {
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
      alert("JACK WON, he was", this.jack);
    }
  }

  emit(type, params, log = false) {
    const payload = {
      gameId: this.gameId,
      ...params
    };

    this.socket.emit(type, payload);

    log && console.log(type, payload);
  }
}

export default GameStore;
