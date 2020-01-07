import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.scss';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>RHIZ</h1>
        <button onClick={startGame} className="btn btn-primary">New Game</button>
        <button onClick={loadGame} className="btn btn-primary">Load Game</button>
      </header>
    </div>
  );
}

function startGame() {
  console.log('start game');
}

function loadGame() {
  console.log('load game');
}


export default App;
