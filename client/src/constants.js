export const PHASE = {
  LOBBY: 1,
  CHARACTER_SELECTION: 2,
  PLAY: 3
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

export const TURN = {
  DETECTIVE: 1,
  JACK: 2
}