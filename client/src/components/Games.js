import React, { Component } from "react";
import { inject, observer } from "mobx-react";

@inject("game")
@observer
class Games extends Component {
  render() {
    const {
      game: {
        games,
        createGame,
        joinGame,
        leaveGame,
        gameId,
        waiting,
        players,
        playerId
      }
    } = this.props;

    return (
      <div>
        playerId: <code>{playerId}</code>
        {gameId ? (
          <div>
            in game: {gameId} <button onClick={leaveGame}>Leave</button>
            <br />
            <div>
              <small>{players.length}/2</small>
              <br />
              {waiting.length > 0 && (
                <div>waiting 3 seconds for {waiting} to reconnect...</div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <button onClick={createGame}>Create</button>
            {games.map(g => (
              <div key={g.id}>
                {g.id}
                {g.players.length < 2 && (
                  <button onClick={() => joinGame(g.id)}>Join</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default Games;
