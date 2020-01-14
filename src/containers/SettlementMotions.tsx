import React from 'react';
import { StatIcon } from '../components/StatIcon';
import { ActorWithState, returnActorWithState, returnActorWithStateAndOffices } from '../models/actor.model';
import { getById } from '../helpers/entity.helpers';
import { State } from '../store/reducers';
import { changeVote, inspectMotion, tableMotion, updateActors, rescindMotion } from '../store/actionCreators';
import { connect, ConnectedProps } from 'react-redux';
import { MotionInfo } from '../components/MotionInfo';
import { Motion } from '../models/motion.model';
import { returnStandardVotes } from '../helpers/politics.helpers';
import { Vote } from '../models/vote.model';
import FlipMove from 'react-flip-move';

class SettlementMotions extends React.Component {
  // @ts-ignore;
  props: Props;

  getVote(motionId: string, actorId: string): Vote {
    return {actorId, motionId, ...this.props.motionVotes[motionId]?.[actorId]};
  }

  table = (motionId: string, actorId: string) => {
    const motion = this.props.availableMotions.find((x: any) => x.id === motionId);
    const tabled = this.props.motionsTabled.find((x: any) => x.id === motionId);
    const actor = this.props.actors.find((x: ActorWithState) => x.id === actorId);
    if (!actor || !motion) {
      return;
    }
    if (!tabled && actor.state.capital >= motion.costToTable) {
      this.props.dispatch(tableMotion(motionId, actor.id));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'yea', reason: 'freely'}));
      this.props.dispatch(updateActors([{id: actor.id, changes: {capital: actor.state.capital - motion.costToTable}}]));
    } else if (!!tabled && tabled.tabledBy === actor.id) {
      this.props.dispatch(rescindMotion(motionId));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'abstain', reason: 'freely'}));
      this.props.dispatch(updateActors([{id: actor.id, changes: {capital: actor.state.capital + motion.costToTable}}]));
    }
  };

  vote = (motionId: string, actorId: string, vote: string | null = null) => {
    const actor = this.props.actors.find((x: any) => x.id === actorId);
    const currentVote = this.getVote(motionId, actorId);
    if (!actor) {
      return;
    }
    this.props.dispatch(changeVote({
      ...currentVote,
      actorId: actor.id,
      motionId: motionId,
      vote: (currentVote?.vote === vote ? 'abstain' : vote) || 'abstain',
      reason: 'freely'
    }));
    console.log('voting', motionId);
  };

  phaseFunc: {[id: string]: (motionid: string, actorId: string) => void} = {table: this.table, vote: this.vote};

  makeOffer = (actorId: string, motionId: string, vote: string, amountSpent: number) => {
    this.props.dispatch(changeVote({
      actorId: actorId,
      motionId: motionId,
      vote: vote,
      reason: 'bought',
      purchaseAgreement: {purchasedBy: 'player', amountSpent: amountSpent}
    }));
  }

  getOffers = (motion: Motion, vote: string) => {
    return this.props.currentVoteOffers['player']
      ?.filter(x => x.motionId === motion.id && x.vote === vote)
      .sort((a, b) => (a.purchaseAgreement?.amountSpent || 0) > (b.purchaseAgreement?.amountSpent || 0) ? -1 : 1);
  }

  getVotes = (motion: Motion, vote: string, useVoteWeight = false) => {
    return this.props.actors?.reduce((acc, curr) => acc + (this.getVote(motion.id, curr.id)?.vote === vote ? (useVoteWeight ? curr.voteWeight : 1) : 0), 0) || 0;
  }

  render = () => (
    <FlipMove>
      {this.props.availableMotions
          .map(motion => ({...motion, onTable: getById(this.props.motionsTabled, motion.id)}))
          .filter(motion => (this.props.phase?.id === 'table' && !motion.onTable) || (this.props.phase?.id === 'vote' && !!motion.onTable))
          .map(motion => (
        <div key={motion.id}
            className={`text-left btn-group-vertical shadow-sm motion__wrapper motion__wrapper--${this.props.phase?.id !== 'vote' ? 'neutral' : (this.getVotes(motion, 'yea', true) > this.getVotes(motion, 'nay', true)) ? 'yea' : 'nay'} btn-group-vertical mb-3 w-100 bg-light rounded` + (this.props.inspectedMotion === motion.id && ' shadow-sm  motion__wrapper--active')}>
          <button className={`w-100 btn btn-outline-dark border-secondary text-left p-2 px-3`}
              onClick={() => this.props.dispatch(inspectMotion(motion.id))}>
            <MotionInfo motion={motion}
                mode={this.props.phase?.id}
                tabledBy={getById(this.props.actors, motion.onTable?.tabledBy || -1)}>
              {this.props.phase?.id !== 'table' ?
                <span>
                  {returnStandardVotes().map(def => (
                    <span key={def.key}>{def.key}: <b>{this.getVotes(motion, def.key, true)}</b> ({this.getVotes(motion, def.key)})&nbsp;</span>
                  ))}
                </span>
              :
                <span className="d-inline-flex align-items-center">
                  <div className="mr-2">Reward</div><StatIcon stat='capital' value={motion.rewardForPassing}></StatIcon>
                </span>
              }
            </MotionInfo>
          </button>
          {(this.props.phase?.id === 'vote' && this.props.player?.voteWeight > 0) && (
            <div className="btn-group w-100">
              {returnStandardVotes().map(def => (
                <button key={def.key} style={{borderTopLeftRadius: 0}}
                    className={`btn w-100 btn-${this.getVote(motion.id, this.props.player.id)?.vote !== def.key ? 'outline-' : ''}${def.color}`}
                    onClick={() => this.vote(motion.id, this.props.player.id, def.key)}>
                  {def.key}
                  &nbsp;
                  {!!this.getOffers(motion, def.key)?.length && (
                    <span>
                      &nbsp;
                      <StatIcon stat='capital' value={this.getOffers(motion, def.key)[0]?.purchaseAgreement?.amountSpent}></StatIcon>
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          {this.props.phase?.id === 'table' && (
            <div className="btn-group w-100">
              <button style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}}
                  disabled={(!motion.onTable && this.props.player.state.capital < motion.costToTable) || (!!motion.onTable && motion.onTable.tabledBy !== (this.props.player.id))}
                  className={"btn btn-block w-100 " + (!!motion.onTable ? "btn-outline-danger" : "btn-outline-primary")}
                  onClick={() => this.table(motion.id, this.props.player.id)}>
                {!!motion.onTable ? 'Rescind' : 'Draft'}
                &nbsp;&nbsp;&nbsp;
                <StatIcon stat='capital' value={motion.costToTable}></StatIcon>
              </button>
            </div>
          )}
        </div>
      ))}
    </FlipMove>
  )
}

const mapStateToProps = (state: State) => {
  const settlement = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}))[0];

  const actors = state.actors
    .map(x => ({...returnActorWithStateAndOffices(x, state.saveData.actorState[x.id], settlement)}))
    .sort((a, b) => Math.max(...a.offices.map(x => x.softCapitalCap)) > Math.max(...b.offices.map(x => x.softCapitalCap)) ? -1 : 1);

  return {
    actors: actors,
    player: actors.find((x: any) => x.id === 'player') || actors[0],
    phase: state.phases[state.saveData.currentPhase || 0],
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
type Props = PropsFromRedux;

export default connector(SettlementMotions);
