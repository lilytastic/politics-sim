import React from 'react';
import { StatIcon } from './StatIcon';
import { ConnectedProps, connect } from 'react-redux';
import { State } from '../store/reducers';
import { ActorWithStateAndOffices } from '../models/actor.model';
import { getAssociatedVoteColor } from '../helpers/politics.helpers';
import { getById } from '../helpers/entity.helpers';
import { PHASES } from '../models/phase.model';

export const ActorInfo = ({ actor, motionVotes, actors, phase, inspectedMotion, showPositions = false }: Props) => {
  return (
    <div>
      <div className="row">
        <div className="col">
          <b>{actor.id === 'player' ? 'You' : actor.name}</b>
          {actor.offices.length > 0 && (', ' + ((actor.gender === 'm' ? actor.offices[0].name.masculine : actor.offices[0].name.feminine) || actor.offices[0].name.basic))}
        </div>
        <div className="col row m-0 justify-content-end">
          <div className="col col-7"><StatIcon stat='capital' value={actor.state.capital}></StatIcon></div>
          <div className="col col-5 pr-0"><StatIcon stat='votes' value={actor.voteWeight}></StatIcon></div>
        </div>
      </div>
      {
      <div className="d-flex">
        {showPositions && (
          actor.state.positions.map(position => (
            <div key={position.stat} style={{ opacity: position.passion / 100.0 }}>
              <StatIcon stat={position.stat} color={position.attitude !== 'raise' ? 'crimson' : 'inherit'}></StatIcon>
            </div>
          ))
        )}
      </div>
      }
      {phase?.id !== PHASES.TABLE.id && inspectedMotion !== '' ? (
        <div>
          <div>
            {!!motionVotes[inspectedMotion]?.[actor.id] ? (
              <span>
                Voted <b style={{ color: getAssociatedVoteColor(motionVotes[inspectedMotion]?.[actor.id]?.vote || 'abstain') }}>{motionVotes[inspectedMotion]?.[actor.id]?.vote || 'abstain'}</b>
              </span>
            ) : actor.voteWeight > 0 ? 'Vote pending' : `Cannot vote`}
            {!!motionVotes[inspectedMotion]?.[actor.id]?.purchaseAgreement && (
              <span>
                &nbsp;as a favour to {getById(actors, motionVotes[inspectedMotion]?.[actor.id]?.purchaseAgreement?.purchasedBy ?? '')?.name}&nbsp;&nbsp; <StatIcon stat='capital' value={motionVotes[inspectedMotion][actor.id]?.purchaseAgreement?.amountSpent}></StatIcon>
              </span>
            )}
          </div>
        </div>
      ) : (
        <div></div>
      )}
    </div>
  )
}

const mapStateToProps = (state: State) => {
  const settlementId = 'test';
  const settlementState = state.saveData.settlementState[settlementId];
  return {
    actors: state.actors,
    currentSettlement: settlementId,
    phase: settlementState.currentPhase,
    motionVotes: settlementState.motionVotes,
    currentVoteOffers: settlementState.currentVoteOffers,
    inspectedMotion: state.saveData.inspectedMotion
  }
};

const connector = connect(
  mapStateToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux & {actor: ActorWithStateAndOffices, showPositions?: boolean};

export default connector(ActorInfo);

