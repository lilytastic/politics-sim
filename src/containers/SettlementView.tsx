import React from 'react';
import { render } from "@testing-library/react";
import { State } from '../store/reducers';
import { connect, ConnectedProps } from 'react-redux';
import { SettlementProfile } from './SettlementProfile';
import CurrentPhase from './CurrentPhase';
import SettlementCircle from './SettlementCircle';
import SettlementMotions from './SettlementMotions';

export const SettlementView = ({settlement, policies, phase}: Props) => {
  return (
    <div>
      <h1 className="mb-3">{settlement.name}</h1>
      <SettlementProfile settlement={settlement} policies={policies}></SettlementProfile>

      <h2 className="mt-5 mb-2">Politics</h2>
      <CurrentPhase></CurrentPhase>
      <div className="row mt-3">
        <div className="col-5">
          <h3 className="mb-3">Circle</h3>
          <SettlementCircle></SettlementCircle>
        </div>
        <div className="col-7">
          <h3 className="mb-3">{phase?.id === 'table' ? 'Opportunities' : 'Measures'}</h3>
          <div style={{minHeight: '800px'}}>
            <SettlementMotions></SettlementMotions>
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: State) => {
  const settlement = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}))[0];
  const profile: {[id: string]: number} = {purpose: 0, charity: 0, education: 0, openness: 0, dignity: 0, joy: 0, creativity: 0, vigilance: 0};
  Object.keys(settlement.state.policies).forEach(policyId => {
    const stance = settlement.state.policies[policyId];
    state.policies.find(x => x.id === policyId)?.stances[stance].effects.forEach(effect => {
      profile[effect.stat] = profile[effect.stat] || 0;
      profile[effect.stat] += effect.amount;
    });
  });
  Object.keys(profile).forEach(x => profile[x] = Math.max(0, profile[x]));
  return {
    settlement: {...settlement, derived: {profile: profile}},
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

