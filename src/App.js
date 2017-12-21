import React, { Component } from "react";
import { Provider } from "mobx-react";

import GameStore from "./stores/GameStore";
import Game from "./components/Game";
import Games from "./components/Games";

const gameStore = new GameStore();

window.game = gameStore;

class App extends Component {
  render() {
    return (
      <Provider game={gameStore}>
        <div className="App">
          <Game />
          {/*<Games/>*/}
        </div>
      </Provider>
    );
  }
}

export default App;
