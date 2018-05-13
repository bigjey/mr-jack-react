import "./Game.css";

import React from "react";
import { observer, inject } from "mobx-react";
import classnames from "classnames";

import Card from "./Card";
import Tile from "./Tile";
import Action from "./Action";
import Detective from "./Detective";
import { TURN } from '../constants';

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
        currentAction,
        turn,
        hint,
        isMyTurn
      }
    } = this.props;

    const gameClasses = classnames("Game", currentAction || "", {
      actionSelection: !currentAction
    });

    console.log(turn, turn === TURN.JACK)

    return (
      <div className={gameClasses}>

        {isMyTurn ? (
          <div className="turn detective">Your turn</div>
        ) : (
          <div className="turn jack">
            {turn === TURN.JACK ? "Jack's" : "Detective's"} turn
          </div>
        )}

        <div className="Game--role">
          {(turn === TURN.JACK && isMyTurn) || (turn === TURN.DETECTIVE && !isMyTurn) ? 
            (
            `You're playing Jack ${123}`
            ) : (
            `You're playing Detetive`
            )
          }
        </div>

        {hint && (
          <div className="hint" dangerouslySetInnerHTML={{__html: hint}} />
        )}

        <div className="Game--grid">
          {grid.map((row, y) =>
            row.map((tile, x) => (
              <Tile key={tile.character} x={x} y={y} {...tile} />
            ))
          )}

          {detectives.map(detective => (
            <Detective key={detective.name} detective={detective} />
          ))}
        </div>

        <div className="Game--Actions">
          {actionTokens.map((action, index) => (
            <Action {...action} key={action.actions} index={index} />
          ))}
        </div>

        <div>
          {suspects.map(s => (
            <Card key={s} character={s} />
          ))}
        </div>

      </div>
    );
  }
}
