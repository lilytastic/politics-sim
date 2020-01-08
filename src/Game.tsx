import React from 'react';
import Title from './Title';
import { connect } from 'react-redux'

let Game = ({ screen }: any) => {
  return (
    <div>
      Current screen: {screen}
      <div className="full-screen center-vert">
        {screen === 'title' && <Title />}
      </div>
    </div>
  );
}

const mapStateToProps = (state: any) => {
  return {
    screen: state.screen
  }
};
const mapDispatchToProps = { }

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Game);
