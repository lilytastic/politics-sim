import React from 'react';
import { render } from "@testing-library/react";
import { State } from '../store/reducers';
import { connect, ConnectedProps } from 'react-redux';
import { SettlementProfile } from './SettlementProfile';
import CurrentPhase from './CurrentPhase';
import SettlementCircle from './SettlementCircle';
import SettlementMotions from './SettlementMotions';

export const SettlementView = ({currentSettlement, policies, phase}: Props) => {
  return (
    <div>
      <h2>Profile</h2>
      <SettlementProfile settlement={currentSettlement} policies={policies}></SettlementProfile>
      <CurrentPhase></CurrentPhase>

      <h2 className="mt-5">Politics</h2>
      <div className="row">
        <div className="col-5">
          <h3 className="mb-3">Circle</h3>
          <SettlementCircle></SettlementCircle>
        </div>
        <div className="col-7">
          <h3 className="mb-3">{phase?.id === 'table' ? 'Opportunities' : 'Measures'}</h3>
          <SettlementMotions></SettlementMotions>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: State) => {
  const settlement = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}))[0];
  const profile: {[id: string]: number} = {purpose: 0, joy: 0, education: 0, vigilance: 0, dignity: 0, charity: 0, creativity: 0, openness: 0};
  Object.keys(settlement.state.policies).forEach(policyId => {
    const stance = settlement.state.policies[policyId];
    state.policies.find(x => x.id === policyId)?.stances[stance].effects.forEach(effect => {
      profile[effect.stat] = profile[effect.stat] || 0;
      profile[effect.stat] += effect.amount;
    });
  });
  Object.keys(profile).forEach(x => profile[x] = Math.max(0, profile[x]));
  return {
    currentSettlement: {...settlement, derived: {profile: profile}},
    phase: state.phases[state.saveData.currentPhase || 0],
    policies: state.policies,
  }
};

const connector = connect(
  mapStateToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux;

export default connector(SettlementView);

