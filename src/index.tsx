import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';
import { rootReducer } from './store/reducers';
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom';
import Title from './containers/Title';
import Game from './containers/Game';

const store = createStore(rootReducer)

ReactDOM.render(
  <Provider store={store}>
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
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
