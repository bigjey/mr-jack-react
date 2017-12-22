import "./Tile.css";

import React from "react";
import classnames from "classnames";
import { observer, inject } from "mobx-react";

import Menu from "./Menu";
import { ACTIONS } from "../stores/GameStore";

@inject("game")
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
        endAction,
        rotateTile,
        swapTiles,
        flipTile,
        setTileMenu,
        currentAction,
        selectTile,
        selectedTile,
        rotatedTile,
        grid
      }
    } = this.props;

    const showRotateMenu =
      currentAction === ACTIONS.Rotate &&
      (selectedTile && selectedTile.character === character);

    const tileClasses = classnames("Tile", {
      active: selectedTile && selectedTile.character === character,
      rotated: rotatedTile && rotatedTile.character === character
    });

    const flipperClasses = classnames("Tile--flipper", {
      flipped: !suspect
    });

    const backClasses = classnames("Tile--back", {
      crossroad: character === "Brown"
    });

    return (
      <div
        id={`tile-${character}`}
        className={tileClasses}
        style={{
          left: 5 + x * 155,
          top: 5 + y * 155,
          zIndex: showRotateMenu ? 1003 : showMenu ? 1001 : 1000
        }}
        onClick={
          currentAction === null
            ? null
            : e => {
                e.preventDefault();
                e.stopPropagation();

                switch (currentAction) {
                  case ACTIONS.Rotate:
                    if (!selectedTile) selectTile(character);
                    break;
                  case ACTIONS.Swap:
                    if (selectedTile) {
                      if (selectedTile.character === character) {
                        selectTile(null);
                      } else {
                        swapTiles(selectedTile.character, character);
                      }
                    } else {
                      selectTile(character);
                    }
                    break;
                  default:
                    break;
                }
              }
        }
      >
        <div
          className="Tile--container"
          style={{
            transform: `rotate(${(wall + 1) * 90}deg)`
          }}
        >
          <div className={flipperClasses}>
            <div
              className="Tile--front"
              style={{
                backgroundImage: `url(/assets/Tile${character}.png)`
              }}
            />
            <div className={backClasses} />
          </div>
        </div>

        {showMenu && (
          <Menu>
            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();

                rotateTile(x, y);
              }}
            >
              Rotate
            </button>

            {suspect &&
              !isJack && (
                <button
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();

                    flipTile(x, y);
                  }}
                >
                  flip
                </button>
              )}

            <button
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();

                setTileMenu(x, y, false);
              }}
            >
              Close
            </button>
          </Menu>
        )}

        {showRotateMenu && (
          <Menu>
            <button
              onClick={e => {
                e.stopPropagation();
                rotateTile(x, y);
              }}
            >
              Rotate
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                grid[y][x].rotated = true;
                endAction();
              }}
            >
              OK
            </button>
          </Menu>
        )}
      </div>
    );
  }
}
