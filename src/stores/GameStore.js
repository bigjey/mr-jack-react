import { observable, computed, action, toJS } from "mobx";
import { TweenLite, TweenMax } from "gsap";

export const PHASE = {
  PREPARING: "PREPARING"
};

export const CHARACTERS = {
  Brown: {
    color: "Brown",
    name: "Joseph Lane",
    time: 1
  },
  Purple: {
    color: "Purple",
    name: "William Gull",
    time: 1
  },
  Black: {
    color: "Black",
    name: "Sgt Goodley",
    time: 0
  },
  Green: {
    color: "Green",
    name: "Miss Stealthv",
    time: 1
  },
  Orange: {
    color: "Orange",
    name: "Jeremy Bert",
    time: 1
  },
  Pink: {
    color: "Pink",
    name: "Madame",
    time: 2
  },
  White: {
    color: "White",
    name: "John Pizer",
    time: 1
  },
  Yellow: {
    color: "Yellow",
    name: "John Smith",
    time: 1
  },
  Blue: {
    color: "Blue",
    name: "Insp. Lestrade",
    time: 0
  }
};

export const DIRECTIONS = {
  UP: 1,
  RIGHT: 2,
  DOWN: 3,
  LEFT: 4
};

export const ACTIONS = {
  Alibi: "Alibi",
  MoveHolmes: "MoveHolmes",
  MoveToby: "MoveToby",
  MoveWatson: "MoveWatson",
  Rotate: "Rotate",
  Swap: "Swap",
  MoveAny: "MoveAny"
};

export const ACTION_PAIRS = [
  `${ACTIONS.Alibi}|${ACTIONS.MoveHolmes}`,
  `${ACTIONS.MoveToby}|${ACTIONS.MoveWatson}`,
  `${ACTIONS.Rotate}|${ACTIONS.Swap}`,
  `${ACTIONS.Rotate}|${ACTIONS.MoveAny}`
];

export const randomDirection = () => {
  return DIRECTIONS[Object.keys(DIRECTIONS)[Math.floor(Math.random() * 4)]];
};

class GameStore {
  @observable grid = [];
  @observable detectives = [];
  @observable suspects = [];
  @observable actionTokens = [];

  @observable phase = PHASE.PREPARING;

  @observable animating = false;

  @observable hoverDetective = null;

  @observable jack = null;

  @observable round = 0;

  constructor() {
    this.newGame();
  }

  @action.bound
  newGame() {
    this.setJack();

    this.setupGrid();
    this.resetDetectives();
    this.resetSuspects();
    this.randomizeActions();

    this.round++;

    // console.log('new grid', toJS(grid));
    // console.log('detectives', toJS(this.detectives));
  }

  @action.bound
  setJack() {
    this.jack = Object.keys(CHARACTERS)[Math.floor(Math.random() * 9)];
    console.log("jack:", this.jack);
  }

  @action.bound
  setupGrid() {
    let grid = observable(Array(3));
    let suspectsLeft = Object.keys(CHARACTERS).sort(
      (a, b) => 0.5 - Math.random()
    );

    for (let y = 0; y < 3; y++) {
      let row = observable(Array(3));

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
          selected: false
        };

        row[x] = tile;
      }

      grid[y] = row;
    }

    this.grid.replace(grid);
  }

  @action.bound
  resetDetectives() {
    this.detectives.replace([
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
    ]);
  }

  @action.bound
  resetSuspects() {
    let suspectsLeft = Object.keys(CHARACTERS)
      .filter(s => s !== this.jack)
      .sort((a, b) => 0.5 - Math.random());
    this.suspects.replace(suspectsLeft);
  }

  @action.bound
  randomizeActions() {
    let pairs = ACTION_PAIRS.slice().sort(() => 0.5 - Math.random());

    this.actionTokens.replace(
      Array(4)
        .fill(null)
        .map(a => ({
          flipped: Math.random() > 0.5,
          actions: pairs.pop(),
          used: false,
          selected: false
        }))
    );
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
  rotateTile(x, y) {
    this.grid[y][x].wall++;
  }

  @action.bound
  swapTiles(ch1, ch2) {
    let t1, t2;
    this.forEachTile((...params) => {
      let t = params[0];
      if (t.character === ch1) t1 = params;
      if (t.character === ch2) t2 = params;
    })

    let [tile1, x1, y1] = t1;
    let [tile2, x2, y2] = t2;
    this.grid[y1][x1] = {...tile2}
    this.grid[y2][x2] = {...tile1}

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
    let dx = x,
      dy = y;

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

  @action.bound
  inspect() {
    let result = {
      inSight: [],
      notInSight: [],
      jackInSight: false
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
      this.highlightVisibleTiles(result.notInSight.map(t => t.character));
    }

    let visibleSuspects = result.inSight.filter(t => t.suspect);
    let notVisibleSuspects = result.notInSight.filter(t => t.suspect);

    if (result.jackInSight) {
      setTimeout(
        () =>
          notVisibleSuspects.forEach(t => {
            t.suspect = false;
          }),
        1000
      );

      if (visibleSuspects.length === 1) {
        setTimeout(
          () => alert(`GOTCHA! ${visibleSuspects[0].character} is Jack!`),
          2000
        );
      }
    } else {
      setTimeout(
        () =>
          visibleSuspects.forEach(t => {
            t.suspect = false;
          }),
        1000
      );

      if (notVisibleSuspects.length === 1) {
        setTimeout(
          () => alert(`GOTCHA! ${notVisibleSuspects[0].character} is Jack!`),
          2000
        );
      }
    }

    return result;
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

    TweenMax.fromTo(
      card,
      0.5,
      {
        rotation: 0
      },
      {
        bottom: "50%",
        right: "50%",
        rotation: 0,
        scale: 2,
        onComplete: () => {
          TweenMax.to(flipper, 0.15, {
            rotationY: "360deg",
            onComplete: () => {
              setTimeout(() => {
                TweenMax.to(card, 0.15, {
                  right: "120%",
                  onComplete: () => {
                    this.suspects = this.suspects.filter(s => s !== char);

                    const tile = this.tiles.find(t => t.character === char);
                    if (tile && tile.suspect) {
                      tile.suspect = false;
                    }

                    this.endAction();
                  }
                });
              }, 1000);
            }
          });
        }
      }
    );

  }

  @action.bound
  endAction() {
    this.actionTokens.forEach(a => {
      if (a.selected) {
        a.selected = false;
        a.used = true;
      }
    });
    this.tiles.forEach(t => (t.selected = false));
    this.detectives.forEach(d => (d.selected = false));

    if (this.actionTokens.every(t => t.used)) {
      this.round++;
      if (this.round % 2 === 1) {
        this.randomizeActions();
      } else {
        this.actionTokens.forEach(t => {
          t.flipped = !t.flipped;
          t.used = false;
        });
      }
    }
  }
}

export default GameStore;
