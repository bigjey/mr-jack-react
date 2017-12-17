import './Detective.css';

import React from 'react';
import { inject, observer } from 'mobx-react';
import classnames from 'classnames';

import Menu from './Menu';

@inject('game')
@observer
export default class Detective extends React.Component {
  overlap = () => {
    const { game: {overlaps}, detective: {name} } = this.props;
    let overlapIndex = overlaps.indexOf(name);
    
    if (overlapIndex !== -1) {
      return 50 * (overlapIndex - ((overlaps.length - 1)/2));
    }

    return 0;
  }

  zIndex = () => {
    const { game: {overlaps, hoverDetective}, detective: {name} } = this.props;

    if (name === hoverDetective) return 1000;

    let overlapIndex = overlaps.indexOf(name);

    if (overlapIndex !== -1) {
      return (3 - overlapIndex)
    }

    return 1;
  }

  render() {
    const {
      detective: {
        name,
        x,
        y,
        showMenu
      },
      game: {
        moveDetective,
        setHoverDetective,
        setDetectiveMenu
      }
    } = this.props;

    const classes = classnames('Detective', {
      active: showMenu
    })

    return (
      <div
        className={classes}
        style={{
          left: 5 + x * 170 + this.overlap(),
          top: 5 + y * 170,
          zIndex: this.zIndex()
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();

          setDetectiveMenu(name, !showMenu);
        }}
        onMouseEnter={() => setHoverDetective(name)}
      >
        <div className="Detective--image" style={{
          backgroundImage: `url(/assets/${name}.png)`,
        }}></div>
        {showMenu && <Menu>
          <button onClick={(e) => {
            e.preventDefault();

            moveDetective(name, 1);
            setDetectiveMenu(name, false);

            e.stopPropagation();
          }}>1 step</button>
          <button onClick={(e) => {
            e.preventDefault();

            moveDetective(name, 2);
            setDetectiveMenu(name, false);

            e.stopPropagation();
          }}>2 steps</button>
        </Menu>}
      </div>
    );
  }
}