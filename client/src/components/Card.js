import "./Card.css";

import React from "react";

export default class Card extends React.Component {
  render() {
    const { character } = this.props;

    return (
      <div className="Card" id={`card-${character}`}>
        <div className="Card--flipper">
          <div
            className="Card--front"
            style={{
              backgroundImage: `url(/assets/Card${character}.png)`
            }}
          />
          <div className="Card--back" />
        </div>
      </div>
    );
  }
}
