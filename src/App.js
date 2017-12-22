import React, { Component } from "react";
import { Provider } from "mobx-react";

import Game from "./components/Game";
import Games from "./components/Games";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Game />
        {/*<Games/>*/}
      </div>
    );
  }
}

export default App;
