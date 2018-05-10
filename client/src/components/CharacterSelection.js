import "./CharacterSelection.css";

import React from "react";
import { inject, observer } from "mobx-react";

import { TURN } from "../constants";

const options = [{
  label: 'Jack',
  value: TURN.JACK
}, {
  label: 'Any',
  value: null
}, {
  label: 'Detective',
  value: TURN.DETECTIVE
}]

@inject("game")
@observer
export default class CharacterSelection extends React.Component {
  render() {
    const {
      game: {
        selectCharacter,
        selection,
        playerId,
        toggleReady,
        ready,
        players,
        readyCountdown
      }
    } = this.props;

    const mySelection = selection[playerId];
    const opponentPlayerId = players.find(p => p !== playerId);
    const opponentSelection = selection[opponentPlayerId];
    const opponentIsReady = ready.indexOf(opponentPlayerId) !== -1;

    return (
      <div className="CharacterSelection">
        <div className="CharacterSelection--title">Prefered character?</div>

        <div className="CharacterSelection--options">
          {options.map(({label, value}) => 
            <div className="CharacterSelection--option" key={label}>
              <div className="CharacterSelection--name">{label}</div>
              <button
                onClick={() => selectCharacter(value)}
                disabled={mySelection === value}
              >
                Select
              </button>
              {mySelection === value && (
                <div className="CharacterSelection--selection">You</div>
              )}
              {opponentSelection === value && (
                <div className="CharacterSelection--selection">
                  Opponent
                  <br/>
                  <small>({opponentIsReady ? `Ready` : `Not Ready`})</small>
                </div>
              )}
            </div>
          )}
        </div>

        {mySelection !== undefined && (
          <div className="CharacterSelection--ready">
            <button onClick={toggleReady}>
              {ready.indexOf(playerId) === -1 ? `I'm Ready!` : `I'm not Ready!`}
            </button>
            <br />
            {readyCountdown && (
              <Countdown
                seconds={5}
                render={({ seconds }) => (
                  <span>
                    {seconds > 0
                      ? `Game starts in ${seconds}...`
                      : `Game will start soon...`}
                  </span>
                )}
              />
            )}
          </div>
        )}
      </div>
    );
  }
}

class Countdown extends React.Component {
  state = {
    seconds: 10
  };

  constructor(props) {
    super(props);

    const { seconds = 10 } = props;

    this.state.seconds = seconds;
  }

  componentWillMount() {
    this.interval = setInterval(() => {
      if (this.state.seconds > 0) {
        this.setState({ seconds: this.state.seconds - 1 });
      }
    }, 1000);
  }

  updateCoundown() {

  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return this.props.render({ ...this.state });
  }
}
