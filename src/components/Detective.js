import "./Detective.css";

import React from "react";
import { inject, observer } from "mobx-react";
import classnames from "classnames";

import Menu from "./Menu";
import { ACTIONS } from "../stores/GameStore";

@inject("game")
@observer
export default class Detective extends React.Component {
  offset = () => {
    const { game: { overlaps }, detective: { name, x, y } } = this.props;
    let overlapIndex = overlaps.indexOf(name);

    let offset = 0;
    let xx = 0;
    let yy = 0;

    if (overlapIndex !== -1) {
      offset = 40 * (overlapIndex - (overlaps.length - 1) / 2);

      if (x === -1 || x === 3) {
        yy = offset;

      } else if (y === -1 || y === 3) {
        xx = offset;
      }
    }

    if (x === -1) {
      xx = 20
    } else if (x === 3) {
      xx = -20
    } else if (y === -1) {
      yy = 20
    } else if (y === 3) {
      yy = -20
    }

    return {x: xx, y: yy};
  };

  zIndex = () => {
    const {
      game: { overlaps, hoverDetective },
      detective: { name, selected }
    } = this.props;

    if (selected) return 1020;

    if (name === hoverDetective) return 1010;

    let overlapIndex = overlaps.indexOf(name);

    if (overlapIndex !== -1) {
      return 1003 - overlapIndex;
    }

    return 1001;
  };

  render() {
    const {
      detective: { name, x, y, showMenu, selected },
      game: {
        moveDetective,
        setHoverDetective,
        currentAction,
        selectedDetective,
        selectDetective
      }
    } = this.props;

    const classes = classnames("Detective", {
      selected
    });

    const offset = this.offset();

    return (
      <div
        className={classes}
        style={{
          left: 5 + x * 150 + offset.x,
          top: 5 + y * 150 + offset.y,
          zIndex: this.zIndex()
        }}
        onClick={
          currentAction === ACTIONS.MoveAny && !selectedDetective
            ? e => {
                e.stopPropagation();

                selectDetective(name);
              }
            : null
        }
        onMouseEnter={() => setHoverDetective(name)}
      >
        <div
          className="Detective--image"
          style={{
            backgroundImage: `url(/assets/${name}.png)`
          }}
        />
        {selectedDetective &&
          selectedDetective.name === name && (
            <Menu>
              <button
                onClick={e => {
                  e.stopPropagation();
                  moveDetective(name, 1);
                }}
              >
                Move 1
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  moveDetective(name, 2);
                }}
              >
                Move 2
              </button>
            </Menu>
          )}
      </div>
    );
  }
}
