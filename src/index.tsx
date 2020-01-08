import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import * as serviceWorker from './serviceWorker';
import 'bootstrap/dist/css/bootstrap.min.css';

const initialState = {
  screen: 'title'
};

function rootReducer(state = initialState, action: any) {
  console.log(action, state);
  switch (action.type) {
    case 'CHANGE_SCREEN':
      return {...state, screen: action.screen};
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
