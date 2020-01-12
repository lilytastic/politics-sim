import React from 'react';
import { StatIcon } from "../components/StatIcon";
import { PolicyBaseData } from '../models/policy.model';
import { State } from '../store/reducers';
import { connect, ConnectedProps } from 'react-redux';

export const SettlementProfile = ({settlement, policies}: {settlement: any, policies: PolicyBaseData[]}) => {return (
  <div>
    <ul className="d-flex flex-wrap" style={{ width: '250px' }}>
      {Object.keys(settlement?.derived?.profile).map(x => (
        <li key={x} style={{ minWidth: '60px' }}><StatIcon stat={x} mode='modifier' value={settlement?.derived?.profile[x]}></StatIcon></li>
      ))}
    </ul>
    <ul>
      {Object.keys(settlement?.state?.policies).map(key => {
        const policy: PolicyBaseData | undefined = policies.filter(x => !!x).find(x => x.id === key);
        const stance = policy?.stances[settlement?.state?.policies[key]];
        return (
          <li key={key}>
            <div className="d-inline-block" style={{ minWidth: '150px' }}>
              {policy?.label}
            </div>
            &nbsp;
        <div className="d-inline-block font-weight-bold" style={{ minWidth: '100px' }}>{stance?.label}</div>
            &nbsp;
        {stance?.effects.map(x => (<span key={x.stat} style={{ minWidth: '60px' }} className="d-inline-block"><StatIcon stat={x.stat} mode='modifier' value={x.amount}></StatIcon></span>))}
          </li>
        );
      })}
    </ul>
  </div>
)}

/*
const mapStateToProps = (state: State) => {
  return {
    policies: state.policies
  }
};

const connector = connect(
  mapStateToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux & {
  backgroundColor: string
}

export default connector(SettlementProfile);
*/
