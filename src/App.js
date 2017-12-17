import React, { Component } from 'react';
import { Provider } from 'mobx-react';

import GameStore from './stores/GameStore';
import Game from './components/Game';

const gameStore = new GameStore();

window.game = gameStore;

class App extends Component {
  render() {
    return (
      <Provider game={gameStore}>
        <div className="App">
          <Game />
        </div>
      </Provider>
    );
  }
}

export default App;
