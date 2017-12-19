import React, { Component } from "react";
import { inject, observer } from "mobx-react";

@inject('game')
@observer
class Games extends Component {
  render() {
    const { game: { games, createGame, joinGame, leaveGame, gameId, currentGame, playerId } } = this.props;

    return (
      <div>
        playerId: <code>{playerId}</code>
        {gameId ? (
          <div>
            in game: {gameId} <button onClick={leaveGame}>Leave</button>
            <br/>
            {currentGame && (
              <div>
                <small>{currentGame.players.length}/2</small>
                <br/>
                {currentGame.waiting.length > 0 && <div>
                  waiting 3 seconds for {currentGame.waiting} to reconnect...
                </div>}
              </div>
            )}

          </div>
        ) : (
          <div>
            <button onClick={createGame}>Create</button>
            {games.map(g => (
              <div>{g.id}
              {g.players.length < 2 && <button onClick={() => joinGame(g.id)}>Join</button>}
              </div>
            ))}
          </div>
        )}
        
      </div>
    );
  }
}

export default Games;