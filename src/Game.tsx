import React from 'react';
import { Title } from './Title';
import { connect } from 'react-redux'

let Game = () => {
  return (
    <div>
      <Title />
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
