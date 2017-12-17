import './Action.css';

import React from 'react';
import classnames from 'classnames';

export default class Action extends React.Component {
  state = {
    flipped: false
  }
  render() {
    const { actions } = this.props;
    const { flipped } = this.state;

    const [Action1, Action2] = actions;

    const flipperClasses = classnames('Action--flipper', {
      flipped
    })

    return (
      <div className="Action" onClick={() => {
        console.log(flipped ? Action2 : Action1);
        this.setState({flipped: !flipped})
      }}>
        <div className={flipperClasses}>
          <div className="Action--front" style={{
            backgroundImage: `url(/assets/Action${Action1}.png)`
          }}></div>
          <div className="Action--back" style={{
            backgroundImage: `url(/assets/Action${Action2}.png)`
          }}></div>
        </div>
      </div>
    );
  }
}