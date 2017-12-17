import './Tile.css';

import React from 'react';
import classnames from 'classnames';
import { observer, inject } from 'mobx-react';

import Menu from './Menu';

@inject('game')
@observer
export default class Tile extends React.Component {
  render() {
    const {
      suspect,
      character,
      x,
      y,
      wall,
      showMenu,
      game: {
        rotateTile,
        setTileMenu
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            setTileMenu(x, y, !showMenu);
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