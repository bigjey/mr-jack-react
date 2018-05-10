import "./Action.css";

import React from "react";
import classnames from "classnames";
import { inject, observer } from "mobx-react";

@inject("game")
@observer
export default class Action extends React.Component {
  state = {
    flipped: false
  };
  render() {
    const {
      actions,
      flipped,
      used,
      selected,
      game: { currentAction, selectAction }
    } = this.props;

    const [action1, action2] = actions.split("|");

    const actionClasses = classnames("Action", {
      used,
      active: selected
    });

    const flipperClasses = classnames("Action--flipper", {
      flipped
    });

    return (
      <div
        className={actionClasses}
        onClick={used || currentAction ? null : () => {
          selectAction(actions);
        }}
      >
        <div className={flipperClasses}>
          <div
            className="Action--front"
            style={{
              backgroundImage: `url(/assets/Action${action1}.png)`
            }}
          />
          <div
            className="Action--back"
            style={{
              backgroundImage: `url(/assets/Action${action2}.png)`
            }}
          />
        </div>
      </div>
    );
  }
}
