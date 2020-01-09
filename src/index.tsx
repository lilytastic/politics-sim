import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';

const initialState = {
  screen: 'title',
  phases: [{name: 'table', countdown: 60}, {name: 'debate', countdown: 60}, {name: 'vote', countdown: 60}],
  currentPhase: 0,
  currentPhaseCountdown: 0
};

function rootReducer(state = initialState, action: any) {
  switch (action.type) {
    case 'CHANGE_SCREEN':
      return {...state, screen: action.screen};
    case 'CHANGE_CURRENT_PHASE':
      return {...state, currentPhase: action.currentPhase, currentPhaseCountdown: 0};
    case 'CHANGE_CURRENT_PHASE_COUNTDOWN':
      return {...state, currentPhaseCountdown: action.currentPhaseCountdown};
    default:
      return state;
  }
}

const store = createStore(rootReducer)

ReactDOM.render(
  <Provider store={store}><App /></Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
