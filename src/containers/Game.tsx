import React from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { interval, timer } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, changeVote, passMotion, changeVotes, loadActorsWithDefaultState } from '../store/actionCreators';
import { ActorBaseData, ActorState, actors, ActorWithState, returnActorWithState } from '../models/actor.model';
import { State, Vote } from '../store/reducers';
import { MotionInfo } from '../components/MotionInfo';
import { StatIcon } from '../components/StatIcon';
import { Motion } from '../models/motion.model';
import { stats } from '../models/stats.model';
import { PolicyState, PolicyBaseData } from '../models/policy.model';

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
      this.props?.actors
        .filter((x: ActorWithState) => x.id !== this.props.player.id)
        .forEach((actor: ActorWithState) => {
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
    this.props.dispatch(updateActors((this.props.actors||[]).map(actor => {
      const softCap = actor.offices.length ? Math.max(...actor.offices.map(x => x.softCapitalCap)) : 0;
      const allowance = actor.offices.length ? actor.offices.reduce((acc, curr) => acc + curr.softCapitalPerCycle, 0) : 0;
      const capital = Math.max(
        actor.state.capital,
        Math.min(softCap, actor.state.capital + allowance)
      );
      return {id: actor.id, changes: {capital: capital}}
    })));
  }

  getVote(motionId: string, actorId: string) {
    return this.props.motionVotes[motionId]?.[actorId];
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
    motion.effects.forEach(effect => {
      const position = actor.state.positions.find(p => p.stat === effect.stat);
      const opposedPosition = actor.state.positions.find(p => stats[p.stat].opposed === effect.stat);
      if (position) {
        approval += (effect.amount || 0) * (position.attitude === 'raise' ? 1 : -1) * (position.passion / 100);
      }
      if (opposedPosition) {
        approval -= (effect.amount || 0) * (opposedPosition.attitude === 'raise' ? 1 : -1) * ((opposedPosition.passion / 2) / 100);
      }
    });
    return approval;
  }

  tallyVotes = (votes: Vote[]) => {
    const positions = ['yea', 'abstain', 'nay'];
    const _votes: {[id: string]: {voters: number, total: number}} = {};
    positions.forEach(key => {
      _votes[key] = {
        voters: votes.reduce((acc, curr) => acc + (curr.vote === key ? 1 : 0), 0),
        total: votes.reduce((acc, curr) => acc + (curr.vote === key ? (this.props.actors.find(x => x.id === curr.actorId)?.voteWeight || 1) : 0), 0)
      }
    });
    return _votes;
  }

  actorsVote = () => {
    let changes: Vote[] = [];
    const actorChanges: {id: string, changes: Partial<ActorState>}[] = [];

    this.props?.availableMotions
      .filter((motion: Motion) => !!this.getById(this.props.motionsTabled, motion.id))
      .forEach((motion: Motion) => {
        const actors = this.props?.actors.map(actor => {
          const approval = this.getActorApproval(actor, motion);
          const costToInfluence: {[id: string]: number} = {
            yea: Math.max(100, (1 + Math.max(0, approval)) * 100 * actor.voteWeight),
            abstain: Math.max(100, (1 + Math.max(0, Math.abs(approval))) * 100 * actor.voteWeight),
            nay: Math.max(100, (1 + Math.min(0, approval)) * 100 * actor.voteWeight)
          }
          return {...actor, approval: approval, costToInfluence: costToInfluence, position: approval > 0 ? 'yea' : approval < 0 ? 'nay' : 'abstain'}
        });
        actors.forEach(actor => {
          changes.push({
            actorId: actor.id,
            motionId: motion.id,
            vote: actor.position,
            reason: 'freely'
          });
        })

        console.log('default positions tallied:', this.tallyVotes(changes), changes);

        actors.forEach(actor => {
          const voteOptions = actors
            .filter(x => x.id !== actor.id)
            .sort((a, b) => a.costToInfluence[actor.position] > b.costToInfluence[actor.position] ? 1 : -1);

          if (Math.abs(actor.approval) > 3) {
            const votes = this.tallyVotes(changes);
            const votesNeeded = Math.max(0,
              actor.position === 'yea' ? votes.nay.total - votes.yea.total :
              actor.position === 'nay' ? votes.yea.total - votes.nay.total :
              0
            );
            let votesBought = 0;
            console.log(`${actor.name} wants "${actor.position}" vote on ${motion.name}: Needs ${votesNeeded} votes`, voteOptions);
            // Actor cares enough to buy votes from other actors.
            let capital = actor.state.capital;
            voteOptions
              // .filter(x => x.costToInfluence < Math.abs(actor.approval) / 100)
              .map(_actor => ({..._actor, existingVoteIndex: changes.findIndex(x => x.actorId === _actor.id), existingVote: changes.find(x => x.actorId === _actor.id)}))
              .forEach(_actor => {
                if (votesBought >= votesNeeded) {
                  return;
                }
                const costToInfluence = _actor.costToInfluence;
                const boughtVote = {actorId: _actor.id, motionId: motion.id, reason: 'bought', vote: actor.position};
                const amountSpent = costToInfluence[actor.position];
                if (capital >= amountSpent) {
                  let bought = false;
                  if (!!_actor.existingVote && _actor.existingVote.reason !== 'bought') {
                    // Can't buy from someone who's already been bought
                    bought = true;
                  } else if (!_actor.existingVote) {
                    bought = true;
                  }

                  if (bought) {
                    if (_actor.id === this.props.player.id) {
                      // Alert player
                      console.log(`${actor.name} wants to buy ${boughtVote.vote} vote from the player for ${amountSpent}`);
                    } else {
                      _actor.existingVoteIndex !== -1 ? changes[_actor.existingVoteIndex] = boughtVote : changes.push(boughtVote);
                      votesBought += _actor.voteWeight;
                      capital -= amountSpent;
                      actorChanges.push({id: actor.id, changes: {capital: actor.state.capital - amountSpent}});
                      actorChanges.push({id: _actor.id, changes: {capital: _actor.state.capital + amountSpent}});
                      console.log(`${actor.name} bought ${boughtVote.vote} vote from ${_actor.name} for ${amountSpent}`);
                    }
                  }
                }
              });
          }
        });
      });
    console.log(changes, actorChanges);
    this.props.dispatch(changeVotes(changes));
    this.props.dispatch(updateActors(actorChanges));
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
          <ul className="d-flex flex-wrap" style={{width: '250px'}}>
            {Object.keys(this.props.currentSettlement?.derived?.profile).map(x => (
              <li key={x} style={{minWidth: '60px'}}><StatIcon stat={x} mode='modifier' value={this.props.currentSettlement?.derived?.profile[x]}></StatIcon></li>
            ))}
          </ul>
          <ul>
            {Object.keys(this.props.currentSettlement?.state?.policies).map(key => {
              const policy: PolicyBaseData | undefined = this.props.policies.find(x => x.id === key);
              const stance = policy?.stances[this.props.currentSettlement?.state?.policies[key]];
              return (
                <li key={key}>
                  <div className="d-inline-block" style={{minWidth: '150px'}}>
                    {policy?.label}
                  </div>
                  &nbsp;
                  <div className="d-inline-block font-weight-bold" style={{minWidth: '100px'}}>{stance?.label}</div>
                  &nbsp;
                  {stance?.effects.map(x => (<span key={x.stat} style={{minWidth: '60px'}} className="d-inline-block"><StatIcon stat={x.stat} mode='modifier' value={x.amount}></StatIcon></span>))}
                </li>
              );
            })}
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
        <div className="col-7">
          <h3 className="mb-3">
            {this.props.phase?.id === 'table' ? 'Opportunities' : 'Measures'}
          </h3>
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
                      Yea: <b>{this.props.actors?.reduce((acc, curr) => acc + (this.getVote(motion.id, curr.id)?.vote === 'yea' ? curr.voteWeight : 0), 0) || 0}</b> ({this.props.actors?.reduce((acc, curr) => acc + (this.getVote(motion.id, curr.id)?.vote === 'yea' ? 1 : 0), 0) || 0})
                      &nbsp;
                      Nay: <b>{this.props.actors?.reduce((acc, curr) => acc + (this.getVote(motion.id, curr.id)?.vote === 'nay' ? curr.voteWeight : 0), 0) || 0}</b> ({this.props.actors?.reduce((acc, curr) => acc + (this.getVote(motion.id, curr.id)?.vote === 'nay' ? 1 : 0), 0) || 0})
                    </span>
                  :
                    null
                  }
                </MotionInfo>
              </button>
              {this.props.phase?.id !== 'table' ? (
                <div className="btn-group w-100">
                  <button style={{borderTopLeftRadius: 0}}
                      className={`btn w-100 btn-${this.getVote(motion.id, this.props.player.id)?.vote !== 'yea' ? 'outline-' : ''}success`}
                      onClick={() => this.vote(motion.id, this.props.player.id, 'yea')}>
                    Yea
                  </button>
                  <button style={{borderTopRightRadius: 0}}
                      className={`btn w-100 btn-${this.getVote(motion.id, this.props.player.id)?.vote !== 'nay' ? 'outline-' : ''}danger`}
                      onClick={() => this.vote(motion.id, this.props.player.id, 'nay')}>
                    Nay
                  </button>
                </div>
              ) : (
                <div className="w-100">
                  <button style={{borderTopLeftRadius: 0, borderTopRightRadius: 0}}
                      disabled={!!motion.onTable && motion.onTable.tabledBy !== (this.props.player.id)}
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
        </div>
        <div className="col-5 border-left">
          <h3 className="mb-3">Congress</h3>
          {this.props.actors.map((x, i) => (
            <div className="mb-3" key={x.id}>
              <div className="d-flex justify-content-between">
                <div>
                  <b>{x.name}</b>
                  {x.offices.length > 0 && (x.offices.map(office => ', ' + office.name.basic))}
                  {x.id === this.props.player.id && (<span>&nbsp;(You)</span>)}
                </div>
                <div className="d-flex">
                  <div style={{minWidth: '60px'}}><StatIcon stat='capital' value={x.state.capital}></StatIcon></div>
                  <div><StatIcon stat='votes' value={x.voteWeight}></StatIcon></div>
                </div>
              </div>
              <div className="d-flex">
                {x.state.positions.map(position => (
                  <div key={position.stat} style={{opacity: position.passion / 100.0}}>
                    <StatIcon stat={position.stat} color={position.attitude !== 'raise' ? 'crimson' : 'initial'}></StatIcon>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: State) => {
  const settlement = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}))[0];
  const profile: {[id: string]: number} = {purpose: 0, joy: 0, education: 0, vigilance: 0, dignity: 0, poverty: 0, ignorance: 0, threat: 0};
  Object.keys(settlement.state.policies).forEach(policyId => {
    const stance = settlement.state.policies[policyId];
    state.policies.find(x => x.id === policyId)?.stances[stance].effects.forEach(effect => {
      profile[effect.stat] = profile[effect.stat] || 0;
      profile[effect.stat] += effect.amount;
    });
  });
  Object.keys(profile).forEach(x => profile[x] = Math.max(0, profile[x]));

  return {
    phase: state.phases[state.saveData.currentPhase || 0],
    phases: state.phases,
    currentSettlement: {...settlement, derived: {profile: profile}},
    actors: state.actors.map(x => ({...returnActorWithState(x, state.saveData.actorState[x.id])})).map(actor => {
      const offices = Object.keys(settlement.state.officeOccupants).filter(x => settlement.state.officeOccupants[x] === actor.id).map(x => settlement.state.offices[x]);
      return {...actor, offices: offices, voteWeight: 1 + offices.reduce((acc, curr) => acc + curr.voteWeight, 0)};
    }).sort((a, b) => Math.max(...a.offices.map(x => x.softCapitalCap)) > Math.max(...b.offices.map(x => x.softCapitalCap)) ? -1 : 1),
    player: state.actors.find((x: any) => x.id === 'player') || state.actors[0],
    motionsTabled: state.saveData.motionsTabled,
    motionVotes: state.saveData.motionVotes,
    currentPhaseCountdown: state.saveData.currentPhaseCountdown,
    currentPhase: state.saveData.currentPhase,
    policies: state.policies,
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
