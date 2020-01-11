import React from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { interval, timer } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, changeVote, passMotion, changeVotes, loadActorsWithDefaultState } from '../store/actionCreators';
import { ActorBaseData, ActorState, actors, ActorWithState, returnActorWithState } from '../models/actor.model';
import { State } from '../store/reducers';
import { MotionInfo } from '../components/MotionInfo';
import { Stat } from '../components/Stat';
import { Motion } from '../models/motion.model';

// Current Phase: {this.props.phase.name} ({this.props.phase.countdown - currentPhaseCountdown}s) {currentPhaseCountdown}

class Game extends React.Component {
  // @ts-ignore;
  props: Props;

  constructor(props: any) {
    super(props);
    props.dispatch(loadActorsWithDefaultState(actors));
    window.requestAnimationFrame(() => {
      this.returnToTablePhase();
    });

    interval(1000).subscribe(x => {
      this.onTick();
    });
  }

  returnToTablePhase = () => {
    this.grantAllowance();
    this.props.dispatch(refreshAvailableMotions());
    timer(5000).subscribe(() => {
      console.log('checking table preference');
      this.props?.actors.filter((x: ActorWithState) => x.id !== this.props.player?.id).forEach((actor: ActorWithState) => {
        this.props.availableMotions.forEach((motion: Motion) => {
          const approval = this.getActorApproval(actor, motion);
          if (approval > 2.5) {
            this.table(motion.id, actor.id);
          }
        });
      });
    });
  }

  grantAllowance = () => {
    this.props.dispatch(updateActors((this.props.actors||[]).map((x: ActorWithState) => ({id: x.id, changes: {capital: x.state.capital + 100}}))));
  }

  getVote(motionId: string, actorId: string) {
    return this.props.motionVotes[motionId][actorId];
  }

  onTick = () => {
    if (this.props.currentPhaseCountdown >= this.props.phase?.countdown) {
      this.advancePhase();
    } else {
      this.props.dispatch(changeCurrentPhaseCountdown(this.props.currentPhaseCountdown + 1));
    }
  }

  advancePhase = () => {
    const currentPhase = this.props.phase;
    if (currentPhase?.id === 'table' && !this.props.motionsTabled.length) {
      this.props.dispatch(changeCurrentPhaseCountdown(0));
      this.returnToTablePhase();
      return;
    }
    if (currentPhase?.id === 'vote') {
      this.props.availableMotions
        .filter((motion: Motion) => !!this.getById(this.props.motionsTabled, motion.id))
        .forEach((motion: Motion) => {
          const yea = this.props.actors
            ?.reduce((acc: any, curr: any) => acc + (this.getVote(motion.id, curr.id)?.vote === 'yea' ? 1 : 0), 0) || 0;
          const nay = this.props.actors
            ?.reduce((acc: any, curr: any) => acc + (this.getVote(motion.id, curr.id)?.vote === 'nay' ? 1 : 0), 0) || 0;
          console.log(`Vote for ${motion.name}: ${yea} Yea, ${nay} Nay`);
          if (yea > nay) {
            this.props.dispatch(passMotion(motion));
          }
        });
      this.returnToTablePhase();
    }

    this.props.dispatch(changeCurrentPhase((this.props.currentPhase + 1) % this.props.phases.length));

    const newPhase = this.props.phase;
    if (newPhase?.id === 'table') {
      this.returnToTablePhase();
    }
    if (newPhase?.id === 'vote') {
      this.actorsVote();
    }
  }

  getActorApproval = (actor: ActorWithState, motion: Motion) => {
    let approval = 0;
    actor.state.positions.forEach(position => {
      const effect = motion.effects.find(x => x.stat === position.stat);
      approval += (effect?.amount || 0) * (position.attitude === 'raise' ? 1 : -1) * (position.passion / 100)
    });
    return approval;
  }

