import './Action.css';

import React from 'react';
import classnames from 'classnames';
import { inject, observer } from 'mobx-react';

@inject('game')
@observer
export default class Action extends React.Component {
  state = {
    flipped: false
  }
  render() {
    const { actions, flipped, used, game: { selectAction } } = this.props;

    const [Action1, Action2] = actions;

    const actionClasses = classnames('Action', {
      used
    })

    const flipperClasses = classnames('Action--flipper', {
      flipped
    })

    return (
      <div
        className={actionClasses}
        onClick={() => {
          selectAction(flipped ? Action2 : Action1);
        }}
      >
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