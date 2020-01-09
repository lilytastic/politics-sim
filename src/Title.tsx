import React from 'react';
import { connect } from 'react-redux'
import { loadSave } from './actionCreators';
import { useHistory } from 'react-router-dom';

const Title = ({ dispatch, screen }: any) => {
  let saveData = window.localStorage['saveData'];
  let history = useHistory();
  if (saveData) {saveData = JSON.parse(saveData);}
  const startGame = () => {
    history.push('/game');
  }
  const loadGame = () => {
    // Load whatever save data is in the thing
    dispatch(loadSave(saveData));
    history.push('/game');
  }
  return (
    <div className="center-vert full-screen">
      <h1>Title</h1>
      <ul className="text-center">
        <li>
          <button onClick={startGame} className="btn btn-primary">New</button>
        </li>
        <li>
          <button disabled={!saveData} onClick={loadGame} className="btn btn-primary">Load</button>
        </li>
      </ul>
    </div>
  );
}

const mapStateToProps = (state: any /*, ownProps*/) => {
  return {
    screen: state.screen
  }
};

export default connect(
  mapStateToProps
)(Title);

