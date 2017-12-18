import { observable, computed, action, toJS } from 'mobx';
import { TweenLite } from 'gsap';

export const PHASE = {
  PREPARING: 1
}

export const CHARACTERS = {
  Brown: {
    color: 'Brown',
    name: 'Joseph Lane',
    time: 1
  },
  Purple: {
    color: 'Purple',
    name: 'William Gull',
    time: 1
  },
  Black: {
    color: 'Black',
    name: 'Sgt Goodley',
    time: 0
  },
  Green: {
    color: 'Green',
    name: 'Miss Stealthv',
    time: 1
  },
  Orange: {
    color: 'Orange',
    name: 'Jeremy Bert',
    time: 1
  },
  Pink: {
    color: 'Pink',
    name: 'Madame',
    time: 2
  },
  White: {
    color: 'White',
    name: 'John Pizer',
    time: 1
  },
  Yellow: {
    color: 'Yellow',
    name: 'John Smith',
    time: 1
  },
  Blue: {
    color: 'Blue',
    name: 'Insp. Lestrade',
    time: 0
  },
}

export const DIRECTIONS = {
  UP: 1,
  RIGHT: 2,
  DOWN: 3,
  LEFT: 4
}

export const ACTIONS = {
  Alibi: 'Alibi',
  MoveHolmes: 'MoveHolmes',
  MoveToby: 'MoveToby',
  MoveWatson: 'MoveWatson',
  Rotate: 'Rotate',
  Swap: 'Swap',
  MoveAny: 'MoveAny'
}

export const ACTION_PAIRS = [
  [ACTIONS.Alibi, ACTIONS.MoveHolmes],
  [ACTIONS.MoveToby, ACTIONS.MoveWatson],
  [ACTIONS.Rotate, ACTIONS.Swap],
  [ACTIONS.Rotate, ACTIONS.MoveAny],
]

export const randomDirection = () => {
  return DIRECTIONS[Object.keys(DIRECTIONS)[Math.floor(Math.random()*4)]];
}

class GameStore {
  @observable grid = [];
  @observable detectives = [];

  @observable phase = PHASE.PREPARING;

  @observable currentAction = null;

  @observable animating = false;

  @observable hoverDetective = null;

  @observable actions = [];

  @observable actionFlow = {
    [ACTIONS.Rotate]: {
      tile: null,
      originalValue: null
    },
    [ACTIONS.Swap]: {
      tile: null,
      target: null
    }
  }

  constructor() {
    this.newGame();
  }

  @action.bound
  setHoverDetective(newDetective) {
    this.hoverDetective = newDetective;
  }

  @action.bound
  newGame() {
    let grid = observable(Array(3));
    let jackNumber = Math.floor(Math.random() * 9);
    let suspectsLeft = Object.keys(CHARACTERS).sort((a,b) => 0.5 - Math.random());

    for (let y = 0; y < 3; y++){
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

        (y * 3 + x) === jackNumber && console.log('jack is', suspectsLeft[suspectsLeft.length - 1])

        let cell = {
          character: suspectsLeft.pop(),
          wall,
          showMenu: false,
          suspect: true,
          isJack: (y * 3 + x) === jackNumber,
        }

        row[x] = cell;
      }

      grid[y] = row;
    }

    this.grid.replace(grid);

    this.resetDetectives();
    this.randomizeActions();

