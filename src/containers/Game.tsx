import React from 'react';
import { connect, ConnectedProps } from 'react-redux'
import { interval, timer } from 'rxjs';
import { changeCurrentPhase, changeCurrentPhaseCountdown, refreshAvailableMotions, tableMotion, rescindMotion, updateActors, changeVote, passMotion, changeVotes, loadActorsWithDefaultState, setOffers, inspectMotion, addAlert } from '../store/actionCreators';
import { actors, ActorWithState, ActorWithStateAndOffices, returnActorWithStateAndOffices } from '../models/actor.model';
import { State } from '../store/reducers';
import { Motion } from '../models/motion.model';
import { getActorApproval, getActorsWithApproval } from '../helpers/politics.helpers';
import { getById } from '../helpers/entity.helpers';
import { SettlementProfile } from './SettlementProfile';
import SettlementCircle from './SettlementCircle';
import SettlementMotions from './SettlementMotions';
import { Vote } from '../models/vote.model';
import CurrentPhase from './CurrentPhase';

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

  returnToTablePhase = () => {
    this.grantAllowance();
    this.props.dispatch(refreshAvailableMotions());
    timer(5000).subscribe(() => {
      this.props?.actors
        .filter((x: ActorWithState) => x.id !== this.props.player.id)
        .forEach((actor: ActorWithState) => {
          this.props.availableMotions.forEach((motion: Motion) => {
            const approval = getActorApproval(actor, motion);
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
        Math.min(softCap, actor.state.capital + Math.max(100, allowance))
      );
      return {id: actor.id, changes: {capital: capital}}
    })));
  }

  getVote(motionId: string, actorId: string): Vote {
    return {actorId, motionId, ...this.props.motionVotes[motionId]?.[actorId]};
  }

  onTick = () => {
    if (this.props.currentPhaseCountdown >= this.props.phase?.countdown - 1) {
      this.advancePhase();
    } else {
      this.props.dispatch(changeCurrentPhaseCountdown(this.props.currentPhaseCountdown + 1));
    }
  }

  getOffers = (motion: Motion, vote: string) => {
    return this.props.currentVoteOffers['player']
      ?.filter(x => x.motionId === motion.id && x.vote === vote)
      .sort((a, b) => (a.purchaseAgreement?.amountSpent || 0) > (b.purchaseAgreement?.amountSpent || 0) ? -1 : 1);
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
        .filter((motion: Motion) => !!getById(this.props.motionsTabled, motion.id))
        .forEach((motion: Motion) => {
          const ugh: Vote[] = this.props.actors?.reduce((acc: Vote[], curr) => ([...acc, this.getVote(motion.id, curr.id)]), []);
          console.log(`All votes for ${motion.name}`, ugh, this.props.motionVotes);
          const votes = this.tallyVotes(ugh);
          console.log(`Final tally for ${motion.name}`, votes);
          let playerDeets: {purchasedBy: string; amountSpent: number} | undefined;
          let playerVote: Vote | undefined = undefined;
          let playerVoteString = '';
          ugh.forEach(vote => {
            if (!!vote.purchaseAgreement) {
              const purchaser = vote.purchaseAgreement.purchasedBy;
              const amountSpent = vote.purchaseAgreement.amountSpent;
              this.props.dispatch(updateActors([{id: purchaser, changes: {capital: (this.props.actors.find(x => x.id === purchaser)?.state?.capital||0) - amountSpent}}]));
              this.props.dispatch(updateActors([{id: vote.actorId, changes: {capital: (this.props.actors.find(x => x.id === vote.actorId)?.state?.capital||0) + amountSpent}}]));
            }
            if (vote.actorId === this.props.player.id) {
              playerVote = vote;
              const offer = this.getOffers(motion, vote.vote)?.[0];
              if (!!offer?.purchaseAgreement) {
                playerDeets = offer?.purchaseAgreement;
                playerVoteString = ` (You voted ${playerVote?.vote})`;
                const amountSpent = offer.purchaseAgreement.amountSpent || 0;
                const purchaser = offer.purchaseAgreement.purchasedBy || '';
                this.props.dispatch(updateActors([{id: purchaser, changes: {capital: (this.props.actors.find(x => x.id === purchaser)?.state?.capital||0) - amountSpent}}]));
                this.props.dispatch(updateActors([{id: vote.actorId, changes: {capital: (this.props.actors.find(x => x.id === vote.actorId)?.state?.capital||0) + amountSpent}}]));
              }
            }
          });
          const yea = votes.yea.total;
          const nay = votes.nay.total;
          const playerEarnings = !!playerDeets ? ` - You were given ${playerDeets?.amountSpent} for your vote` : '';
          if (yea > nay) {
            this.props.dispatch(passMotion(motion));
            this.props.dispatch(addAlert({type: 'success', text: `${motion.name} passed` + playerVoteString + playerEarnings}));
          } else {
            this.props.dispatch(addAlert({type: 'info', text: `${motion.name} did not pass` + playerVoteString + playerEarnings}));
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

  tallyVotesFromEntity = (votes: {[id: string]: {vote: string; reason: string}}) => {
    return this.tallyVotes(Object.keys(votes).map(x => ({actorId: x, motionId: 'LIES', ...votes[x]})));
  }

  actorsVote = () => {
    timer(5000).subscribe(() => {
      this.handleVote();
      timer(10000).subscribe(() => {
        this.makeOffers();
        timer(10000).subscribe(() => {
          this.handleOffers();
        });
      });
    });
  }

  handleVote = () => {
    const tabledMotions = this.props?.availableMotions
      .map(motion => ({...motion, tabledBy: getById(this.props.motionsTabled, motion.id)?.tabledBy}))
      .filter(motion => !!motion.tabledBy)

    tabledMotions.forEach(motion => {
      const actors = getActorsWithApproval(this.props?.actors, motion);

      actors.filter(x => x.id !== this.props.player.id).forEach((actor, i) => {
        timer(Math.random() * 9000).subscribe(x => {
          this.props.dispatch(changeVote({
            actorId: actor.id,
            motionId: motion.id,
            vote: actor.position,
            reason: 'freely'
          }));
        });
      })
    });
  }

  makeOffers = () => {
    const offers: {[actorId: string]: Vote[]} = {}

    const tabledMotions = this.props?.availableMotions
      .map(motion => ({...motion, tabledBy: getById(this.props.motionsTabled, motion.id)?.tabledBy}))
      .filter(motion => !!motion.tabledBy)

    // Now they make offers!
    tabledMotions.forEach(motion => {
      const actors = getActorsWithApproval(this.props?.actors, motion);

      actors.filter(x => x.id !== this.props.player.id && Math.abs(x.approval) > 3).reverse().forEach(actor => {
        const purchaseOptions = actors
          .filter(x => x.id !== motion.tabledBy && x.id !== actor.id && (!!this.props.motionVotes[motion.id, actor.id]?.purchaseAgreement || Math.sign(actor.approval) !== Math.sign(x.approval)) ) // to filter ones who are already voting this way
          .shuffle()
          .sort((a, b) => a.costToInfluence[actor.position] > b.costToInfluence[actor.position] ? 1 : -1);

        // Actor cares enough to buy votes from other actors.
        const votes = this.tallyVotesFromEntity(this.props.motionVotes[motion.id]);
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
          .map(_actor => ({..._actor, existingVote: this.props.motionVotes[motion.id][_actor.id]}))
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
                votesBought += _actor.voteWeight;
                capital -= amountSpent;
                amountSpentSoFar += amountSpent;
                console.log(`${actor.name} wants to buy ${boughtVote.vote} vote from ${_actor.name} for ${amountSpent}`);
              }
            }
          });
        });
      });

    console.log('Offers have been extended', offers);
    this.props.dispatch(setOffers(offers));
  }

  handleOffers = () => {
    const tabledMotions = this.props?.availableMotions
      .map(motion => ({...motion, tabledBy: getById(this.props.motionsTabled, motion.id)?.tabledBy}))
      .filter(motion => !!motion.tabledBy)

    tabledMotions.forEach(motion => {
      this.props.actors
        .shuffle()
        .filter(x => this.props.player.id !== x.id && motion.tabledBy !== x.id)
        .forEach((actor, i) => {
          timer(Math.random() * 9000).subscribe(x => {
            let existingVote = this.props.motionVotes[motion.id][actor.id];
            if (!!existingVote?.purchaseAgreement) {
              return;
            }
            const personalOffers = (this.props.currentVoteOffers[actor.id]||[]).shuffle().sort((a, b) => (a.purchaseAgreement?.amountSpent||0) > (b.purchaseAgreement?.amountSpent||0) ? -1 : 1) || [];
            personalOffers.filter(offer => offer.motionId === motion.id).forEach(offer => {
              const purchaser = this.props.actors.find(x => x.id === offer.purchaseAgreement?.purchasedBy);
              const amountSpent = offer.purchaseAgreement?.amountSpent || 0;
              if (purchaser && purchaser.state.capital >= amountSpent && !(existingVote?.purchaseAgreement)) {
                // existingVoteIndex !== -1 ? changes[existingVoteIndex] = offer : changes.push(offer);
                this.props.dispatch(changeVote(offer));
                console.log(`${actor.name} agreed to vote ${offer.vote} on ${motion.name} for ${purchaser.name} in exchange for ${amountSpent}`);
              }
            });
          });
        });
    });
  }

  render = () => (
    <div className="p-5 content">
      <div className={"fade--full" + (!!this.props.availableMotions.find(x => x.id === this.props.inspectedMotion) && ' active')}></div>
      <h2>Profile</h2>
      <SettlementProfile settlement={this.props.currentSettlement} policies={this.props.policies}></SettlementProfile>
      <CurrentPhase></CurrentPhase>
      <h2 className="mt-5">Politics</h2>
      <div className="row">
        <div className="col-6">
          <h3 className="mb-3">{this.props.phase?.id === 'table' ? 'Opportunities' : 'Measures'}</h3>
          <SettlementMotions></SettlementMotions>
        </div>
        <div className="col-6 border-left">
          <h3 className="mb-3">Circle</h3>
          <SettlementCircle></SettlementCircle>
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

  const actors: ActorWithStateAndOffices[] = state.actors
    .map(x => ({...returnActorWithStateAndOffices(x, state.saveData.actorState[x.id], settlement)}))
    .sort((a, b) => Math.max(...a.offices.map(x => x.softCapitalCap)) > Math.max(...b.offices.map(x => x.softCapitalCap)) ? -1 : 1);

  return {
    phase: state.phases[state.saveData.currentPhase || 0],
    phases: state.phases,
    currentSettlement: {...settlement, derived: {profile: profile}},
    actors: actors,
    player: actors.find((x: any) => x.id === 'player') || actors[0],
    motionsTabled: state.saveData.motionsTabled,
    motionVotes: state.saveData.motionVotes,
    currentVoteOffers: state.saveData.currentVoteOffers,
    currentPhaseCountdown: state.saveData.currentPhaseCountdown,
    currentPhase: state.saveData.currentPhase,
    inspectedMotion: state.saveData.inspectedMotion,
    policies: state.policies,
    notifications: state.saveData.notifications,
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
