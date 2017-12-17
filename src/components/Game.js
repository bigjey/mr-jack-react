import './Game.css';

import React from 'react';
import { observer, inject } from 'mobx-react';

// import Card from './Card';
import Tile from './Tile';
// import Action from './Action';
import Detective from './Detective';

@inject('game')
@observer
export default class Game extends React.Component {

  render() {
    const { game: { grid, detectives, newGame, inspect } } = this.props;

    return (
      <div className="Game">
        <button onClick={newGame}>New Game</button>
        <br/>
        <br/>
        <button onClick={inspect}>CHECK</button>
        <br/>
        <div className="Game--grid">
          {grid.map((row, y) => 
            row.map((tile, x) =>
              <Tile 
                key={tile.character}
                x={x}
                y={y}
                {...tile} />
            )
          )}
          {detectives.map((detective) => 
            <Detective key={detective.name} detective={detective} />
          )}
        </div>
      </div>
    );
  }
}