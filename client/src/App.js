import React, { Component } from "react";
import { inject, observer } from "mobx-react";

import Game from "./components/Game";
import Games from "./components/Games";
import CharacterSelection from "./components/CharacterSelection";

import { PHASE } from './constants';

@inject('game')
@observer
class App extends Component {
  render() {
    const {game: {phase, gameId}} = this.props;
    console.log(gameId);
    return (
      <div className="App">
        <Games/>
        {gameId && (
          <React.Fragment>
            {phase === PHASE.CHARACTER_SELECTION && (
              <CharacterSelection />
            )}
            {phase === PHASE.PLAY && (
              <Game />
            )}
          </React.Fragment>
        )}
      </div>
    );
  }
}

export default App;
