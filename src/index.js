import "./index.css";

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from 'mobx-react';

import App from "./App";
import GameStore from "./stores/GameStore";

const gameStore = new GameStore();

window.game = gameStore;

const renderApp = () => {
  ReactDOM.render(
    <Provider game={gameStore}><App /></Provider>,
    document.getElementById("root")
  );
}

renderApp();

if (module.hot) {
  module.hot.accept(["./App"], () => {
    renderApp()
  })
}