import React from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { interval, timer } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, changeVote, passMotion, changeVotes, loadActorsWithDefaultState, setOffers } from '../store/actionCreators';
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
  inspectedMotion = '';

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

  getVote(motionId: string, actorId: string): Vote {
    return {actorId, motionId, ...this.props.motionVotes[motionId]?.[actorId]};
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
          const ugh: Vote[] = this.props.actors?.reduce((acc: Vote[], curr) => ([...acc, this.getVote(motion.id, curr.id)]), []);
          console.log(`All votes for ${motion.name}`, ugh, this.props.motionVotes);
          const votes = this.tallyVotes(ugh);
          console.log(`Final tally for ${motion.name}`, votes);
          ugh.forEach(vote => {
            if (!!vote.purchaseAgreement) {
              const purchaser = vote.purchaseAgreement.purchasedBy;
              const amountSpent = vote.purchaseAgreement.amountSpent;
              this.props.dispatch(updateActors([{id: purchaser, changes: {capital: (this.props.actors.find(x => x.id === purchaser)?.state?.capital||0) - amountSpent}}]));
              this.props.dispatch(updateActors([{id: vote.actorId, changes: {capital: (this.props.actors.find(x => x.id === vote.actorId)?.state?.capital||0) + amountSpent}}]));
            }
          });
          const yea = votes.yea.total;
          const nay = votes.nay.total;
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
    timer(5000).subscribe(() => {
      this.handleVote();
      timer(10000).subscribe(() => {
        this.handleOffers();
      });
    });
  }

  getCostToInfluence = (actor: any, approval: number) => {
    const costToInfluence: {[id: string]: number} = {
      yea: Math.max(100, (1 + Math.max(0, -approval)) * 100 * actor.voteWeight),
      abstain: Math.max(100, (1 + Math.max(0, Math.abs(approval) / 2)) * 100 * actor.voteWeight),
      nay: Math.max(100, (1 + Math.max(0, approval)) * 100 * actor.voteWeight)
    }
    return costToInfluence;
  }

  handleVote = () => {
    let changes: Vote[] = [];
    const offers: {[actorId: string]: Vote[]} = {}

    const tabledMotions = this.props?.availableMotions
      .map(motion => ({...motion, tabledBy: this.getById(this.props.motionsTabled, motion.id)?.tabledBy}))
      .filter(motion => !!motion.tabledBy)

    tabledMotions.forEach(motion => {
      const actors = this.props?.actors
        .map(actor => {
          const approval = this.getActorApproval(actor, motion);
          const costToInfluence = this.getCostToInfluence(actor, approval);
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

      // Now they make offers!
      actors.filter(x => Math.abs(x.approval) > 3).reverse().forEach(actor => {
        const purchaseOptions = actors
          .filter(x => x.id !== actor.id && (!!this.props.motionVotes[motion.id, actor.id]?.purchaseAgreement || Math.sign(actor.approval) !== Math.sign(x.approval)) ) // to filter ones who are already voting this way
          .shuffle()
          .sort((a, b) => a.costToInfluence[actor.position] > b.costToInfluence[actor.position] ? 1 : -1);

        // Actor cares enough to buy votes from other actors.
        const votes = this.tallyVotes(changes);
        const votesNeeded = 
          actor.position === 'yea' ? votes.nay.total - votes.yea.total :
          actor.position === 'nay' ? votes.yea.total - votes.nay.total :
          0;
        const votesToBuy = votesNeeded + 1 + Math.abs(actor.approval / 10);
        let votesBought = 0;
        console.log(`${actor.name} wants "${actor.position}" vote on ${motion.name}: Needs ${votesNeeded} votes, wants ${votesToBuy}`, purchaseOptions);

        let capital = actor.state.capital;
        const amountToSpend = (capital / 2);
        let amountSpentSoFar = 0;
        purchaseOptions
          // .filter(x => x.costToInfluence < Math.abs(actor.approval) / 100)
          .map(_actor => ({..._actor, existingVoteIndex: changes.findIndex(x => x.actorId === _actor.id), existingVote: changes.find(x => x.actorId === _actor.id)}))
          .filter(x => x.costToInfluence[actor.position] <= amountToSpend - amountSpentSoFar)
          .forEach((_actor, i) => {
            if (votesBought >= votesToBuy || amountSpentSoFar >= amountToSpend) {
              return;
            }
            const costToInfluence = _actor.costToInfluence;
            const amountSpent = Math.max(costToInfluence[actor.position], Math.round((amountToSpend - amountSpentSoFar) / (purchaseOptions.length - 1)));

            const boughtVote: Vote = {
              actorId: _actor.id,
              motionId: motion.id,
              reason: 'bought',
              purchaseAgreement: {
                purchasedBy: actor.id,
                amountSpent: amountSpent
              },
              vote: actor.position
            };
            if (capital >= amountSpent) {
              let bought = false;
              if (!!_actor.existingVote && _actor.existingVote.reason !== 'bought') {
                // Can't buy from someone who's already been bought
                bought = true;
              } else if (!_actor.existingVote) {
                bought = true;
              }

              if (bought) {
                offers[_actor.id] = offers[_actor.id] || [];
                offers[_actor.id].push(boughtVote);
                // _actor.existingVoteIndex !== -1 ? changes[_actor.existingVoteIndex] = boughtVote : changes.push(boughtVote);
                votesBought += _actor.voteWeight;
                capital -= amountSpent;
                amountSpentSoFar += amountSpent;
                /*
                actorChanges.push({id: actor.id, changes: {capital: actor.state.capital - amountSpent}});
                actorChanges.push({id: _actor.id, changes: {capital: _actor.state.capital + amountSpent}});
                */
                console.log(`${actor.name} wants to buy ${boughtVote.vote} vote from ${_actor.name} for ${amountSpent}`);
              }
            }
          });
        });
      });
    this.props.dispatch(changeVotes(changes));

    console.log('Offers have been extended', offers);
    this.props.dispatch(setOffers(offers));
  }

  handleOffers = () => {
    const changes: Vote[] = [];
    const tabledMotions = this.props?.availableMotions
      .map(motion => ({...motion, tabledBy: this.getById(this.props.motionsTabled, motion.id)?.tabledBy}))
      .filter(motion => !!motion.tabledBy)

    tabledMotions.forEach(motion => {
      this.props.actors
        .shuffle()
        .filter(x => this.props.player.id !== x.id && motion.tabledBy !== x.id)
        .forEach(actor => {
          let existingVote = this.props.motionVotes[motion.id][actor.id];
          if (!!existingVote?.purchaseAgreement) {
            return;
          }
          const personalOffers = (this.props.currentVoteOffers[actor.id]||[]).shuffle().sort((a, b) => (a.purchaseAgreement?.amountSpent||0) > (b.purchaseAgreement?.amountSpent||0) ? -1 : 1) || [];
          personalOffers.filter(offer => offer.motionId === motion.id).forEach(offer => {
            const existingVoteIndex = changes.findIndex(x => x.actorId === actor.id && x.motionId === motion.id)
            const purchaser = this.props.actors.find(x => x.id === offer.purchaseAgreement?.purchasedBy);
            const amountSpent = offer.purchaseAgreement?.amountSpent || 0;
            if (purchaser && purchaser.state.capital >= amountSpent && !(existingVote?.purchaseAgreement)) {
              existingVoteIndex !== -1 ? changes[existingVoteIndex] = offer : changes.push(offer);
              console.log(`${actor.name} agreed to vote ${offer.vote} on ${motion.name} for ${purchaser.name} in exchange for ${amountSpent}`);
            }
          });
        });
    });

    console.log(changes);
    this.props.dispatch(changeVotes(changes));
  }

  getAssociatedVoteColor(vote: string) {
    switch (vote) {
      case 'yea':
        return 'green';
      case 'nay':
        return 'crimson';
      default:
        return 'grey';
    }
  }

  makeOffer = (actorId: string, motionId: string, vote: string, amountSpent: number) => {
    this.props.dispatch(changeVote({actorId: actorId, motionId: motionId, vote: vote, reason: 'bought', purchaseAgreement: {purchasedBy: 'player', amountSpent: amountSpent}}));
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

  getById = (arr: any[], id: string) => {
    return arr.find((x: any) => x.id === id);
  }

  inspectMotion = (motionId: string) => {
    this.inspectedMotion = (this.inspectedMotion === motionId) ? '' : motionId;
    console.log('now inspecting', this.inspectedMotion);
  }

  phaseFunc: {[id: string]: (motionid: string, actorId: string) => void} = {table: this.table, vote: this.vote};

  render = () => (
    <div className="p-5 content">
      <div className={"fade--full" + (!!this.props.motionVotes[this.inspectedMotion] && ' active')}></div>
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
        <div className="col-6">
          <h3 className="mb-3">
            {this.props.phase?.id === 'table' ? 'Opportunities' : 'Measures'}
          </h3>
          {this.props.availableMotions
              .map(motion => ({...motion, onTable: this.getById(this.props.motionsTabled, motion.id)}))
              .filter(motion => this.props.phase?.id === 'table' || !!motion.onTable)
              .map(motion => (
            <div key={motion.id}
                className={"text-left motion__wrapper btn-group-vertical mb-3 w-100 bg-light rounded" + (this.inspectedMotion === motion.id && ' motion__wrapper--active')}>
              <button className="w-100 btn btn-outline-dark border-bottom-0 p-2 px-3"
                  onClick={() => this.inspectMotion(motion.id)}>
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
        <div className="col-6 border-left">
          <h3 className="mb-3">Congress</h3>
          {this.props.actors.map((x, i) => (
            <div className="mb-3 btn-group-vertical bg-white w-100 rounded actor__wrapper" key={x.id}>
              <button className="btn btn-outline-dark w-100 text-left">
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
                {!!this.props.motionVotes[this.inspectedMotion] ? (
                  <div>
                    <div>
                      Voted <b style={{color: this.getAssociatedVoteColor(this.props.motionVotes[this.inspectedMotion][x.id]?.vote||'abstain')}}>{this.props.motionVotes[this.inspectedMotion][x.id]?.vote||'abstain'}</b>
                    </div>
                    {!!this.props.motionVotes[this.inspectedMotion][x.id]?.purchaseAgreement && (
                      <div>
                        on request of {this.getById(this.props.actors, this.props.motionVotes[this.inspectedMotion][x.id]?.purchaseAgreement.purchasedBy)?.name}&nbsp; <StatIcon stat='capital' value={this.props.motionVotes[this.inspectedMotion][x.id]?.purchaseAgreement.amountSpent}></StatIcon>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    &nbsp;
                  </div>
                )}
                <div className="d-flex">
                  {x.state.positions.map(position => (
                    <div key={position.stat} style={{opacity: position.passion / 100.0}}>
                      <StatIcon stat={position.stat} color={position.attitude !== 'raise' ? 'crimson' : 'initial'}></StatIcon>
                    </div>
                  ))}
                </div>
              </button>
              {(x.id !== this.props.player.id && !!this.props.availableMotions.find(y => y.id === this.inspectedMotion)) ? (() => {
                // @ts-ignore;
                const approval = this.getActorApproval(x, this.props.availableMotions.find(y => y.id === this.inspectedMotion));
                const costToInfluence = this.getCostToInfluence(x, approval);
                const currentOffer = this.props.currentVoteOffers[x.id]?.find(x => x.motionId === this.inspectedMotion)?.purchaseAgreement;
                return (
                  <div className="btn-group w-100">
                    {[{key: 'yea', color: 'success'}, {key: 'abstain', color: 'secondary'}, {key: 'nay', color: 'danger'}].map(key => (
                      <button key={key.key} disabled={this.props.motionsTabled.find(y => y.id === this.inspectedMotion)?.tabledBy === x.id}
                          className={`btn btn-outline-${key.color} w-100`}
                          onClick={() => this.makeOffer(x.id, this.inspectedMotion, key.key, Math.max(!!currentOffer ? (currentOffer?.amountSpent + 100) : 0, costToInfluence[key.key]))}>
                        {key.key} <StatIcon stat='capital' value={Math.max(!!currentOffer ? (currentOffer?.amountSpent + 100) : 0, costToInfluence[key.key])}></StatIcon>
                      </button>
                    ))}
                  </div>
                );
              })() : null}
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
    currentVoteOffers: state.saveData.currentVoteOffers,
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
