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
  @observable activePlayer = null;

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

    this.socket.on("showAlibi", this.animateAlibi);

    this.socket.on("highlight", this.highlightVisibleTiles);

    this.socket.on("gameover", this.gameover);

    this.socket.on(
      "gameData",
      ({
        phase,
        grid,
        // suspects,
        detectives,
        actionTokens,
        selection,
        ready,
        waiting,
        players,
        activePlayer,
        turn
      }) => {
        console.log(grid);

        this.phase = phase;
        this.grid.replace(grid);
        // this.suspects.replace(suspects);
        this.detectives.replace(detectives);
        this.actionTokens.replace(actionTokens);
        this.selection = { ...selection };
        this.ready.replace(ready);
        this.waiting.replace(waiting);
        this.players.replace(players);
        this.activePlayer = activePlayer;
        this.turn = turn;
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
  get isMyTurn() {
    console.log(this.playerId, this.activePlayer);
    return this.playerId === this.activePlayer;
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
      console.log(a.actions, newActions);

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
    this.grid[y][x].wall += rotations;
    this.emit(ACTIONS.Rotate, { x, y, rotations }, true);
  }

  @action.bound
  swapTiles(ch1, ch2) {
    this.emit(ACTIONS.Swap, {ch1, ch2}, true);
  }

  @action.bound
  flipTile(x, y) {
    this.grid[y][x].suspect = false;
  }

  @action.bound
  moveDetective(name, steps = 1) {
    this.emit('move', {action: ACTIONS[this.currentAction], name, steps}, true);
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

  showAlibi() {
    this.emit(ACTIONS.Alibi);
  }

  @action.bound
  animateAlibi(char) {
    console.log('animate alibi', char);
    const card = `#card-${char}`;
    const flipper = `${card} .Card--flipper`;

    const onComplete = () => {
      console.log('complete');
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
  gameover(jack) {
    alert(jack)
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
