import './Tile.css';

import React from 'react';
import classnames from 'classnames';
import { observer, inject } from 'mobx-react';

import Menu from './Menu';
import { ACTIONS } from '../stores/GameStore';

@inject('game')
@observer
export default class Tile extends React.Component {
  render() {
    const {
      suspect,
      character,
      isJack,
      x,
      y,
      wall,
      showMenu,
      game: {
        rotateTile,
        flipTile,
        setTileMenu,
        currentAction,
        actionFlow
      }
    } = this.props;

    const flipperClasses = classnames('Tile--flipper', {
      flipped: !suspect
    })

    const backClasses = classnames('Tile--back', {
      crossroad: character === 'Brown'
    })

    return (
      <div
        id={`tile-${character}`}
        className="Tile"
        style={{
          left: 5 + (x * 175),
          top: 5 + (y * 175),
          zIndex: showMenu ? 1001 : 1000
        }}
      >
        <div
          className="Tile--container"
          style={{
            transform: `rotate(${(wall + 1) * 90}deg)`
          }}
          onClick={currentAction === null ? null : (e) => {
            e.preventDefault();
            e.stopPropagation();

            switch (currentAction) {
              case ACTIONS.Rotate:
                const flow = actionFlow[ACTIONS.Rotate];
                
                flow.tile = this;
                console.log(actionFlow);
                break;
              default:
                break;
            }
          }}
        >
          <div className={flipperClasses}>
            <div className="Tile--front" style={{
              backgroundImage: `url(/assets/Tile${character}.png)`
            }}></div>
            <div className={backClasses}></div>
          </div>
        </div>

        {showMenu && <Menu>
          <button onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            rotateTile(x, y);
          }}>Rotate</button>

          {suspect && !isJack && (
            <button onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              flipTile(x, y);
            }}>flip</button>
          )}

          <button onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            setTileMenu(x, y, false);
          }}>Close</button>
        </Menu>}
      </div>
    );
  }
}