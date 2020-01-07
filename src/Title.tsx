import React from 'react';
import { connect } from 'react-redux'

function startGame() {
  console.log('start game');
}
function loadGame() {
  console.log('load game');
}

export const Title = () => {
  return (
    <header className="App-header">
      <h1>RHIZ</h1>
      <ul className="text-center">
        <li>
          <button onClick={startGame} className="btn btn-primary">New Game</button>
        </li>
        <li>
          <button onClick={loadGame} className="btn btn-primary">Load Game</button>
        </li>
      </ul>
    </header>
  );
}

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    screen: state.screen
  }
};
const mapDispatchToProps = { }

export default connect(
  mapStateToProps,
  mapDispatchToProps
);
