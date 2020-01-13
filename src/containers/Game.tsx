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
    } else if (!!tabled && actor.id === this.props.player.id && tabled.tabledBy === actor.id) {
      this.props.dispatch(rescindMotion(motionId));
      this.props.dispatch(changeVote({actorId: actor.id, motionId: motionId, vote: 'abstain', reason: 'freely'}));
      this.props.dispatch(updateActors([{id: actor.id, changes: {capital: actor.state.capital + motion.costToTable}}]));
    }
  };

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
    switch (currentPhase?.id) {
      case 'table':
        if (!this.props.motionsTabled.length) {
          this.props.dispatch(changeCurrentPhaseCountdown(0));
        }
        break;
      case 'vote':
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

        break;
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

  returnToTablePhase = () => {
    this.grantAllowance();
    this.props.dispatch(refreshAvailableMotions());
    timer(5000).subscribe(() => {
      this.props?.actors
        .filter(x => x.id !== this.props.player.id)
        .forEach((actor, i) => {
          interval(Math.random() * 15000).subscribe(() => {
            this.props.availableMotions.forEach((motion: Motion) => {
              const approval = getActorApproval(actor, motion);
              if (approval > 2.5) {
                this.table(motion.id, actor.id);
              }
            });
          })
        });
    });
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

      actors.filter(x => x.voteWeight && x.id !== this.props.player.id).forEach((actor, i) => {
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

    tabledMotions.forEach(motion => {
      // This is all the AI actors who are passionately involved and willing to make offers
      getActorsWithApproval(this.props?.actors, motion)
        .filter(x => x.id !== this.props.player.id && Math.abs(x.approval) > 3)
        .reverse()
        .forEach(actor => {
          const actors = getActorsWithApproval(this.props?.actors, motion);

          const actorsToBuyFrom = actors
            .filter(x => x.id !== motion.tabledBy && x.voteWeight > 0 && x.id !== actor.id && (!!this.props.motionVotes[motion.id, actor.id]?.purchaseAgreement || Math.sign(actor.approval) !== Math.sign(x.approval)) ) // to filter ones who are already voting this way
            .shuffle()
            .sort((a, b) => a.costToInfluence[actor.position] < b.costToInfluence[actor.position] ? 1 : -1);
      
          const votes = this.tallyVotesFromEntity(this.props?.motionVotes[motion.id]);
          const votesNeeded =
            actor.position === 'yea' ? votes.nay.total - votes.yea.total :
            actor.position === 'nay' ? votes.yea.total - votes.nay.total :
            0;

          // Actor cares enough to buy this many votes from other actors.
          const votesToBuy = ((votesNeeded + 1) * 1.33) + 1 + Math.abs(actor.approval / 10);
          const amountToSpend = actor.id === motion.tabledBy ? actor.state.capital : (actor.state.capital / 2); // TODO: Base off approval -- more passion, more $$$
          if (votesToBuy > 0) {
            console.log(`${actor.name} wants "${actor.position}" vote on ${motion.name}: Needs ${votesNeeded} votes, wants ${votesToBuy - votesNeeded} extra`, actorsToBuyFrom);
          }

          let votesBought = 0;
          let capital = actor.state.capital;
          let amountSpentSoFar = 0;
          actorsToBuyFrom
            .map(_actor => ({..._actor, existingVote: this.props.motionVotes[motion.id][_actor.id]}))
            .filter(x => x.costToInfluence[actor.position] <= amountToSpend - amountSpentSoFar)
            .forEach(actorToBuyFrom => {
              if (votesBought >= votesToBuy) {
                // If we have all our votes, time to stop.
                return;
              }
              let amountToSpendOnOffer = actorToBuyFrom.costToInfluence[actor.position];
              const existingOffers = [...(this.props?.currentVoteOffers[actorToBuyFrom.id] || []), ...(offers[actorToBuyFrom.id] || [])].filter(x => x.motionId === motion.id);
              const topOffer = existingOffers.sort((a, b) => (a.purchaseAgreement?.amountSpent||0) > (b.purchaseAgreement?.amountSpent||0) ? -1 : 1)[0];
              if (existingOffers.length && (topOffer.vote === actor.position || topOffer.purchaseAgreement?.purchasedBy === 'player')) {
                return;
              }
              if (existingOffers.length) {
                // Make sure to go above the existing offer
                amountToSpendOnOffer = Math.max(
                  amountToSpendOnOffer,
                  Math.max(...existingOffers.filter(x => x.vote !== actor.position).map(x => x.purchaseAgreement?.amountSpent || 0)) + 100
                );
              }
              amountToSpendOnOffer = Math.round(amountToSpendOnOffer);
              if (amountSpentSoFar + amountToSpendOnOffer > amountToSpend) {
                // If it's too costly, forget it
                return;
              }
              const offer: Vote = {
                actorId: actorToBuyFrom.id,
                motionId: motion.id,
                reason: 'bought',
                purchaseAgreement: {
                  purchasedBy: actor.id,
                  amountSpent: amountToSpendOnOffer
                },
                vote: actor.position
              };
              if (capital >= (offer.purchaseAgreement?.amountSpent || 0)) {
                console.log(`${actor.name} wants to buy ${offer.vote} vote from ${actorToBuyFrom.name} for ${amountToSpendOnOffer}`);
                offers[offer.actorId] = offers[offer.actorId] || [];
                offers[offer.actorId].push(offer);
                votesBought += actorToBuyFrom.voteWeight;
                capital -= offer.purchaseAgreement?.amountSpent || 0;
                amountSpentSoFar += offer.purchaseAgreement?.amountSpent || 0;
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
            let existingVote = this.props.motionVotes[motion.id]?.[actor.id];
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
      <div>
        {false && this.props?.notifications.map((x, i) => (
          <div className={`alert alert-${x.type}`}>{x.text}</div>
        ))}
      </div>
      <div onClick={() => {this.props.dispatch(inspectMotion(''))}} className={"fade--full" + (!!this.props.availableMotions.find(x => x.id === this.props.inspectedMotion) ? ' active' : '')}></div>
      <h2>Profile</h2>
      <SettlementProfile settlement={this.props.currentSettlement} policies={this.props.policies}></SettlementProfile>
      <CurrentPhase></CurrentPhase>
      <h2 className="mt-5">Politics</h2>
      <div className="row">
        <div className="col-5">
          <h3 className="mb-3">Circle</h3>
          <SettlementCircle></SettlementCircle>
        </div>
        <div className="col-7">
          <h3 className="mb-3">{this.props.phase?.id === 'table' ? 'Opportunities' : 'Measures'}</h3>
          <SettlementMotions></SettlementMotions>
        </div>
      </div>
    </div>
  );
}

const mapStateToProps = (state: State) => {
  const settlement = state.settlements.map(x => ({...x, state: state.saveData.settlementState[x.id]}))[0];
  const profile: {[id: string]: number} = {purpose: 0, joy: 0, education: 0, vigilance: 0, dignity: 0, charity: 0, creativity: 0, openness: 0};
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
