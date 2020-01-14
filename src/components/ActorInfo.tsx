import React from 'react';
import { StatIcon } from './StatIcon';
import { ConnectedProps, connect } from 'react-redux';
import { State } from '../store/reducers';
import { ActorWithState, ActorWithStateAndOffices, returnActorWithStateAndOffices } from '../models/actor.model';
import { getAssociatedVoteColor } from '../helpers/politics.helpers';
import { getById } from '../helpers/entity.helpers';

export const ActorInfo = ({ actor, availableMotions, motionVotes, player, actors, phase, inspectedMotion}: Props) => {
  return (
    <div>
      <div className="row">
        <div className="col">
          <b>{actor.id === player.id ? 'You' : actor.name}</b>
          {actor.offices.length > 0 && (', ' + ((actor.gender === 'm' ? actor.offices[0].name.masculine : actor.offices[0].name.feminine) || actor.offices[0].name.basic))}
        </div>
        <div className="col row mr-0 justify-content-end">
          <div className="col-6"><StatIcon stat='capital' value={actor.state.capital}></StatIcon></div>
          <div className="col-4"><StatIcon stat='votes' value={actor.voteWeight}></StatIcon></div>
        </div>
      </div>
      {
      <div className="d-flex">
        {actor.state.positions.map(position => (
          <div key={position.stat} style={{ opacity: position.passion / 100.0 }}>
            <StatIcon stat={position.stat} color={position.attitude !== 'raise' ? 'crimson' : 'inherit'}></StatIcon>
          </div>
        ))}
      </div>
      }
      {phase?.id !== 'table' && !!availableMotions.find(motion => motion.id === inspectedMotion) ? (
        <div>
          <div>
            {!!motionVotes[inspectedMotion]?.[actor.id] ? (
              <span>
                Voted <b style={{ color: getAssociatedVoteColor(motionVotes[inspectedMotion]?.[actor.id]?.vote || 'abstain') }}>{motionVotes[inspectedMotion]?.[actor.id]?.vote || 'abstain'}</b>
              </span>
            ) : actor.voteWeight > 0 ? 'Vote pending' : `Cannot vote`}
            {!!motionVotes[inspectedMotion]?.[actor.id]?.purchaseAgreement && (
              <span>
                &nbsp;as a favour to {getById(actors, motionVotes[inspectedMotion]?.[actor.id]?.purchaseAgreement.purchasedBy)?.name}&nbsp;&nbsp; <StatIcon stat='capital' value={motionVotes[inspectedMotion][actor.id]?.purchaseAgreement.amountSpent}></StatIcon>
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
  const settlement = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}))[0];

  const actors = state.actors
    .map(x => ({...returnActorWithStateAndOffices(x, state.saveData.actorState[x.id], settlement)}))
    .sort((a, b) => Math.max(...a.offices.map(x => x.softCapitalCap)) > Math.max(...b.offices.map(x => x.softCapitalCap)) ? -1 : 1);

  return {
    actors: actors,
    settlement: settlement,
    phase: state.phases[state.saveData.currentPhase || 0],
    player: actors.find((x: any) => x.id === 'player') || actors[0],
    motionsTabled: state.saveData.motionsTabled,
    motionVotes: state.saveData.motionVotes,
    currentVoteOffers: state.saveData.currentVoteOffers,
    inspectedMotion: state.saveData.inspectedMotion,
    availableMotions: state.saveData.availableMotions
  }
};

const connector = connect(
  mapStateToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux & {actor: ActorWithStateAndOffices};

export default connector(ActorInfo);

