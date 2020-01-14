import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { State } from '../store/reducers';

const CurrentPhase = ({ phase, currentPhaseCountdown }: any) => {
  return (
    <div>
      Current Phase: <b>{phase?.label}</b>
      &nbsp;
      <span style={{ color: phase?.countdown - currentPhaseCountdown < 10 ? 'crimson' : 'inherit' }}>
          ({phase?.countdown - currentPhaseCountdown}s)
      </span>
    </div>
  )
};

const mapStateToProps = (state: State) => {
  const settlementState = state.saveData.settlementState['test'];
  return {
    phase: state.phases[settlementState.currentPhase || 0],
    currentPhaseCountdown: settlementState.currentPhaseCountdown
  }
};

const connector = connect(
  mapStateToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux;

export default connector(CurrentPhase);