  actorsVote = () => {
    let changes: any[] = [];
    this.props?.actors
      .filter((x: ActorWithState) => x.id !== (this.props.player?.id || '0'))
      .forEach((actor: ActorWithState) => {
        this.props?.availableMotions
          .filter((motion: Motion) => !!this.getById(this.props.motionsTabled, motion.id))
          .forEach((motion: Motion) => {
            let approval = this.getActorApproval(actor, motion);
            changes.push({
              actorId: actor.id,
              motionId: motion.id,
              vote: approval > 0 ? 'yea' : approval < 0 ? 'nay' : 'abstain',
              reason: 'freely'
            });
          });
      });
    this.props.dispatch(changeVotes(changes));
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
      actorId: actor.id,
      motionId: motionId,
      vote: (currentVote?.vote === vote ? 'abstain' : vote) || 'abstain',
      reason: 'freely'
    }));
    console.log('voting', motionId);
  };

  getById = (arr: any[], id: string) => {
    return arr.find((x: any) => x.id === id);
  }

  phaseFunc: {[id: string]: (motionid: string, actorId: string) => void} = {table: this.table, vote: this.vote};

  render = () => (
    <div className="p-5 content">
      <div className="mb-4">
        <h2>Profile</h2>
        <div>
          <ul className="d-flex">
            {Object.keys(this.props.currentSettlement?.derived?.profile).map(x => (
              <li key={x} style={{minWidth: '60px'}}><Stat stat={x} value={this.props.currentSettlement?.derived?.profile[x]}></Stat></li>
            ))}
          </ul>
        </div>

        <h2 className="mt-5">Politics</h2>
        <div>
          Current Phase: <b>{this.props.phase?.label}</b>&nbsp;
          <span style={{color: this.props.phase?.countdown - this.props.currentPhaseCountdown < 10 ? 'crimson' : 'inherit'}}>
            ({this.props.phase?.countdown - this.props.currentPhaseCountdown}s)
          </span>
        </div>
      </div>
      <div className="row">
        <div className="col">
          {this.props.availableMotions
              .map(motion => ({...motion, onTable: this.getById(this.props.motionsTabled, motion.id)}))
              .filter(motion => this.props.phase?.id === 'table' || !!motion.onTable)
              .map(motion => (
            <div key={motion.id}
                className={"text-left btn-group-vertical mb-3 w-100 bg-light rounded"}>
              <button className="w-100 btn btn-outline-dark border-bottom-0 p-2 px-3">
                <MotionInfo motion={motion}
                    mode={this.props.phase?.id}
                    tabledBy={this.getById(this.props.actors, motion.onTable?.tabledBy || -1)}>
                  {this.props.phase?.id !== 'table' ?
                    <span>
                      Yea: {this.props.actors?.reduce((acc: any, curr: any) => acc + (this.getVote(motion.id, curr.id)?.vote === 'yea' ? 1 : 0), 0) || 0}
                      &nbsp;
                      Nay: {this.props.actors?.reduce((acc: any, curr: any) => acc + (this.getVote(motion.id, curr.id)?.vote === 'nay' ? 1 : 0), 0) || 0}
                    </span>
                  :
                    null
                  }
                </MotionInfo>
              </button>
              {this.props.phase?.id !== 'table' ? (
                <div className="btn-group w-100">
                  <button style={{borderTopLeftRadius: 0}}
                      className={`btn w-100 btn-${this.getVote(motion.id, this.props.player?.id || '0')?.vote !== 'yea' ? 'outline-' : ''}success`}
                      onClick={() => this.vote(motion.id, this.props.player?.id || '0', 'yea')}>
                    Yea
                  </button>
                  <button style={{borderTopRightRadius: 0}}
                      className={`btn w-100 btn-${this.getVote(motion.id, this.props.player?.id || '0')?.vote !== 'nay' ? 'outline-' : ''}danger`}
                      onClick={() => this.vote(motion.id, this.props.player?.id || '0', 'nay')}>
                    Nay
                  </button>
                </div>
              ) : (
                <div className="w-100">
                  <button style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}}
                      disabled={!!motion.onTable && motion.onTable.tabledBy !== (this.props.player?.id || '0')}
                      className={"btn btn-block w-100 " + (!!motion.onTable ? "btn-outline-danger" : "btn-outline-primary")}
                      onClick={() => this.table(motion.id, this.props.player?.id || '0')}>
                    {!!motion.onTable ? 'Rescind' : 'Table'}
                    &nbsp;&nbsp;&nbsp;
                    <Stat stat='capital' value={motion.costToTable}></Stat>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="col">
          {this.props.actors.map((x, i) => (
            <div className="mb-3" key={i}>
              <div className="d-flex align-items-center">
                <div className="w-25">{i+1}. {x.name}</div>
                <div><Stat stat='capital' value={x.state.capital}></Stat></div>
              </div>
              {x.state.positions.map(position => (
                <Stat key={position.stat} stat={position.stat} color={position.attitude !== 'raise' ? 'crimson' : 'initial'}></Stat>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: State) => {
  const settlement = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}))[0];
  const profile: {[id: string]: number} = {faith: 0, joy: 0, education: 0, vigilance: 0, disobedience: 0, poverty: 0, ignorance: 0, threat: 0};
  /*
  settlement.policies.forEach((motion: Motion) => {
    motion.effects.forEach(effect => {
      profile[effect.stat] = profile[effect.stat] || 0;
      profile[effect.stat] += effect.amount;
    });
  });
  */

  return {
    phase: state.phases[state.saveData.currentPhase || 0],
    phases: state.phases,
    currentSettlement: {...settlement, derived: {profile: profile}},
    actors: state.actors.map(x => (returnActorWithState(x, state.saveData.actorState[x.id]))),
    player: state.actors.find((x: any) => x.id === 0),
    motionsTabled: state.saveData.motionsTabled,
    motionVotes: state.saveData.motionVotes,
    currentPhaseCountdown: state.saveData.currentPhaseCountdown,
    currentPhase: state.saveData.currentPhase,
    screen: state.screen,
    availableMotions: state.saveData.availableMotions
  }
};

const connector = connect(
  mapStateToProps
);

type PropsFromRedux = ConnectedProps<typeof connector>
type Props = PropsFromRedux & {
  backgroundColor: string
}

export default connector(Game);
