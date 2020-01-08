import React from 'react';
import './App.scss';
import Game from './Game';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom';
import Title from './Title';

function App() {
  return (
    <Router>
      <div className="App-main full-screen">
        <Switch>
          <Route path="/game">
            <Game />
          </Route>
          <Route path="/">
            <Title />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
