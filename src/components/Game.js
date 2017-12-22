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
        currentAction,
        turn,
        hint
      }
    } = this.props;

    const gameClasses = classnames("Game", currentAction || "", {
      actionSelection: !currentAction
    });

    return (
      <div className={gameClasses}>

        {turn === TURN.JACK ? (
          <div className="turn jack">Jack's turn</div>
        ) : (
          <div className="turn detective">Detectives' turn</div>
        )}

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
