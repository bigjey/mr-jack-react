import "./Game.css";

import React from "react";
import { observer, inject } from "mobx-react";
import classnames from "classnames";

import Card from "./Card";
import Tile from "./Tile";
import Action from "./Action";
import Detective from "./Detective";
import { CHARACTERS, TURN } from '../stores/GameStore';

@inject("game")
@observer
export default class Game extends React.Component {
  render() {
    const {
      game: {
        grid,
        detectives,
        suspects,
        actionTokens,
        newGame,
        inspect,
        currentAction,
        phase,
        turn,
        jackTotalTime
      }
    } = this.props;

    const gameClasses = classnames("Game", currentAction || "");

    return (
      <div className={gameClasses}>
        <button onClick={newGame}>New Game</button>
        <button onClick={inspect}>CHECK</button>

        <br />
        <br />

        <div className="debug">
          {phase && (
            <div className="debug-line">
              phase
              <code>{phase.toUpperCase()}</code>
            </div>
          )}

          {currentAction && (
            <div className="debug-line">
              action
              <code>{currentAction.toUpperCase()}</code>
            </div>
          )}

          <div className="debug-line">
            turn
            <code>{turn === TURN.DETECTIVE ? 'DETECTIVE' : 'JACK'}</code>
          </div>

          <div className="debug-line">
            jack total time:
            <code>{jackTotalTime}</code>
          </div>
        </div>

        <div className="Game--grid">
          {grid.map((row, y) =>
            row.map((tile, x) => (
              <Tile key={tile.character} x={x} y={y} {...tile} />
            ))
          )}

          {detectives.map(detective => (
            <Detective key={detective.name} detective={detective} />
          ))}

          <div className="Game--Actions">
            {actionTokens.map((action, index) => (
              <Action {...action} key={action.actions} index={index} />
            ))}
          </div>
        </div>

        <div>
          {suspects.map(s => (
            <Card key={s} character={s} />
          ))}
        </div>

        <div className="Game--overlay">
        </div>
      </div>
    );
  }
}
