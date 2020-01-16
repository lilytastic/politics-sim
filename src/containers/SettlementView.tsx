import React from 'react';
import { render } from "@testing-library/react";
import { State } from '../store/reducers';
import { connect, ConnectedProps } from 'react-redux';
import { SettlementProfile } from './SettlementProfile';
import CurrentPhase from './CurrentPhase';
import SettlementCircle from './SettlementCircle';
import SettlementMotions from './SettlementMotions';
import { SettlementWithState } from '../models/settlement.model';
import { checkIfFullyTallied } from '../helpers/politics.helpers';

export const SettlementView = ({settlement, policies, phase, currentCountdown}: Props) => {
  return (
    <div>
      <h1 className="mb-3">{settlement.name}</h1>
      <SettlementProfile settlement={settlement} policies={policies}></SettlementProfile>

      <h2 className="mt-5 mb-2">Politics</h2>
      <div style={{minHeight: '40px'}}>

      </div>
      <div className="row mt-3">
        <div className="col-5">
          <h3 className="mb-3">Circle</h3>
          <SettlementCircle settlement={settlement}></SettlementCircle>
        </div>
        <div className="col-7">
          <h3 className="mb-3">
            {phase?.label}&nbsp;
            {(phase.countdown - currentCountdown > 0) && (<span style={{color: (phase?.countdown - currentCountdown < 10) ? 'red' : 'inherit'}}>{phase?.countdown - currentCountdown}s</span>)}
          </h3>
          <div style={{minHeight: '800px'}}>
            <SettlementMotions settlement={settlement}></SettlementMotions>
          </div>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: State, ownProps: {settlement: SettlementWithState}) => {
  const settlement = ownProps.settlement;
  const profile: {[id: string]: number} = {purpose: 0, charity: 0, education: 0, openness: 0, dignity: 0, joy: 0, creativity: 0, vigilance: 0};
  Object.keys(settlement.state.policies).forEach(policyId => {
    const stance = settlement.state.policies[policyId];
    state.policies.find(x => x.id === policyId)?.stances[stance].effects.forEach(effect => {
      profile[effect.stat] = profile[effect.stat] || 0;
      profile[effect.stat] += effect.amount;
    });
  });
  // Object.keys(profile).forEach(x => profile[x] = Math.max(0, profile[x]));
  return {
    settlement: {...settlement, derived: {profile: profile}},
    phase: settlement.state.currentPhase,
    currentCountdown: settlement.state.currentPhaseCountdown,
    policies: state.policies,
  }
};

const connector = connect(
  mapStateToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux;

export default connector(SettlementView);