    // console.log('new grid', toJS(grid));
    // console.log('detectives', toJS(this.detectives));
  }

  @action.bound
  resetDetectives() {
    this.detectives.replace([{
      name: 'Holmes',
      x: -1,
      y: 0,
      showMenu: false
    }, {
      name: 'Watson',
      x: 3,
      y: 0,
      showMenu: false
    }, {
      name: 'Toby',
      x: 1,
      y: 3,
      showMenu: false
    }])
  }

  @action.bound
  randomizeActions() {
    let pairs = ACTION_PAIRS.slice().sort(() => 0.5 - Math.random());

    this.actions.replace(Array(4).fill(null).map(a => ({
      flipped: false,
      actions: pairs.pop(),
      used: false
    })));
  }

  @action.bound
  selectAction(action = null) {
    this.currentAction = action;
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
  setDetectiveMenu(name, show) {
    let d = this.detectives.find(d => d.name === name)
    d.showMenu = show;

    this.detectives.forEach(d => {
      if (d.name === name) return;

      d.showMenu = false;
    })
  }

  @action.bound
  setTileMenu(x, y, show) {
    this.grid[y][x].showMenu = show;

    this.forEachTile((tile, xx, yy) => {
      if (xx === x && yy === y) return;

      tile.showMenu = false;
    })
  }

  @action.bound
  forEachTile(fn) {
    for (let y = 0; y < 3; y++){
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
  flipTile(x, y) {
    this.grid[y][x].suspect = false;
  }

  @action.bound
  moveDetective(name, steps = 1) {
    let detective = this.detectives.find(d => d.name === name);

    let {x, y} = this.move(detective, steps);

    detective.x = x;
    detective.y = y;
  }

  facing({x, y}) {
    if (x === -1) return DIRECTIONS.UP;
    if (x === 3) return DIRECTIONS.DOWN;
    if (y === -1) return DIRECTIONS.RIGHT;
    if (y === 3) return DIRECTIONS.LEFT;
  }

  lookingAt({x, y}) {
    if (x === -1) return DIRECTIONS.RIGHT;
    if (x === 3) return DIRECTIONS.LEFT;
    if (y === -1) return DIRECTIONS.DOWN;
    if (y === 3) return DIRECTIONS.UP;
  }

  move({x, y}, steps = 1) {
    let dx = x, dy = y;

    switch(this.facing({x, y})) {
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
      return this.move({x: dx, y: dy}, steps - 1);
    } else {
      return {x: dx, y: dy};
    }
  }

  @action.bound
  inspect() {
    let result = {
      inSight: [],
      notInSight: [],
      jackInSight: false
    }

    this.detectives.forEach(detective => {
      switch(this.lookingAt(detective)){
        case DIRECTIONS.UP:
          for (let y = 2; y >= 0; y--) {
            const tile = this.grid[y][detective.x];
            const wall = (tile.wall - 1) % 4 + 1;

            if (wall === DIRECTIONS.DOWN) break;

            result.inSight.push(tile);
            if (tile.isJack) result.jackInSight = true;

            if (wall === DIRECTIONS.UP) break;
          }
          break;

        case DIRECTIONS.RIGHT:
          for (let x = 0; x < 3; x++) {
            const tile = this.grid[detective.y][x];
            const wall = (tile.wall - 1) % 4 + 1;

            if (wall === DIRECTIONS.LEFT) break;

            result.inSight.push(tile);
            if (tile.isJack) result.jackInSight = true;

            if (wall === DIRECTIONS.RIGHT) break;
          }
          break;

        case DIRECTIONS.DOWN:
          for (let y = 0; y < 3; y++) {
            const tile = this.grid[y][detective.x];
            const wall = (tile.wall - 1) % 4 + 1;

            if (wall === DIRECTIONS.UP) break;

            result.inSight.push(tile);
            if (tile.isJack) result.jackInSight = true;

            if (wall === DIRECTIONS.DOWN) break;
          }
          break;

        case DIRECTIONS.LEFT:
          for (let x = 2; x >= 0; x--) {
            const tile = this.grid[detective.y][x];
            const wall = (tile.wall - 1) % 4 + 1;

            if (wall === DIRECTIONS.RIGHT) break;

            result.inSight.push(tile);
            if (tile.isJack) result.jackInSight = true;

            if (wall === DIRECTIONS.LEFT) break;
          }
          break;
        default:
          break;
      }
    })

    this.forEachTile((tile, x, y) => {
      if (result.inSight.indexOf(tile) === -1) {
        result.notInSight.push(tile);
      }
    })

    if (result.notInSight.length) {
      this.highlightVisibleTiles(result.notInSight.map(t => t.character));
    }

    let visibleSuspects = result.inSight.filter(t => t.suspect);
    let notVisibleSuspects = result.notInSight.filter(t => t.suspect);

    // console.log(result, result.jackInSight);
    // console.log('visibleSuspects', visibleSuspects);
    // console.log('notVisibleSuspects', notVisibleSuspects);

    if (result.jackInSight) {
      setTimeout(() => notVisibleSuspects.forEach(t => {
        t.suspect = false;
      }), 1000);

      if (visibleSuspects.length === 1) {
        setTimeout(() => alert(`GOTCHA! ${visibleSuspects[0].character} is Jack!`), 1000);
        
      }
    } else {
      setTimeout(() => visibleSuspects.forEach(t => {
        t.suspect = false;
      }), 1000);

      if (notVisibleSuspects.length === 1) {
        setTimeout(() => alert(`GOTCHA! ${notVisibleSuspects[0].character} is Jack!`), 1000);
      }
    }

    return result;
  }

  // @computed
  // get visibleCharacters() {

  // }

  // @computed
  // get invisibleCharacters() {
  //   let invisible = Object.keys(CHARACTERS).filter(ch => visible.indexOf(ch) === -1);
  // }

  highlightVisibleTiles(characters) {
    this.animating = true;

    characters.forEach(character => {
      TweenLite.to(`#tile-${character}`, .2, {
        opacity: .6
      })
    })

    setTimeout(() => {
      characters.forEach(character => {
        TweenLite.to(`#tile-${character}`, .1, {
          opacity: 1
        })
      })
      this.animating = false;
    }, 1900)
  }
}

export default GameStore;